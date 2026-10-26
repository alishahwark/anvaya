"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { NAV } from "@/components/site/nav";

/**
 * A slim bar with one "Menu" button. The menu is a floating panel over a dimmed, blurred page; links fade in one
 * after another. Escape, the backdrop and the close button dismiss it, focus moves in and returns, and Tab stays inside.
 */
export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    trigger.current?.focus();
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("[data-close]")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") return close();
      if (event.key !== "Tab" || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>("a, button")];
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <header className="a-header">
      <p className="a-notice">Independent student project · not an official government service</p>
      <div className="a-container a-header__bar">
        <Link href="/" className="a-wordmark" aria-label="Anvaya home">
          anvaya<span>.</span>
        </Link>
        <button ref={trigger} type="button" className="a-menubtn" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(true)}>
          <span className="sr-only">Open menu</span>
          <span aria-hidden="true">Menu</span>
        </button>
      </div>

      <div className="a-menu" data-open={open} aria-hidden={!open}>
        <div className="a-menu__scrim" onClick={close} />
        <div id="site-menu" ref={panel} className="a-menu__panel" role="dialog" aria-modal="true" aria-label="Menu" inert={!open}>
          <button type="button" className="a-menu__close" data-close onClick={close}>
            <span className="sr-only">Close menu</span>
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          <nav aria-label="Main">
            <ul>
              {NAV.map((link, index) => (
                <li key={link.href} style={{ ["--i" as string]: index }}>
                  <Link href={link.href} aria-current={(link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)) ? "page" : undefined}>
                    {link.label}
                    {"tag" in link ? <em>{link.tag}</em> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="a-menu__note">Every explanation links to the official text. Anvaya is an independent prototype and does not give legal advice.</p>
        </div>
      </div>
    </header>
  );
}
