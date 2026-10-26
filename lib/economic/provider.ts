import type { EconomicDataset, EconomicObservation } from "./types";

export type ProviderAvailability = "available" | "blocked" | "unavailable";

export interface EconomicDataProvider<TPayload = unknown> {
  id: string;
  dataset: EconomicDataset;
  healthCheck(): Promise<{ availability: ProviderAvailability; detail: string }>;
  fetch(signal?: AbortSignal): Promise<{ payload: TPayload; observations: EconomicObservation[]; retrievedAt: string; checksum: string }>;
}
