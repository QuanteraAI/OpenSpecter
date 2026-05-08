import type { SupabaseClient } from "@supabase/supabase-js";

type ActivityEventType =
  | "assistant_chat_created"
  | "tabular_review_created"
  | "workflow_used";

interface ActivityInput {
  db: SupabaseClient;
  userId: string;
  eventType: ActivityEventType;
  title: string;
  entityType?: string | null;
  entityId?: string | null;
  projectId?: string | null;
  metadata?: Record<string, unknown>;
}

interface ActivityLookupInput {
  db: SupabaseClient;
  userId: string;
  eventType: ActivityEventType;
  entityType: string;
  entityId: string;
}

export async function activityEventExists({
  db,
  userId,
  eventType,
  entityType,
  entityId,
}: ActivityLookupInput) {
  try {
    const { count, error } = await db
      .from("activity_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("event_type", eventType)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId);
    if (error) {
      console.warn("[activity] failed to check existing event", error.message);
      return false;
    }
    return (count ?? 0) > 0;
  } catch (err) {
    console.warn("[activity] failed to check existing event", err);
    return false;
  }
}

export async function updateActivityTitle({
  db,
  userId,
  entityType,
  entityId,
  title,
}: {
  db: SupabaseClient;
  userId: string;
  entityType: string;
  entityId: string;
  title: string;
}) {
  try {
    const { error } = await db
      .from("activity_events")
      .update({ title })
      .eq("user_id", userId)
      .eq("event_type", "assistant_chat_created")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId);
    if (error) console.warn("[activity] failed to update title", error.message);
  } catch (err) {
    console.warn("[activity] failed to update title", err);
  }
}

export async function logActivityEvent({
  db,
  userId,
  eventType,
  title,
  entityType = null,
  entityId = null,
  projectId = null,
  metadata = {},
}: ActivityInput) {
  try {
    const { error } = await db.from("activity_events").insert({
      user_id: userId,
      project_id: projectId,
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      title,
      metadata,
    });
    if (error) {
      // Never block the primary product flow because activity tracking failed.
      console.warn("[activity] failed to record event", error.message);
    }
  } catch (err) {
    console.warn("[activity] failed to record event", err);
  }
}

export function titleFromPrompt(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  return clean.length > 90 ? `${clean.slice(0, 87)}...` : clean;
}
