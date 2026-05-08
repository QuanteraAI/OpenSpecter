// Supabase Edge Function — cleanup-anonymous-users
//
// Deletes anonymous (is_anonymous = true) auth users whose accounts are older
// than 7 days. Anonymous accounts cascade-delete their owned rows (projects,
// documents, chats, tabular_reviews, …) via the FK ON DELETE CASCADE on
// auth.users in the schema we already use.
//
// Anonymous users who have completed the upgrade flow are NO LONGER anonymous
// (`updateUser({ email, password })` flips `is_anonymous` to false), so they
// are never matched here. Their data is preserved.
//
// Deploy:
//   supabase functions deploy cleanup-anonymous-users
//
// Schedule (run daily at 03:00 UTC) via pg_cron — see the SQL migration in
//   /app/supabase/migrations/20260205_schedule_cleanup_anonymous.sql

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set as Edge Function secrets",
    );
}

const ANONYMOUS_TTL_DAYS = 7;
const PAGE_SIZE = 200;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

interface CleanupResult {
    scanned: number;
    deleted: number;
    skipped: number;
    errors: { user_id: string; error: string }[];
    duration_ms: number;
}

async function cleanupAnonymousUsers(): Promise<CleanupResult> {
    const startedAt = Date.now();
    const cutoff = new Date(
        Date.now() - ANONYMOUS_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    const result: CleanupResult = {
        scanned: 0,
        deleted: 0,
        skipped: 0,
        errors: [],
        duration_ms: 0,
    };

    let page = 1;
    while (true) {
        const { data, error } = await admin.auth.admin.listUsers({
            page,
            perPage: PAGE_SIZE,
        });
        if (error) {
            result.errors.push({ user_id: "list", error: error.message });
            break;
        }
        const users = data.users ?? [];
        if (users.length === 0) break;
        result.scanned += users.length;

        const stale = users.filter(
            (u) =>
                u.is_anonymous === true &&
                new Date(u.created_at) < cutoff,
        );

        for (const u of stale) {
            const { error: delErr } = await admin.auth.admin.deleteUser(u.id);
            if (delErr) {
                result.errors.push({ user_id: u.id, error: delErr.message });
            } else {
                result.deleted += 1;
            }
        }

        result.skipped += users.length - stale.length;

        if (users.length < PAGE_SIZE) break;
        page += 1;
    }

    result.duration_ms = Date.now() - startedAt;
    return result;
}

Deno.serve(async (req) => {
    // Require a shared-secret header so only pg_cron / your platform can invoke.
    const expected = Deno.env.get("CLEANUP_FUNCTION_SECRET");
    if (expected) {
        const got = req.headers.get("x-cleanup-secret");
        if (got !== expected) {
            return new Response(
                JSON.stringify({ error: "Forbidden" }),
                { status: 403, headers: { "content-type": "application/json" } },
            );
        }
    }

    try {
        const result = await cleanupAnonymousUsers();
        return new Response(JSON.stringify(result, null, 2), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    } catch (err) {
        return new Response(
            JSON.stringify({ error: (err as Error).message }),
            { status: 500, headers: { "content-type": "application/json" } },
        );
    }
});
