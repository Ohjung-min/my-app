"use client";

// Design Ref: §3.1 — 초대 메일의 링크를 누르면 Supabase가 이 앱의 주소 뒤에 "#access_token=..." 형태로 로그인 정보를 붙여 보낸다.
// 주소의 # 뒷부분은 서버가 읽을 수 없어서, 브라우저에서 읽어 로그인시킨 뒤 비밀번호 설정 화면(/set-password)으로 보낸다.
// (무료 요금제의 기본 메일 서비스에서는 초대 메일 양식을 바꿀 수 없어서 이 방식을 쓴다)
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
const getHash = () => window.location.hash;
const getServerHash = () => "";

export default function InviteLinkHandler() {
  const router = useRouter();
  const hash = useSyncExternalStore(subscribe, getHash, getServerHash);
  const [failed, setFailed] = useState(false);

  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const type = params.get("type");
  const hasLinkError = Boolean(params.get("error"));
  const isInviteLink =
    Boolean(accessToken && refreshToken) &&
    (type === "invite" || type === "recovery");

  useEffect(() => {
    if (!isInviteLink || !accessToken || !refreshToken) return;

    let cancelled = false;
    (async () => {
      const { error } = await createClient().auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (cancelled) return;
      if (error) {
        setFailed(true);
      } else {
        router.replace("/set-password");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isInviteLink, accessToken, refreshToken, router]);

  if (hasLinkError || failed) {
    return (
      <p
        role="alert"
        className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        초대 링크가 올바르지 않거나 만료되었습니다. 오정민에게 다시 초대를
        요청해 주세요.
      </p>
    );
  }

  if (isInviteLink) {
    return (
      <p className="mb-4 text-center text-sm text-zinc-600">
        초대를 확인하고 있습니다...
      </p>
    );
  }

  return null;
}
