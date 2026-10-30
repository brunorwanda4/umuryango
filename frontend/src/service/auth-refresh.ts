export type AuthRefreshResult = "refreshed" | "unauthorized" | "unavailable";

export function classifyAuthRefreshResponse(response: {
  ok: boolean;
  status: number;
}): AuthRefreshResult {
  if (response.ok) return "refreshed";
  if (response.status === 401 || response.status === 403) return "unauthorized";
  return "unavailable";
}
