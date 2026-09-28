export function supportEmail() {
  const value = (process.env.SUPPORT_EMAIL || "").trim();
  return /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(value) ? value : "";
}
