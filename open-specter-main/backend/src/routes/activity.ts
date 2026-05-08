import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createServerSupabase } from "../lib/supabase";

export const activityRouter = Router();

const MAX_LIMIT = 10;

function entityUrl(event: {
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  project_id?: string | null;
}) {
  if (!event.entity_id) return null;
  if (event.entity_type === "chat") {
    return event.project_id
      ? `/projects/${event.project_id}/assistant/chat/${event.entity_id}`
      : `/assistant/chat/${event.entity_id}`;
  }
  if (event.entity_type === "tabular_review") return `/tabular-reviews/${event.entity_id}`;
  if (event.entity_type === "workflow") return `/workflows/${event.entity_id}`;
  return null;
}

activityRouter.get("/recent", requireAuth, async (req, res) => {
  const userId = res.locals.userId as string;
  const requested = Number(req.query.limit ?? MAX_LIMIT);
  const limit = Number.isFinite(requested)
    ? Math.max(1, Math.min(MAX_LIMIT, Math.floor(requested)))
    : MAX_LIMIT;
  const db = createServerSupabase();

  const { data, error } = await db
    .from("activity_events")
    .select("id, event_type, entity_type, entity_id, project_id, title, metadata, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return void res.status(500).json({ detail: error.message });

  const events = (data ?? []).map((event) => ({
    ...event,
    entity_url: entityUrl(event),
  }));

  res.json(events);
});
