-- 수정 시각을 채우는 트리거 전용 함수(set_items_updated)를 API로 호출할 수 없게 닫는다.
-- 알림 함수(notify_item_status_change)에는 이미 같은 조치가 되어 있다. 트리거 동작에는 영향이 없다
-- (실행 권한은 트리거를 만들 때 확인하고, 실행될 때는 확인하지 않는다)

revoke execute on function public.set_items_updated() from public, anon, authenticated;
