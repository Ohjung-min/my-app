"use client";

// Design Ref: §3.5 — 상단 알림 종(🔔): 안 읽은 개수를 보여 주고, 누르면 최근 알림 목록(최대 20건)이 열린다
// "읽음"은 이 브라우저에 저장한 "마지막으로 본 알림 시각"으로 정한다 (기기별, DESIGN §4.2)
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { NotificationRow } from "@/features/notifications/queries";
import {
  countUnread,
  formatBadge,
  isUnread,
  newestTimestamp,
} from "@/features/notifications/unread";

const STORAGE_KEY = "gongmae-notifications-last-seen";
/** 같은 브라우저의 다른 탭·같은 탭의 다른 알림 종에도 바로 반영하기 위한 신호 */
const CHANGE_EVENT = "gongmae-notifications-seen";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** 브라우저 저장소를 못 쓰는 경우(시크릿 창 등)에는 빈 글자 = 모두 안 읽음으로 본다 */
function readLastSeen(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeLastSeen(value: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // 저장하지 못해도 알림 보기에는 문제가 없다
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const timeFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type Props = {
  /** 최근 알림 (최신순). 불러오지 못했으면 null */
  notifications: NotificationRow[] | null;
};

export default function NotificationBell({ notifications }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastSeen = useSyncExternalStore(subscribe, readLastSeen, () => "");

  const items = useMemo(() => notifications ?? [], [notifications]);
  const newest = useMemo(() => newestTimestamp(items), [items]);
  const unread = countUnread(items, lastSeen);

  /** 목록을 닫을 때 "여기까지 봤다"를 저장한다 (열려 있는 동안에는 새 알림이 강조되어 보인다) */
  function close() {
    setOpen(false);
    if (newest) writeLastSeen(newest);
  }

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        if (newest) writeLastSeen(newest);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        if (newest) writeLastSeen(newest);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, newest]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={unread > 0 ? `알림 ${unread}건 안 읽음` : "알림"}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative rounded-md border border-white/40 bg-white px-2.5 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
      >
        <span aria-hidden="true">🔔</span>
        {unread > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-red-600 px-1 text-center text-xs font-semibold leading-5 text-white"
          >
            {formatBadge(unread)}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="region"
          aria-label="최근 알림"
          className="absolute right-0 z-10 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-zinc-200 bg-white shadow-lg"
        >
          <p className="border-b border-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-900">
            최근 알림
          </p>

          {notifications === null ? (
            <p className="px-3 py-4 text-sm text-red-700">
              알림을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </p>
          ) : items.length === 0 ? (
            <p className="px-3 py-4 text-sm text-zinc-600">새 알림이 없습니다.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((n) => {
                const fresh = isUnread(n, lastSeen);
                return (
                  <li key={n.id} className="border-b border-zinc-100 last:border-b-0">
                    <Link
                      href={`/items/${n.item_id}/edit`}
                      onClick={close}
                      className={`block px-3 py-2 text-sm hover:bg-zinc-50 ${
                        fresh ? "bg-blue-50" : ""
                      }`}
                    >
                      <span className="block text-zinc-900">{n.message}</span>
                      <span className="mt-0.5 block text-xs text-zinc-500">
                        {timeFormat.format(new Date(n.created_at))}
                        {fresh ? " · 새 알림" : ""}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
