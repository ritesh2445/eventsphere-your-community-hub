import { forwardRef } from "react";
import { Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = forwardRef<HTMLElement>((_, ref) => (
  <footer ref={ref} className="border-t border-border bg-card/50 mt-auto">
    <div className="container py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Calendar className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight">EventSphere</span>
          </Link>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Infrastructure for high-stakes gatherings. Real-time, AI-driven, built for scale.
          </p>
        </div>
        {[
          { title: "Product", links: ["Explore Events", "Create Event", "Pricing", "API"] },
          { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
          { title: "Legal", links: ["Privacy", "Terms", "Security"] },
        ].map((section) => (
          <div key={section.title}>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3">{section.title}</h4>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link}>
                  <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                    {link}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">© 2026 EventSphere. All rights reserved.</span>
        <span className="text-[10px] text-muted-foreground font-mono-data">v1.0.0</span>
      </div>
    </div>
  </footer>
));

Footer.displayName = "Footer";

export default Footer;
