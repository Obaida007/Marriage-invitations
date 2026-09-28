import "server-only";
import { headers } from "next/headers";

/** Hosts that are only reachable locally or on a LAN, where dev servers speak plain http. */
const LOCAL_HOST = /^(localhost|127\.|0\.0\.0\.0|\[::1\]|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|[^.:]+\.local\b)/;

/** Public origin of the app, preferring the configured URL over request headers. */
export async function getOrigin() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() || (LOCAL_HOST.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}
