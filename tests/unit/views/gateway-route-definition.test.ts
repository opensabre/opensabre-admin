import { describe, expect, it } from "vitest";
import { definitionText, pathPatterns } from "@/views/system/gateway-route/route-definition";

describe("gateway route definition", () => {
  it("displays indexed Nacos Path patterns in order", () => {
    const args = {
      "patterns.1": "/oauth2/v3/**",
      "patterns.0": "/api/auth/**",
    };

    expect(pathPatterns(args)).toEqual(["/api/auth/**", "/oauth2/v3/**"]);
    expect(definitionText({ name: "Path", args })).toBe("/api/auth/**,/oauth2/v3/**");
  });

  it("keeps supporting legacy Path arguments", () => {
    expect(pathPatterns({ pattern: "/api/**,/oauth2/**" })).toEqual(["/api/**", "/oauth2/**"]);
  });
});
