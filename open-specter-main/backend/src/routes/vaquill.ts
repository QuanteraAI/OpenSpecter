import { Router } from "express";
import { requireAuth } from "../middleware/auth";

export const vaquillRouter = Router();

const VAQUILL_BASE = "https://api.vaquill.ai/api/v1";

/**
 * Vaquill (https://www.vaquill.ai/legal-api) is an alternative legal-research
 * provider. It exposes AI-grounded Q&A across US primary law (Constitution,
 * USC, CFR, Federal Rules of Procedure, all 50 state statute codes, state
 * constitutions, state court rules, Executive Orders since 2015) plus Indian
 * case law (31M+ judgments) and citation-graph traversal.
 *
 * This router sits alongside legalData.ts (LegalDataHunter) so operators can
 * pick whichever provider suits their corpus needs. Both can be enabled
 * simultaneously; the frontend chooses which to call.
 *
 * Configure VAQUILL_API_KEY in backend/.env. Key format: vq_key_...
 */

function resolveVaquillKey(): string | null {
    const key = process.env.VAQUILL_API_KEY;
    return typeof key === "string" && key.trim() ? key.trim() : null;
}

/**
 * POST /vaquill/ask: AI-grounded legal Q&A.
 *
 * Body:
 *   - question (required, string)
 *   - countryCode (optional, "US" | "IN", defaults upstream)
 *   - usState (optional, e.g. "tx")
 *   - mode (optional, "standard" | "deep")
 */
vaquillRouter.post("/ask", requireAuth, async (req, res) => {
    const apiKey = resolveVaquillKey();
    if (!apiKey) {
        return void res.status(400).json({
            detail: "Vaquill API key is not configured.",
        });
    }

    const { question, countryCode, usState, mode } = req.body ?? {};
    if (typeof question !== "string" || !question.trim()) {
        return void res
            .status(400)
            .json({ detail: "`question` is required." });
    }

    const payload: Record<string, unknown> = { question: question.trim() };
    if (countryCode) payload.countryCode = countryCode;
    if (usState) payload.usState = usState;
    if (mode) payload.mode = mode;

    try {
        const upstream = await fetch(`${VAQUILL_BASE}/ask`, {
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
        console.error("[vaquill] ask upstream error", err);
        res.status(502).json({
            detail: "Vaquill upstream failure.",
        });
    }
});

/**
 * POST /vaquill/statutes/search: Search US primary law and Indian acts.
 *
 * Body:
 *   - q (required, string)
 *   - corpusType (optional, one of: USC, CFR, STATE, CONSTITUTION, FEDERAL_RULES, STATE_CONSTITUTION, STATE_RULES, EXECUTIVE_ACTION)
 *   - state (optional, ISO state code e.g. "tx" to restrict STATE-scoped corpora)
 *   - titleNumber (optional, integer)
 *   - limit (optional, integer)
 */
vaquillRouter.post("/statutes/search", requireAuth, async (req, res) => {
    const apiKey = resolveVaquillKey();
    if (!apiKey) {
        return void res.status(400).json({
            detail: "Vaquill API key is not configured.",
        });
    }

    const { q, corpusType, state, titleNumber, limit } = req.body ?? {};
    if (typeof q !== "string" || !q.trim()) {
        return void res.status(400).json({ detail: "`q` is required." });
    }

    const payload: Record<string, unknown> = { q: q.trim() };
    if (corpusType) payload.corpusType = corpusType;
    if (state) payload.state = state;
    if (titleNumber) payload.titleNumber = titleNumber;
    if (limit) payload.limit = limit;

    try {
        const upstream = await fetch(`${VAQUILL_BASE}/statutes/search`, {
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
        console.error("[vaquill] statutes search upstream error", err);
        res.status(502).json({
            detail: "Vaquill upstream failure.",
        });
    }
});
