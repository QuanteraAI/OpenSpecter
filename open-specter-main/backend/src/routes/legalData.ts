import { Router } from "express";
import { readFileSync } from "fs";
import { join } from "path";
import { requireAuth } from "../middleware/auth";
import { createServerSupabase } from "../lib/supabase";

export const legalDataRouter = Router();

const LDH_BASE = "https://legaldatahunter.com/v1";

// ─── Server-side countries cache ─────────────────────────────────────────────
// The list of jurisdictions changes at most a few times a year. We bundle a
// static snapshot at boot so even when the upstream is down/slow, every user
// gets an instant response. The snapshot is silently refreshed from upstream
// on a 24h cadence (and on first request after server boot).
//
//   - Bundled snapshot: src/data/legal-countries.json — primed at startup
//   - TTL: 24h before background refresh
//   - Stale fallback: keep serving the cached body if upstream fails
const COUNTRIES_TTL_MS = 24 * 60 * 60 * 1000;
const COUNTRIES_UPSTREAM_TIMEOUT_MS = 25_000;

interface CountriesCache {
    body: string;
    fetchedAt: number;
}
let countriesCache: CountriesCache | null = null;
let inflightCountries: Promise<CountriesCache | null> | null = null;

// Prime cache from the bundled snapshot at module load — instant first hit.
try {
    const snapshotPath = join(__dirname, "..", "data", "legal-countries.json");
    const snapshot = readFileSync(snapshotPath, "utf-8");
    countriesCache = { body: snapshot, fetchedAt: 0 }; // fetchedAt=0 forces background refresh on first request
    console.log("[legal-data] primed countries cache from bundled snapshot");
} catch (err) {
    console.warn("[legal-data] no bundled countries snapshot found", err);
}

async function fetchCountriesUpstream(
    apiKey: string,
): Promise<CountriesCache | null> {
    const controller = new AbortController();
    const timer = setTimeout(
        () => controller.abort(),
        COUNTRIES_UPSTREAM_TIMEOUT_MS,
    );
    try {
        const res = await fetch(`${LDH_BASE}/discover/countries`, {
            headers: { Authorization: `Bearer ${apiKey}` },
            signal: controller.signal,
        });
        if (!res.ok) {
            console.error(
                `[legal-data] upstream non-OK ${res.status} for /countries`,
            );
            return null;
        }
        const body = await res.text();
        return { body, fetchedAt: Date.now() };
    } catch (err) {
        console.error("[legal-data] countries upstream error", err);
        return null;
    } finally {
        clearTimeout(timer);
    }
}

function refreshCountriesInBackground(apiKey: string): void {
    if (inflightCountries) return;
    inflightCountries = fetchCountriesUpstream(apiKey).then((result) => {
        if (result) countriesCache = result;
        inflightCountries = null;
        return result;
    });
}

/**
 * Returns the cached body if available, refreshing in the background when
 * stale. Returns null only when there is NO cache (no bundled snapshot AND
 * no successful upstream fetch yet) AND the upstream fetch fails.
 */
async function getCountriesBody(apiKey: string): Promise<string | null> {
    const now = Date.now();
    // Hot cache (or bundled snapshot): serve immediately, refresh in background
    // when stale (anything older than the TTL, or the bundled snapshot which
    // has fetchedAt=0).
    if (countriesCache) {
        if (now - countriesCache.fetchedAt > COUNTRIES_TTL_MS) {
            refreshCountriesInBackground(apiKey);
        }
        return countriesCache.body;
    }
    // Truly cold: must wait for the in-flight fetch (or trigger one).
    if (!inflightCountries) refreshCountriesInBackground(apiKey);
    const result = await inflightCountries;
    return result ? result.body : null;
}

// Trigger a background refresh at server boot so the cache is fresh-ish on
// the first user click.
const BOOT_API_KEY = process.env.LEGAL_DATA_HUNTER_API_KEY;
if (BOOT_API_KEY) {
    refreshCountriesInBackground(BOOT_API_KEY);
}

/** Resolve the LDH API key: user's own key first, then system default env. */
async function resolveLegalDataHunterKey(
    userId: string,
    db: ReturnType<typeof createServerSupabase>,
): Promise<string | null> {
    // Select * so a missing column (pre-migration) doesn't throw.
    const { data } = await db
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
    const userKey = (data as Record<string, unknown> | null)?.[
        "legal_data_hunter_api_key"
    ];
    if (typeof userKey === "string" && userKey.trim()) return userKey.trim();
    return process.env.LEGAL_DATA_HUNTER_API_KEY ?? null;
}

/** GET /api/legal-data/countries — list countries with document counts. */
legalDataRouter.get("/countries", requireAuth, async (_req, res) => {
    const userId = res.locals.userId as string;
    const db = createServerSupabase();
    const apiKey = await resolveLegalDataHunterKey(userId, db);
    if (!apiKey) {
        return void res.status(400).json({
            detail: "LegalDataHunter API key is not configured.",
        });
    }

    const body = await getCountriesBody(apiKey);
    if (body) {
        return void res
            .status(200)
            .setHeader("content-type", "application/json")
            .setHeader(
                "cache-control",
                // 1 hour browser cache + stale-while-revalidate so even on
                // hard reload the request is satisfied from the local cache.
                "private, max-age=3600, stale-while-revalidate=86400",
            )
            .send(body);
    }
    res.status(502).json({ detail: "LegalDataHunter upstream failure." });
});

/** POST /api/legal-data/search — hybrid semantic + keyword search. */
legalDataRouter.post("/search", requireAuth, async (req, res) => {
    const userId = res.locals.userId as string;
    const db = createServerSupabase();
    const apiKey = await resolveLegalDataHunterKey(userId, db);
    if (!apiKey) {
        return void res.status(400).json({
            detail: "LegalDataHunter API key is not configured.",
        });
    }

    const {
        q,
        country,
        namespace,
        top_k,
        alpha,
        source,
        court,
        court_tier,
        jurisdiction,
        language,
        date_start,
        date_end,
    } = req.body ?? {};
    if (typeof q !== "string" || !q.trim()) {
        return void res.status(400).json({ detail: "`q` is required." });
    }

    // Forward ONLY the keys the upstream API recognises.
    const payload: Record<string, unknown> = { q: q.trim() };
    if (country) {
        // Upstream expects an array of ISO codes.
        payload.country = Array.isArray(country) ? country : [country];
    }
    if (namespace && namespace !== "all") payload.namespace = namespace;
    if (top_k) payload.top_k = top_k;
    if (alpha !== undefined) payload.alpha = alpha;
    if (source) payload.source = source;
    if (court) payload.court = court;
    if (court_tier) payload.court_tier = court_tier;
    if (jurisdiction) payload.jurisdiction = jurisdiction;
    if (language) payload.language = language;
    if (date_start) payload.date_start = date_start;
    if (date_end) payload.date_end = date_end;

    try {
        const upstream = await fetch(`${LDH_BASE}/search`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "content-type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        const body = await upstream.text();
        res.status(upstream.status)
            .setHeader("content-type", "application/json")
            .send(body);
    } catch (err) {
        console.error("[legal-data] search upstream error", err);
        res.status(502).json({
            detail: "LegalDataHunter upstream failure.",
        });
    }
});
