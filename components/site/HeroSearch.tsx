"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

function useGo() {
  const router = useRouter();
  return (value: string) => {
    const text = value.trim();
    router.push(text ? `/explore?q=${encodeURIComponent(text)}` : "/explore");
  };
}

/** The one job of the homepage: invite a question. Enter submits. */
export function HeroSearch() {
  const go = useGo();
  const [query, setQuery] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    go(query);
  }
  return (
    <form className="a-search" role="search" onSubmit={submit}>
      <label htmlFor="hero-search" className="sr-only">Ask about a law, bill, or government policy</label>
      <input id="hero-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask about a law or bill" autoComplete="off" />
      <button type="submit" className="a-search__go" aria-label="Search">
        <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </form>
  );
}

export function SuggestionChips({ suggestions }: { suggestions: string[] }) {
  const go = useGo();
  return (
    <div className="a-ask-try">
      <span>Try asking</span>
      <div className="a-suggestions">
        {suggestions.map((suggestion) => (
          <button key={suggestion} type="button" className="a-suggestion" onClick={() => go(suggestion)}>{suggestion}</button>
        ))}
      </div>
    </div>
  );
}
