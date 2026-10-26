import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

/** Page frame shared by every citizen-facing route. */
export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="a-body">
      <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </div>
  );
}
