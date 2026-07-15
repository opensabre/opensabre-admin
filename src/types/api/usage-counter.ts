export type UsageObjectType =
  | "CAPTCHA_SCENE"
  | "RATE_LIMIT_SCENE"
  | "NOTIFICATION_SCENE"
  | "NOTIFICATION_TEMPLATE";

export type UsageEvent = "CAPTCHA_GENERATE" | "CAPTCHA_VERIFY" | "RATE_LIMIT_CHECK" | "NOTIFICATION_SEND";
export type UsageGranularity = "MINUTE" | "HOUR" | "DAY" | "WEEK";

export interface UsageSummary {
  attemptCount: number;
  successCount: number;
  failureCount: number;
  successRate?: number;
}

export interface UsageObjectSummary extends UsageSummary {
  objectId: string;
}

export interface UsageTrendItem extends UsageSummary {
  bucketStart: string;
}

export interface UsageRankingItem extends UsageObjectSummary {
  objectType: UsageObjectType;
  usageEvent: UsageEvent;
}

export interface UsageTrendQuery {
  from: string;
  to: string;
  granularity: UsageGranularity;
  objectType?: UsageObjectType;
  objectId?: string;
  usageEvent?: UsageEvent;
}

export interface UsageBatchSummaryQuery {
  from: string;
  to: string;
  objectType: UsageObjectType;
  objectIds: string[];
  usageEvent?: UsageEvent;
}
