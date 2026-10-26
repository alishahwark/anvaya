import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LegislativeRecord } from "@/data/fixtures/legislative-records";
import { statusLabel } from "@/lib/policy-status/engine";

export function FeaturedPolicies({ records }: { records: LegislativeRecord[] }) {
  return <section id="featured-legislation" className="border-y border-[#d8ded5] bg-[#f0eee4]">
    <div className="home-container py-16 md:py-24"><div className="flex flex-col justify-between gap-4 border-b border-[#cfd7ce] pb-8 md:flex-row md:items-end"><div><p className="eyebrow">Featured legislation</p><h2 className="mt-3 text-4xl tracking-[-.045em] md:text-5xl">Start with the record.</h2></div><p className="sans max-w-xs text-sm leading-6 text-[#60716c]">A small selection from Anvaya’s local register, with confidence shown plainly.</p></div><div className="divide-y divide-[#cfd7ce]">{records.slice(0, 3).map((record) => <Link key={record.slug} href={`/policies/${record.slug}`} className="group grid gap-5 py-7 transition-colors hover:bg-[#e8eadf] md:grid-cols-[1fr_auto_auto] md:items-center md:gap-8"><div><p className="sans text-xs font-semibold uppercase tracking-[.12em] text-[#60716c]">{record.category}</p><h3 className="mt-2 text-2xl tracking-[-.025em] md:text-3xl">{record.officialName}</h3><p className="sans mt-2 max-w-2xl text-sm leading-6 text-[#60716c]">{record.summary}</p></div><div className="sans text-xs font-semibold uppercase tracking-[.1em] text-[#267c76]">{statusLabel(record.currentStatus)}</div><div className="flex items-center gap-2 sans text-sm font-semibold text-[#102e3c]"><span>{record.statusConfidence === "verified" ? "Verified" : "Source pending"}</span><ArrowUpRight size={17} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></div></Link>)}</div><p className="sans mt-7 text-xs text-[#60716c]">Status labels are descriptive records, not individualized legal advice.</p></div>
  </section>;
}
