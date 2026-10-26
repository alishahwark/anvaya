import type { LegislativeRecord } from "@/data/fixtures/legislative-records";
import { AnimatedLegislativeTimeline } from "@/components/motion/AnimatedLegislativeTimeline";

export function LegislativeJourney({ record }: { record: LegislativeRecord }) {
  return <section id="legislative-story" aria-label="Interactive legislative journey"><AnimatedLegislativeTimeline record={record} /></section>;
}
