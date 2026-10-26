export type EconomicMetric = "index_al" | "index_rl" | "inflation_al" | "inflation_rl";

export type EconomicObservation = {
  period: string;
  geography: string;
  metric: EconomicMetric;
  value: number;
  unit: string;
};

export type EconomicDataset = {
  datasetKey: string;
  title: string;
  institution: string;
  sourceUrl: string;
  retrievalMethod: string;
  geography: string;
  frequency: string;
  variables: string[];
  units: Record<string, string>;
  licenseAttribution: string;
  verificationStatus: "verified" | "unavailable";
};

export type EconomicSeries = {
  dataset: EconomicDataset;
  observations: EconomicObservation[];
  retrievedAt: string;
  vintageId?: number;
};
