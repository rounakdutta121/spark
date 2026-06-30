import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { ROUTES } from "@/lib/constants";

const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Explore", href: ROUTES.explore },
    { label: "Safety", href: ROUTES.help },
  ],
  company: [
    { label: "Help Center", href: ROUTES.help },
    { label: "Privacy", href: ROUTES.privacy },
    { label: "Terms", href: ROUTES.terms },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Spark helps you share moments, follow creators, and connect through
              posts, stories, and real-time chat.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Product</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Company</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Spark. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
