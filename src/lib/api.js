let session;
export async function getSession(force = false) {
  if (!session || force) {
    const response = await fetch("/api/session");
    if (!response.ok)
      throw new Error(
        "The TrustLens backend is unavailable. Start the API server.",
      );
    session = await response.json();
  }
  return session;
}
export async function api(path, method = "GET", data, signal) {
  const current = await getSession();
  const response = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    signal,
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": current.csrf,
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || "Request failed.");
  if (path.startsWith("/auth/") && result.csrf)
    session = { ...current, ...result };
  return result;
}
export async function waitForJob(job, onUpdate, signal) {
  while (true) {
    signal?.throwIfAborted();
    const current = await api(`/jobs/${job.id}`, "GET", undefined, signal);
    onUpdate?.(current);
    if (current.status === "complete") return current.result;
    if (current.status === "failed") throw new Error(current.error.message);
    if (current.status === "cancelled") throw new Error("Job cancelled.");
    await new Promise((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      };
      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", abort);
        resolve();
      }, 1200);
      signal?.addEventListener("abort", abort, { once: true });
    });
  }
}
