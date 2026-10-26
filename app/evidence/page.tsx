import Link from "next/link";
import { EvidenceLab, PreviewNote } from "@/components/economic/EvidenceLab";
import { Shell } from "@/components/site/Shell";
import { readCurrentEconomicSeries } from "@/lib/economic/service";

export const metadata = { title: "Economic evidence lab — Anvaya" };

export default async function EvidencePage() {
  const series = await readCurrentEconomicSeries();
  return (
    <Shell>
      <div className="evidence-page">
        {series ? (
          <EvidenceLab series={series} />
        ) : (
          <>
            <section className="a-intro" style={{ margin: 0 }}>
              <span className="a-eyebrow">Economic evidence lab</span>
              <h1>The statistical series is not available</h1>
              <p>Anvaya has no verified copy of the series right now, and it will not show substitute data.</p>
            </section>
            <PreviewNote />
            <p style={{ textAlign: "center", marginTop: "2rem" }}><Link href="/" className="a-link">Return to Anvaya</Link></p>
          </>
        )}
      </div>
    </Shell>
  );
}
