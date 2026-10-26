import { notFound } from "next/navigation";
import { ResearchJobView } from "@/components/research/ResearchJobView";
import { Shell } from "@/components/site/Shell";
import { getResearchJob } from "@/lib/research/service";

export const dynamic = "force-dynamic";

export default async function ResearchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobId = Number(id);
  if (!Number.isInteger(jobId) || jobId < 1 || !(await getResearchJob(jobId))) notFound();
  return (
    <Shell>
      <div className="a-narrow" style={{ paddingBlock: "3rem 1rem" }}>
        <span className="a-eyebrow">Policy search</span>
        <h1 className="a-h1" style={{ margin: "0.75rem 0 1.5rem" }}>Looking for official documents</h1>
        <ResearchJobView id={id} />
      </div>
    </Shell>
  );
}
