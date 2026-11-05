import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 응답 헤더에 "X-Powered-By: Next.js"를 붙이지 않는다 (사용하는 기술을 굳이 알리지 않는다)
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
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
