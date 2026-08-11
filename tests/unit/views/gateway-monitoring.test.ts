import { describe, expect, it } from "vitest";

import { selectGatewayInstances } from "@/views/system/gateway/monitoring/service-selection";

describe("gateway monitoring service selection", () => {
  it("includes only runtime gateway instances", () => {
    const runtimeInstance = { ip: "172.18.0.6", port: 8443 };
    const adminInstance = { ip: "172.18.0.5", port: 8030 };

    expect(
      selectGatewayInstances([
        { name: "base-gateway", instances: [runtimeInstance] },
        { name: "base-gateway-admin", instances: [adminInstance] },
      ])
    ).toEqual([runtimeInstance]);
  });
});
