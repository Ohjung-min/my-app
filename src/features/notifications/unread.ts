// Design Ref: §4.2 — "읽음" 표시는 사람별 테이블을 두지 않고, 각자 브라우저에 "마지막으로 본 알림 시각"만 저장한다
// (기기를 바꾸면 읽음 표시가 초기화된다. DESIGN §11 결정 3)
// 브라우저 저장소를 건드리지 않는 순수한 계산만 둔다
import type { NotificationRow } from "./queries";

/** 마지막으로 본 시각(없으면 빈 글자) 뒤에 생긴 알림인가 */
export function isUnread(
  notification: Pick<NotificationRow, "created_at">,
  lastSeen: string,
): boolean {
  if (!lastSeen) return true;
  const seen = Date.parse(lastSeen);
  // 저장된 값이 깨져 있으면 모두 안 읽은 것으로 본다
  if (Number.isNaN(seen)) return true;
  return Date.parse(notification.created_at) > seen;
}

export function countUnread(
  notifications: Pick<NotificationRow, "created_at">[],
  lastSeen: string,
): number {
  return notifications.filter((n) => isUnread(n, lastSeen)).length;
}

/** 알림 종 위 숫자: 9를 넘으면 9+ */
export function formatBadge(count: number): string {
  return count > 9 ? "9+" : String(count);
}

/** 가장 최근 알림 시각 = "여기까지 봤다"로 저장할 값. 알림이 없으면 null */
export function newestTimestamp(
  notifications: Pick<NotificationRow, "created_at">[],
): string | null {
  let newest: string | null = null;
  let newestMs = -Infinity;
  for (const n of notifications) {
    const ms = Date.parse(n.created_at);
    if (!Number.isNaN(ms) && ms > newestMs) {
      newest = n.created_at;
      newestMs = ms;
    }
  }
  return newest;
}
