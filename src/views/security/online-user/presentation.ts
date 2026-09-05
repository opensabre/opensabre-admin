export type OnlineActivityStatus = "active" | "idle" | "inactive" | "unknown";

function timestamp(value?: string | number) {
  if (value == null || value === "") return undefined;
  const date =
    typeof value === "number" || /^\d+$/.test(String(value))
      ? new Date(Number(value))
      : new Date(String(value).replace(" ", "T"));
  const result = date.getTime();
  return Number.isNaN(result) ? undefined : result;
}

export function onlineDuration(loginTime?: string | number, now = Date.now()) {
  const startedAt = timestamp(loginTime);
  if (startedAt == null || startedAt > now) return "-";
  const minutes = Math.floor((now - startedAt) / 60000);
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) return `${hours} 小时 ${remainingMinutes} 分钟`;
  return `${Math.floor(hours / 24)} 天 ${hours % 24} 小时`;
}

export function lastActiveText(lastAccessTime?: string | number, now = Date.now()) {
  const lastActiveAt = timestamp(lastAccessTime);
  if (lastActiveAt == null) return "-";
  const minutes = Math.max(0, Math.floor((now - lastActiveAt) / 60000));
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

export function activityStatus(
  lastAccessTime?: string | number,
  now = Date.now()
): OnlineActivityStatus {
  const lastActiveAt = timestamp(lastAccessTime);
  if (lastActiveAt == null) return "unknown";
  const inactiveMinutes = Math.max(0, (now - lastActiveAt) / 60000);
  if (inactiveMinutes <= 5) return "active";
  if (inactiveMinutes <= 30) return "idle";
  return "inactive";
}

export function clientSummary(userAgent?: string) {
  if (!userAgent) return "未知客户端";
  const browser =
    userAgent.match(/Edg\/[\d.]+/)?.[0].replace("Edg/", "Edge ") ||
    userAgent.match(/Chrome\/[\d.]+/)?.[0].replace("Chrome/", "Chrome ") ||
    userAgent.match(/Firefox\/[\d.]+/)?.[0].replace("Firefox/", "Firefox ") ||
    (userAgent.includes("Safari/")
      ? `Safari ${userAgent.match(/Version\/([\d.]+)/)?.[1] || ""}`.trim()
      : "");
  const system = userAgent.includes("Windows")
    ? "Windows"
    : userAgent.includes("Android")
      ? "Android"
      : /iPhone|iPad/.test(userAgent)
        ? "iOS"
        : userAgent.includes("Mac OS X")
          ? "macOS"
          : userAgent.includes("Linux")
            ? "Linux"
            : "";
  return [browser, system].filter(Boolean).join(" · ") || "其他客户端";
}
