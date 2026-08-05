import api from "./client";

/**
 * The document route is authenticated, so we can't just point an <a href> at
 * it — the browser wouldn't send the bearer token. Fetch it as a blob with the
 * axios instance (which attaches the header) and open the object URL.
 */
export async function openDocument(leaveId) {
  const res = await api.get(`/leaves/${leaveId}/document`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/**
 * Like openDocument but returns the blob URL (and its mime type) for inline
 * preview inside a modal rather than opening a new tab.
 */
export async function fetchDocumentUrl(leaveId) {
  const res = await api.get(`/leaves/${leaveId}/document`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  return { url, type: res.data.type };
}
