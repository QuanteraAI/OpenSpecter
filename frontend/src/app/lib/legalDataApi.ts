import { supabase } from "@/lib/supabase";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export interface LegalCountry {
    code: string;
    case_law_sources: number;
    legislation_sources: number;
    doctrine_sources: number;
    total_documents: number;
}

export interface LegalHit {
    id: string;
    source: string;
    source_id: string;
    score: number;
    title: string;
    snippet: string;
    url: string | null;
    country: string | null;
    court: string | null;
    court_tier: number | null;
    date: string | null;
    jurisdiction: string | null;
    language: string | null;
    ecli: string | null;
    case_number: string | null;
    authority: string | null;
    document_type: string | null;
    quality_tier: string | null;
}

export interface LegalSearchResponse {
    query: string;
    hits: LegalHit[];
    total_hits: number;
    namespace: string | null;
    alpha: number;
    elapsed_ms: number;
}

async function authHeader(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Not authenticated");
    return { Authorization: `Bearer ${token}` };
}

// Module-level cache so the countries list is fetched only once per session.
let countriesPromise: Promise<LegalCountry[]> | null = null;

const COUNTRIES_CACHE_KEY = "ldh:countries:v1";

function readCachedCountries(): LegalCountry[] | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = sessionStorage.getItem(COUNTRIES_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
        // ignore
    }
    return null;
}

function writeCachedCountries(list: LegalCountry[]): void {
    if (typeof window === "undefined") return;
    try {
        sessionStorage.setItem(COUNTRIES_CACHE_KEY, JSON.stringify(list));
    } catch {
        // ignore quota errors
    }
}

export function prefetchLegalCountries(): Promise<LegalCountry[]> {
    if (!countriesPromise) {
        const cached = readCachedCountries();
        if (cached) {
            countriesPromise = Promise.resolve(cached);
            // Refresh in the background.
            fetchLegalCountriesImpl()
                .then((fresh) => {
                    writeCachedCountries(fresh);
                    countriesPromise = Promise.resolve(fresh);
                })
                .catch(() => {
                    /* keep stale cache */
                });
            return countriesPromise;
        }
        countriesPromise = fetchLegalCountriesImpl()
            .then((list) => {
                writeCachedCountries(list);
                return list;
            })
            .catch((err) => {
                // Reset cache on failure so the next call retries.
                countriesPromise = null;
                throw err;
            });
    }
    return countriesPromise;
}

async function fetchLegalCountriesImpl(): Promise<LegalCountry[]> {
    const res = await fetch(`${API_BASE}/legal-data/countries`, {
        headers: await authHeader(),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Countries fetch failed (${res.status}): ${body}`);
    }
    const data = await res.json();
    const countries = Array.isArray(data) ? data : data.countries ?? [];
    return countries.filter((c: LegalCountry) => c.total_documents > 0);
}

export function fetchLegalCountries(): Promise<LegalCountry[]> {
    return prefetchLegalCountries();
}

export async function searchLegalData(params: {
    q: string;
    country?: string | null;
    namespace?: "case_law" | "legislation" | "doctrine" | "all" | null;
    top_k?: number;
}): Promise<LegalSearchResponse> {
    const body: Record<string, unknown> = { q: params.q };
    if (params.country) body.country = params.country;
    if (params.namespace && params.namespace !== "all")
        body.namespace = params.namespace;
    body.top_k = params.top_k ?? 5;

    const res = await fetch(`${API_BASE}/legal-data/search`, {
        method: "POST",
        headers: {
            ...(await authHeader()),
            "content-type": "application/json",
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Search failed (${res.status}): ${text}`);
    }
    return res.json();
}

/** Markers used by the UserMessage renderer to extract the legal context
 *  block from the user message content. Keep these stable — chats persisted
 *  in the database use them, and changing them would break parsing of
 *  historical messages. */
export const LEGAL_CONTEXT_OPEN_TAG = "[[LDH:CTX:START]]";
export const LEGAL_CONTEXT_CLOSE_TAG = "[[LDH:CTX:END]]";

/** Build a markdown research-context block to prepend to the user message. */
export function buildLegalContextBlock(
    hits: LegalHit[],
    params: { country: string | null; namespace: string | null },
): string {
    if (hits.length === 0) return "";

    const countryLabel = params.country ?? "Any country";
    const namespaceLabel =
        params.namespace && params.namespace !== "all"
            ? params.namespace.replace("_", " ")
            : "all types";

    const lines: string[] = [];
    lines.push(LEGAL_CONTEXT_OPEN_TAG);
    lines.push(`**Legal research context** retrieved from LegalDataHunter`);
    lines.push(`(Scope: ${countryLabel} · ${namespaceLabel})`);
    lines.push("");

    hits.forEach((h, i) => {
        const meta = [
            h.court,
            h.date,
            h.ecli || h.case_number || h.source_id,
        ]
            .filter(Boolean)
            .join(" · ");
        const snippet = (h.snippet || "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 380);
        lines.push(`[${i + 1}] **${h.title}**`);
        if (meta) lines.push(`   _${meta}_`);
        if (snippet)
            lines.push(`   > ${snippet}${snippet.length >= 380 ? "…" : ""}`);
        if (h.url) lines.push(`   [Source](${h.url})`);
        lines.push("");
    });

    lines.push("---");
    lines.push(
        "**Citation rules**: When you rely on any of the authorities above, cite them inline as numbered hyperlinks — e.g. `[1](url)`, `[2](url)` — using the URL given for each authority. End your reply with a short `## Sources` section that lists each authority you cited (title, court, date, hyperlinked URL). Do not invent authorities; only cite from the list above.",
    );
    lines.push(LEGAL_CONTEXT_CLOSE_TAG);

    return lines.join("\n");
}

/** A parsed authority for the UserMessage pill renderer. */
export interface ParsedLegalAuthority {
    index: number;
    title: string;
    meta: string | null;
    snippet: string | null;
    url: string | null;
}

export interface ParsedLegalContext {
    /** Original block, including delimiters. */
    raw: string;
    scope: string | null;
    authorities: ParsedLegalAuthority[];
}

/**
 * Extracts the legal-context block from a user message. Returns null when
 * the message has no legal context. The remaining `userText` is the user's
 * actual question with the block (and any leading/trailing separator)
 * stripped.
 */
export function extractLegalContext(content: string): {
    context: ParsedLegalContext | null;
    userText: string;
} {
    const start = content.indexOf(LEGAL_CONTEXT_OPEN_TAG);
    const end = content.indexOf(LEGAL_CONTEXT_CLOSE_TAG);
    if (start < 0 || end < 0 || end <= start) {
        return { context: null, userText: content };
    }

    const raw = content.slice(
        start,
        end + LEGAL_CONTEXT_CLOSE_TAG.length,
    );
    // Strip the block + any "---" or whitespace surrounding it from the
    // remaining user text.
    let userText =
        content.slice(0, start) +
        content.slice(end + LEGAL_CONTEXT_CLOSE_TAG.length);
    userText = userText.replace(/^[\s-]+|[\s-]+$/g, "").trim();

    // Parse authorities out of the block.
    const inner = raw
        .replace(LEGAL_CONTEXT_OPEN_TAG, "")
        .replace(LEGAL_CONTEXT_CLOSE_TAG, "");

    const scopeMatch = inner.match(/\(Scope:\s*([^)]+)\)/);
    const scope = scopeMatch ? scopeMatch[1].trim() : null;

    const authorities: ParsedLegalAuthority[] = [];
    // Split by lines starting with "[N] **" — each authority block follows.
    const lines = inner.split("\n");
    let current: ParsedLegalAuthority | null = null;
    for (const line of lines) {
        const titleMatch = line.match(/^\[(\d+)\]\s+\*\*(.+?)\*\*\s*$/);
        if (titleMatch) {
            if (current) authorities.push(current);
            current = {
                index: parseInt(titleMatch[1], 10),
                title: titleMatch[2].trim(),
                meta: null,
                snippet: null,
                url: null,
            };
            continue;
        }
        if (!current) continue;
        const metaMatch = line.match(/^\s*_(.+)_\s*$/);
        if (metaMatch && !current.meta) {
            current.meta = metaMatch[1].trim();
            continue;
        }
        const snippetMatch = line.match(/^\s*>\s+(.*)$/);
        if (snippetMatch && !current.snippet) {
            current.snippet = snippetMatch[1].trim();
            continue;
        }
        const urlMatch = line.match(/\[Source\]\((https?:[^\s)]+)\)/);
        if (urlMatch && !current.url) {
            current.url = urlMatch[1];
            continue;
        }
        if (line.trim() === "---") {
            // End of authorities → break before citation rules.
            break;
        }
    }
    if (current) authorities.push(current);

    return {
        context: { raw, scope, authorities },
        userText,
    };
}

/**
 * Country display names for the UI (code → name). Falls back to ISO code.
 * Keeps this list client-side to avoid an extra round-trip. Covers all
 * countries returned by the LegalDataHunter corpus.
 */
export const COUNTRY_NAMES: Record<string, string> = {
    US: "United States",
    FR: "France",
    AT: "Austria",
    CH: "Switzerland",
    BR: "Brazil",
    DE: "Germany",
    UK: "United Kingdom",
    INTL: "International",
    ME: "Montenegro",
    IT: "Italy",
    RU: "Russia",
    HR: "Croatia",
    MX: "Mexico",
    IN: "India",
    AU: "Australia",
    UN: "United Nations",
    AR: "Argentina",
    PT: "Portugal",
    ES: "Spain",
    BE: "Belgium",
    BG: "Bulgaria",
    TH: "Thailand",
    NL: "Netherlands",
    AM: "Armenia",
    GE: "Georgia",
    GR: "Greece",
    KZ: "Kazakhstan",
    CA: "Canada",
    PL: "Poland",
    FI: "Finland",
    CoE: "Council of Europe",
    EU: "European Union",
    CZ: "Czechia",
    KR: "South Korea",
    TR: "Türkiye",
    SI: "Slovenia",
    CO: "Colombia",
    DK: "Denmark",
    PH: "Philippines",
    HU: "Hungary",
    SK: "Slovakia",
    IE: "Ireland",
    CV: "Cabo Verde",
    CR: "Costa Rica",
    GT: "Guatemala",
    LV: "Latvia",
    JP: "Japan",
    LU: "Luxembourg",
    DJ: "Djibouti",
    EE: "Estonia",
    VN: "Vietnam",
    AZ: "Azerbaijan",
    CY: "Cyprus",
    RS: "Serbia",
    BA: "Bosnia and Herzegovina",
    UY: "Uruguay",
    MO: "Macao",
    BO: "Bolivia",
    MC: "Monaco",
    NI: "Nicaragua",
    LT: "Lithuania",
    CN: "China",
    UA: "Ukraine",
    OM: "Oman",
    PE: "Peru",
    CL: "Chile",
    SE: "Sweden",
    MD: "Moldova",
    NO: "Norway",
    LK: "Sri Lanka",
    MU: "Mauritius",
    MN: "Mongolia",
    SG: "Singapore",
    NR: "Nauru",
    MP: "Northern Mariana Islands",
    MK: "North Macedonia",
    FO: "Faroe Islands",
    PY: "Paraguay",
    SR: "Suriname",
    AD: "Andorra",
    CW: "Curaçao",
    AL: "Albania",
    EC: "Ecuador",
    IM: "Isle of Man",
    KG: "Kyrgyzstan",
    ID: "Indonesia",
    BH: "Bahrain",
    DZ: "Algeria",
    KH: "Cambodia",
    LI: "Liechtenstein",
    IS: "Iceland",
    MT: "Malta",
    KE: "Kenya",
    BM: "Bermuda",
    BS: "Bahamas",
    TW: "Taiwan",
    HK: "Hong Kong",
    NZ: "New Zealand",
    XK: "Kosovo",
    GU: "Guam",
    TN: "Tunisia",
    FJ: "Fiji",
    BD: "Bangladesh",
    AG: "Antigua and Barbuda",
    CU: "Cuba",
    SM: "San Marino",
    LY: "Libya",
    TO: "Tonga",
    TC: "Turks and Caicos Islands",
    EG: "Egypt",
    MY: "Malaysia",
    AW: "Aruba",
    ET: "Ethiopia",
    RO: "Romania",
    JE: "Jersey",
    PK: "Pakistan",
    ZA: "South Africa",
    NG: "Nigeria",
    BJ: "Benin",
    ZM: "Zambia",
    GN: "Guinea",
    KY: "Cayman Islands",
    VI: "U.S. Virgin Islands",
    FK: "Falkland Islands",
    PM: "Saint Pierre and Miquelon",
    BN: "Brunei",
    KN: "Saint Kitts and Nevis",
    GI: "Gibraltar",
    RW: "Rwanda",
    LS: "Lesotho",
    BQ: "Bonaire, Sint Eustatius and Saba",
    VE: "Venezuela",
    QA: "Qatar",
    NA: "Namibia",
    OECD: "OECD",
    GG: "Guernsey",
    ZW: "Zimbabwe",
    AI: "Anguilla",
    PF: "French Polynesia",
    SZ: "Eswatini",
    MW: "Malawi",
    SC: "Seychelles",
    SH: "Saint Helena",
    CD: "DR Congo",
    VG: "British Virgin Islands",
    MH: "Marshall Islands",
    PA: "Panama",
    AE: "United Arab Emirates",
    VA: "Vatican City",
    VC: "Saint Vincent and the Grenadines",
    BL: "Saint Barthélemy",
    DM: "Dominica",
    MF: "Saint Martin",
    SL: "Sierra Leone",
    BY: "Belarus",
    CK: "Cook Islands",
    BB: "Barbados",
    GD: "Grenada",
    UZ: "Uzbekistan",
    DO: "Dominican Republic",
    SY: "Syria",
    TL: "Timor-Leste",
    GL: "Greenland",
    WF: "Wallis and Futuna",
    TZ: "Tanzania",
    MA: "Morocco",
    JM: "Jamaica",
    GM: "Gambia",
    MM: "Myanmar",
    MR: "Mauritania",
    TG: "Togo",
    KW: "Kuwait",
    JO: "Jordan",
    CI: "Côte d'Ivoire",
    UG: "Uganda",
    GH: "Ghana",
    SV: "El Salvador",
    SN: "Senegal",
};
