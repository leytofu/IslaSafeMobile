/** Development API traffic shares the connection used to download the app. */
export function resolveApiBaseUrl(configured: string | undefined, developmentHost: string | undefined) {
  const explicit = configured?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  if (developmentHost) {
    const host = developmentHost.replace(/^exp:\/\//, "http://");
    const address = new URL(host.includes("://") ? host : `http://${host}`);
    if (address.protocol === "http:" || address.protocol === "https:") return `${address.origin}/api`;
  }
  return "http://10.0.2.2:8000/api";
}
