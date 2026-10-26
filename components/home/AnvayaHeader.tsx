"use client";

import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";

export function AnvayaHeader() {
  const [open, setOpen] = useState(false);
  return <header className="sans sticky top-0 z-40 border-b border-[#d8ded5]/90 bg-[#faf8f3]/95 backdrop-blur-md">
    <div className="home-container flex min-h-[4.75rem] items-center justify-between gap-5">
      <Link href="/" className="text-[1.45rem] font-bold tracking-[-.06em] text-[#102e3c]">anvaya<span className="text-[#d38b45]">.</span><span className="sr-only"> home</span></Link>
      <nav aria-label="Main navigation" className="hidden items-center gap-8 text-[.78rem] font-semibold text-[#38564f] md:flex"><Link href="/explore" className="transition-colors hover:text-[#267c76]">Explore</Link><Link href="/policies" className="transition-colors hover:text-[#267c76]">Policy briefs</Link><Link href="/evidence" className="transition-colors hover:text-[#267c76]">Evidence</Link><Link href="/impact" className="transition-colors hover:text-[#267c76]">Impact</Link><Link href="/about" className="transition-colors hover:text-[#267c76]">About</Link></nav>
      <div className="flex items-center gap-2"><Link href="/explore" className="hidden items-center gap-2 rounded-full bg-[#267c76] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1d625e] focus:outline-none focus:ring-2 focus:ring-[#102e3c] focus:ring-offset-2 sm:inline-flex">Explore the register <ArrowUpRight size={14} /></Link><button type="button" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#bbc9bf] text-[#102e3c] md:hidden">{open ? <X size={18} /> : <Menu size={18} />}<span className="sr-only">{open ? "Close menu" : "Open menu"}</span></button></div>
    </div>
    {open && <nav id="mobile-nav" aria-label="Mobile navigation" className="home-container grid gap-1 border-t border-[#d8ded5] py-3 md:hidden"><Link onClick={() => setOpen(false)} href="/explore" className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[#f0eee4]">Explore</Link><Link onClick={() => setOpen(false)} href="/policies" className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[#f0eee4]">Policy briefs</Link><Link onClick={() => setOpen(false)} href="/evidence" className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[#f0eee4]">Evidence</Link><Link onClick={() => setOpen(false)} href="/impact" className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[#f0eee4]">Impact</Link><Link onClick={() => setOpen(false)} href="/about" className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[#f0eee4]">About</Link></nav>}
  </header>;
}
