"use client";

import { ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const suggestions = ["Which provisions are currently in force?", "What does the DPDP Act change?", "Show me verified policy briefs"];

export function PolicySearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  function submit(event?: FormEvent) { event?.preventDefault(); const value = query.trim(); router.push(value ? `/explore?q=${encodeURIComponent(value)}` : "/explore"); }
  return <div className="max-w-2xl">
    <form onSubmit={submit} className="group flex items-center gap-3 rounded-2xl border border-[#aebeb3] bg-white px-4 py-3 shadow-[0_8px_30px_rgba(16,46,60,.06)] transition focus-within:border-[#267c76] focus-within:shadow-[0_12px_36px_rgba(38,124,118,.14)]"><Search size={20} className="shrink-0 text-[#267c76]" aria-hidden="true" /><label htmlFor="home-policy-search" className="sr-only">Ask about an Indian law or public policy</label><input id="home-policy-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask about an Indian law or public policy…" className="sans min-w-0 flex-1 bg-transparent text-sm text-[#102e3c] outline-none placeholder:text-[#71847d] md:text-base" /><button type="submit" aria-label="Ask Anvaya" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#267c76] text-white transition hover:bg-[#1d625e] focus:outline-none focus:ring-2 focus:ring-[#102e3c] focus:ring-offset-2"><ArrowRight size={18} /></button></form>
    <div className="mt-4 flex flex-wrap gap-2" aria-label="Suggested questions">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => { setQuery(suggestion); router.push(`/explore?q=${encodeURIComponent(suggestion)}`); }} className="sans rounded-full border border-[#c6d0c8] px-3 py-2 text-left text-xs text-[#38564f] transition hover:border-[#267c76] hover:bg-[#edf3ec] focus:outline-none focus:ring-2 focus:ring-[#267c76]">{suggestion}</button>)}</div>
  </div>;
}
