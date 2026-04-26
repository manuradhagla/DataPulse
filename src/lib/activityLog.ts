import { supabase } from "@/integrations/supabase/client";

// Lightweight client-side activity logger.
// Best-effort: never throw — analytics/upload UX should not break if logging fails.
export type ActivityAction =
  | "upload"
  | "delete"
  | "analytics_run"
  | "download_original"
  | "export_report";

export async function logActivity(
  userId: string,
  action: ActivityAction,
  targetName?: string | null,
  details?: Record<string, unknown>,
) {
  try {
    await supabase.from("activity_logs").insert({
      user_id: userId,
      action,
      target_name: targetName ?? null,
      details: (details ?? {}) as never,
    });
  } catch {
    // swallow — logging must never block the user
  }
}
