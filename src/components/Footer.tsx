import { forwardRef } from "react";
import { Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = forwardRef<HTMLElement>((_, ref) => (
  <footer ref={ref} className="border-t border-border bg-card/50 mt-auto">
    <div className="container py-8 sm:py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div>
          <Link to="/" className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Calendar className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight">EventSphere</span>
          </Link>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your community hub for discovering, creating, and managing events.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3">Quick Links</h4>
          <ul className="space-y-2">
            <li><Link to="/events" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Explore Events</Link></li>
            <li><Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link></li>
            <li><Link to="/auth/signup" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Sign Up</Link></li>
            <li><Link to="/auth/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Login</Link></li>
          </ul>
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">© 2026 EventSphere. All rights reserved.</span>
        <span className="text-[10px] text-muted-foreground font-mono-data">v1.0.0</span>
      </div>
    </div>
  </footer>
));

Footer.displayName = "Footer";

export default Footer;

