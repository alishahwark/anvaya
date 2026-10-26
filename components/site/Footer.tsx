import Link from "next/link";
import { NAV } from "@/components/site/nav";

export function Footer() {
  return (
    <footer className="a-footer">
      <div className="a-container">
        <Link href="/" className="a-wordmark a-footer__mark">anvaya<span>.</span></Link>
        <nav aria-label="Footer">
          <ul className="a-footer__nav">
            {NAV.filter((link) => link.href !== "/").map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}{"tag" in link ? <em>{link.tag}</em> : null}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <dl className="a-footer__facts">
          <div><dt>Official sources</dt><dd>Digital Sansad, India Code, the Gazette of India, MeitY, MoSPI</dd></div>
          <div><dt>Benchmarks</dt><dd>UK and Canadian statute books</dd></div>
          <div><dt>Status</dt><dd>Independent prototype for Yale SOM MGT 409. Not legal advice.</dd></div>
        </dl>
        <p className="a-footer__fine">Always check the original documents linked on each page. Parliament photographs: Architectural Digest India.</p>
      </div>
    </footer>
  );
}
