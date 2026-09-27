import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: lets phones on the same Wi-Fi (and 127.0.0.1) use hot reload.
  allowedDevOrigins: ["127.0.0.1", "localhost", "*.local"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;
