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

export function definitionText(item: GatewayRouteDefinition) {
  return item.name === "Path"
    ? item.args.pattern || item.args.value || ""
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
