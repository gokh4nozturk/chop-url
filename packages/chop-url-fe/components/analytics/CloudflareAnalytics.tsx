'use client';

import Script from 'next/script';

export function CloudflareAnalytics() {
  return (
    <>
      <Script
        defer
        src="https://static.cloudflareinsights.com/beacon.min.js"
        data-cf-beacon={`{"token": "${process.env.NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN}"}`}
      />
    </>
  );
}
