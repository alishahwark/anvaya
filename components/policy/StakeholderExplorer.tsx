"use client";

import { useEffect, useRef, useState } from "react";
import { Evidence } from "@/components/policy/Evidence";
import type { ResolvedEvidence } from "@/lib/knowledge/resolve";

export type ExplorerPoint = {
  kind: "legal_duty" | "legal_right" | "legal_fact" | "our_reading";
  text: string;
  /** e.g. "Starts 13 May 2027 (in 200 days)" */
  when?: string;
  whenState?: "in_force" | "upcoming";
  evidence: ResolvedEvidence[];
};

export type ExplorerGroup = {
  id: string;
  label: string;
  prompt: string;
  headline: string;
  points: ExplorerPoint[];
  openQuestions: string[];
};

const kindLabel: Record<ExplorerPoint["kind"], { text: string; className: string }> = {
  legal_duty: { text: "Duty", className: "a-chip a-chip--fact" },
  legal_right: { text: "Right", className: "a-chip a-chip--fact" },
  legal_fact: { text: "What the law says", className: "a-chip a-chip--fact" },
  our_reading: { text: "Our reading, not the law", className: "a-chip a-chip--reading" },
};

export function StakeholderExplorer({ groups }: { groups: ExplorerGroup[] }) {
  const [selected, setSelected] = useState(groups[0]?.id ?? "");
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);

  // Deep link: /policies/slug#affected-small-business opens that group.
  useEffect(() => {
    const match = window.location.hash.match(/^#affected-(.+)$/);
    if (match && groups.some((group) => group.id === match[1])) setSelected(match[1]);
  }, [groups]);

  function choose(id: string) {
    setSelected(id);
    history.replaceState(null, "", `#affected-${id}`);
  }

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const last = groups.length - 1;
    const next = event.key === "ArrowRight" ? (index === last ? 0 : index + 1) : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1) : event.key === "Home" ? 0 : event.key === "End" ? last : null;
    if (next === null) return;
    event.preventDefault();
    choose(groups[next].id);
    tabs.current[next]?.focus();
  }

  const group = groups.find((item) => item.id === selected) ?? groups[0];
  if (!group) return null;

  return (
    <div>
      <div className="a-tabs" role="tablist" aria-label="Choose who you are">
        {groups.map((item, index) => (
          <button
            key={item.id}
            ref={(element) => { tabs.current[index] = element; }}
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={item.id === group.id}
            aria-controls={`panel-${item.id}`}
            tabIndex={item.id === group.id ? 0 : -1}
            className="a-tab"
            type="button"
            onClick={() => choose(item.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${group.id}`} aria-labelledby={`tab-${group.id}`} className="a-panel">
        <p className="a-panel__prompt">{group.prompt}</p>
        <h3 className="a-h3 a-panel__headline">{group.headline}</h3>
        <ul className="a-points">
          {group.points.map((point) => (
            <li key={point.text} className="a-point">
              <div className="a-point__meta">
                <span className={kindLabel[point.kind].className}>{kindLabel[point.kind].text}</span>
                {point.when ? <span className={`a-chip ${point.whenState === "in_force" ? "a-chip--ok" : "a-chip--soon"}`}>{point.when}</span> : null}
              </div>
              <p>{point.text}</p>
              <Evidence items={point.evidence} />
            </li>
          ))}
        </ul>
        {group.openQuestions.length ? (
          <div className="a-open">
            <h4>What is still unclear</h4>
            <ul>
              {group.openQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
