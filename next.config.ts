import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 응답 헤더에 "X-Powered-By: Next.js"를 붙이지 않는다 (사용하는 기술을 굳이 알리지 않는다)
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  // 첫 화면(/)은 public/design-world/index.html(유리 큐브 디자인)을 보여 준다 (2026-11-05 요청)
  // 진행상황별 건수 화면은 /status, 물건 목록은 /items
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/design-world/index.html" }],
    };
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
