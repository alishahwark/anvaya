"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const stages = [
  { eyebrow: "The record begins", title: "A public institution, drawn from evidence.", detail: "India's Parliament is where a proposal becomes part of the public record." },
  { eyebrow: "Read the shape of a law", title: "Context gives a policy its meaning.", detail: "Anvaya connects the milestone, the provision, and the official page that supports it." },
  { eyebrow: "Follow what changes", title: "Separate the moments that matter.", detail: "Assent, publication, commencement, and implementation are separate facts." },
];

export function ParliamentStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduced(media.matches);
    updateMotion();
    media.addEventListener("change", updateMotion);
    let frame = 0;
    const update = () => {
      const element = sectionRef.current;
      if (element) {
        const rect = element.getBoundingClientRect();
        const travel = Math.max(1, element.offsetHeight - window.innerHeight);
        setProgress(reduced ? 1 : Math.min(1, Math.max(0, -rect.top / travel)));
      }
      frame = 0;
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { media.removeEventListener("change", updateMotion); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (frame) window.cancelAnimationFrame(frame); };
  }, [reduced]);

  const active = Math.min(stages.length - 1, Math.floor(progress * stages.length));
  const draw = reduced ? 0 : 1 - progress;
  const pillars = Array.from({ length: 17 }, (_, index) => 108 + index * 34);

  return <section ref={sectionRef} className="parliament-story" aria-labelledby="parliament-story-title">
    <div className="home-container parliament-story__sticky">
      <div className="parliament-story__copy">
        <p className="eyebrow">A policy is a connected record</p>
        <h2 id="parliament-story-title">See the institution behind the text.</h2>
        <p className="sans parliament-story__lead">A law is more than a title or a date. Trace the public record from the institution, to the provision, to the change it sets in motion.</p>
        <div className="parliament-story__steps" aria-live="polite">{stages.map((stage, index) => <div key={stage.title} className={`parliament-story__step ${active === index ? "is-active" : ""}`}><span className="sans">0{index + 1}</span><div><p className="eyebrow">{stage.eyebrow}</p><h3>{stage.title}</h3>{active === index && <p className="sans">{stage.detail}</p>}</div></div>)}</div>
      </div>
      <div className="parliament-drawing" aria-label="Illustrated Parliament building, revealed as the story progresses">
        <div className="parliament-drawing__image"><Image src="/assets/sansad-bhavan.jpg" alt="Old Parliament building in New Delhi" fill sizes="(max-width: 900px) 100vw, 55vw" /></div>
        <div className="parliament-drawing__wash" />
        <svg viewBox="0 0 800 500" role="img" aria-labelledby="parliament-svg-title parliament-svg-description" className="parliament-drawing__svg"><title id="parliament-svg-title">Line drawing of the Parliament building</title><desc id="parliament-svg-description">A measured architectural outline of the building appears progressively as the reader follows the connected policy record.</desc>
          <g className="parliament-drawing__outline" style={{ opacity: .35 + progress * .65 }}>
            <ellipse pathLength="1" className="parliament-drawing__ring" cx="400" cy="285" rx="338" ry="138" style={{ strokeDashoffset: draw }} />
            <ellipse className="parliament-drawing__ring parliament-drawing__ring--inner" cx="400" cy="285" rx="274" ry="105" />
            <path pathLength="1" className="parliament-drawing__dome" d="M320 170 Q400 76 480 170 M350 164 Q400 108 450 164 M400 80 V42 M386 43 H414" style={{ strokeDashoffset: draw }} />
            <path className="parliament-drawing__base" d="M64 286 Q400 405 736 286 M90 317 Q400 430 710 317" />
            {pillars.map((x) => <line key={x} className="parliament-drawing__pillar" x1={x} y1="202" x2={x} y2="340" />)}
            <path className="parliament-drawing__axis" d="M400 42 V382 M72 285 H728" />
          </g>
          <g className="parliament-drawing__markers"><circle cx="400" cy="42" r="5" /><circle cx="72" cy="285" r="4" /><circle cx="728" cy="285" r="4" /></g>
        </svg>
        <div className="parliament-drawing__caption sans"><span>New Delhi</span><span>Evidence, connected</span></div>
      </div>
    </div>
  </section>;
}
