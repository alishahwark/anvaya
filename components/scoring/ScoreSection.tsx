import { ScoreRings } from "@/components/scoring/ScoreRings";
import { scorePayload } from "@/lib/scoring/score";

/** Server component: scores the stored official text and renders the rings, or nothing if no text is stored. */
export async function ScoreSection({ slug }: { slug: string }) {
  const payload = await scorePayload(slug).catch(() => null);
  if (!payload) return null;
  return (
    <div className="a-block" id="scorecard">
      <ScoreRings slug={slug} card={payload.card} />
    </div>
  );
}
