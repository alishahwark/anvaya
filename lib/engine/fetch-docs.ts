import { parsePdfBytes } from "@/lib/knowledge/pdf-text";
import { fetchBounded } from "@/lib/research/security";
import type { BillFile } from "@/lib/engine/sansad";
import type { FetchedDoc } from "@/lib/engine/verify-bill";

export type DownloadedDoc = FetchedDoc & { bytes: Uint8Array | null; error: string | null };

/** Downloads every official file for a bill through the safe fetcher and reads its text. One failure never stops the rest. */
export async function downloadFiles(files: BillFile[]): Promise<DownloadedDoc[]> {
  return Promise.all(
    files.map(async (file): Promise<DownloadedDoc> => {
      try {
        const fetched = await fetchBounded(file.url, 45000);
        const pages = await parsePdfBytes(fetched.buffer).catch(() => null);
        return { ...file, url: fetched.finalUrl.split("#")[0], pages: pages && pages.length ? pages : null, bytes: fetched.buffer, error: null };
      } catch (error) {
        return { ...file, pages: null, bytes: null, error: error instanceof Error ? error.message : "Download failed." };
      }
    }),
  );
}
