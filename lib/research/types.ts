export type SourceHealth = { adapterId: string; ok: boolean; checkedAt: string; detail: string };
export type SourceCandidate = { title: string; url: string; publisher: string; sourceType: string; publishedDate?: string | null; identifier?: string | null; metadata: Record<string, unknown> };
export type RawDocument = { candidate: SourceCandidate; bytes: Uint8Array; contentType: string; retrievedAt: string };
export type ParsedDocument = RawDocument & { text: string; pageCount: number; extractionQuality: "high" | "low" | "unavailable" };
export interface SourceAdapter { id: string; healthCheck(): Promise<SourceHealth>; discover(query: string): Promise<SourceCandidate[]>; fetch(candidate: SourceCandidate): Promise<RawDocument>; parse(document: RawDocument): Promise<ParsedDocument>; }
