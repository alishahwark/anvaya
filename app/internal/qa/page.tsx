import { QADashboard } from "@/components/qa/QADashboard";
import { notFound } from "next/navigation";

export default function QAPage() {
  if (process.env.NODE_ENV === "production" && process.env.ANVAYA_QA_ENABLED !== "true") notFound();
  return <main className="min-h-screen bg-[#f7f8f3] px-5 py-8 md:px-10"><div className="mx-auto max-w-7xl"><p className="eyebrow">Internal verification</p><h1 className="mt-3 text-5xl tracking-[-.05em] text-[#102e3c]">Anvaya QA</h1><p className="sans mt-4 max-w-2xl text-sm leading-6 text-[#60716c]">Development and submission verification only. Untested checks are never presented as passing.</p><QADashboard /></div></main>;
}
