import request from "@/utils/request";
import type {
  InternalTokenKeyRotationPayload,
  InternalTokenKeyStatus,
  InternalTokenPreviousKeyRetirementPayload,
} from "@/types/api";

const BASE_URL = "/sysadmin/security/internal-token/keys";

const InternalTokenKeyAPI = {
  status: () =>
    request<any, InternalTokenKeyStatus>({
      url: BASE_URL,
      method: "get",
    }),

  rotate: (payload: InternalTokenKeyRotationPayload) =>
    request<any, InternalTokenKeyStatus>({
      url: `${BASE_URL}/rotate`,
      method: "post",
      data: payload,
    }),

  retirePrevious: (payload: InternalTokenPreviousKeyRetirementPayload) =>
    request<any, InternalTokenKeyStatus>({
      url: `${BASE_URL}/retire-previous`,
      method: "post",
      data: payload,
    }),
};

export default InternalTokenKeyAPI;
