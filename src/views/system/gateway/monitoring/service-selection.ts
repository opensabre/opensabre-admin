import type { GatewayServiceInstance, GatewayServiceSummary } from "@/types/api/gateway-service";

const RUNTIME_GATEWAY_SERVICE_NAME = "base-gateway";

/** Select instances of the runtime gateway, excluding the gateway control plane. */
export function selectGatewayInstances(
  services: Array<Pick<GatewayServiceSummary, "name" | "instances">>
): GatewayServiceInstance[] {
  return services.find((service) => service.name === RUNTIME_GATEWAY_SERVICE_NAME)?.instances || [];
}
