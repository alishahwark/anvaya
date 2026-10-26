import { ArrowDown } from "lucide-react";
import { PolicySearch } from "@/components/home/PolicySearch";

export function HeroSection() {
  return <section className="border-b border-[#d8ded5]">
    <div className="home-container grid gap-14 pb-20 pt-20 md:pb-28 md:pt-28 lg:grid-cols-[1.05fr_.95fr] lg:items-end lg:gap-20">
      <div><p className="eyebrow">Independent public policy intelligence · India</p><h1 className="home-display mt-5 max-w-4xl tracking-[-.065em]">Understand the policies shaping India.</h1><p className="sans mt-7 max-w-xl text-base leading-7 text-[#60716c] md:text-lg md:leading-8">Discover legislation, follow its progress, and explore what it means — grounded in verified sources.</p><div className="mt-9"><PolicySearch /></div></div>
      <div className="sans flex items-end justify-between border-t border-[#d8ded5] pt-5 text-xs text-[#60716c] lg:mb-2"><span>Read the record.<br />Follow what changes.</span><a href="#featured-legislation" className="inline-flex items-center gap-2 font-semibold text-[#267c76] hover:text-[#102e3c]">Begin exploring <ArrowDown size={15} /></a></div>
    </div>
  </section>;
}
