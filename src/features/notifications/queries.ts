// Design Ref: §3.5, §4.2 — 상단 알림 종에 보여 줄 최근 알림 조회
// 알림은 진행상황이 바뀔 때 데이터베이스가 자동으로 남긴다 (supabase/migrations/…_notifications.sql). 앱은 읽기만 한다
import { createClient } from "@/lib/supabase/server";

/** 알림 목록에 보여 줄 최대 건수 (DESIGN §3.5) */
export const NOTIFICATION_LIMIT = 20;

export type NotificationRow = {
  id: string;
  /** 어느 물건의 알림인지 (누르면 그 물건의 수정 화면으로 간다) */
  item_id: string;
  /** 예: "서울 아파트: 낙찰 → 완납 (kim)" */
  message: string;
  created_at: string;
};

export type RecentNotifications =
  | { ok: true; items: NotificationRow[] }
  | { ok: false };

export async function getRecentNotifications(): Promise<RecentNotifications> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, item_id, message, created_at")
    .order("created_at", { ascending: false })
    .limit(NOTIFICATION_LIMIT);

  if (error) return { ok: false };
  return { ok: true, items: (data ?? []) as NotificationRow[] };
}
