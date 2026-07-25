export interface InternalTokenKeyStatus {
  enabled: boolean;
  writeEnabled: boolean;
  configVersion: number;
  activeKeyId?: string;
  activeKeyConfigured: boolean;
  previousKeyId?: string;
  previousKeyConfigured: boolean;
  activeKeyActivatedAt?: string;
  previousKeyRetireAfter?: string;
}

export interface InternalTokenKeyRotationPayload {
  expectedConfigVersion: number;
  newKeyId: string;
  reason: string;
}

export interface InternalTokenPreviousKeyRetirementPayload {
  expectedConfigVersion: number;
  reason: string;
}
