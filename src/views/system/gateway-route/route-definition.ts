import type { GatewayRouteDefinition } from "@/types/api";

export type EditableDefinition = { name: string; argsText: string };

export const predicateOptions = [
  "Path",
  "Host",
  "Method",
  "Header",
  "Query",
  "RemoteAddr",
  "After",
  "Before",
  "Between",
];

export const filterOptions = [
  "SetPath",
  "StripPrefix",
  "PrefixPath",
  "RewritePath",
  "AddRequestHeader",
  "AddResponseHeader",
  "RemoveRequestHeader",
  "RemoveResponseHeader",
  "Retry",
  "CircuitBreaker",
];

export function emptyDefinition(): EditableDefinition {
  return { name: "", argsText: "" };
}

/**
 * 读取 Path 断言的所有路径，兼容 Nacos 展开格式 patterns.0、patterns.1...，
 * 以及 Spring Cloud Gateway 旧的 pattern/value 格式。
 */
export function pathPatterns(args: Record<string, string>): string[] {
  const indexed = Object.entries(args)
    .map(([key, value]) => {
      const match = /^patterns\.(\d+)$/.exec(key);
      return match ? { index: Number(match[1]), value } : undefined;
    })
    .filter((item): item is { index: number; value: string } => Boolean(item))
    .sort((left, right) => left.index - right.index)
    .map((item) => item.value)
    .filter(Boolean);

  if (indexed.length) return indexed;

  const direct = args.pattern || args.value || args.patterns || "";
  return direct
    ? direct
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

export function definitionText(item: GatewayRouteDefinition) {
  return item.name === "Path"
    ? pathPatterns(item.args).join(",")
    : Object.entries(item.args)
        .map(([key, value]) => (key === "value" ? value : `${key}=${value}`))
        .join(",");
}

export function parseArgs(name: string, text: string): Record<string, string> {
  const value = text.trim();
  if (!value) return {};
  if (name === "Path") return { pattern: value };
  return Object.fromEntries(
    value.split(",").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return rest.length ? [key.trim(), rest.join("=").trim()] : ["value", key.trim()];
    })
  );
}
