import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useTheme } from "../auth/ThemeContext";
import { company } from "../content/company";
import { cta, navItems } from "../content/navigation";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);
  return null;
}

function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); toggleRef.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="site-header">
      <div className="site-header__bar">
        <Link to="/" className="brand" aria-label={`${company.name} — home`}>
          Shakti <em>Udyog</em>
        </Link>
        <nav className="nav-desktop" aria-label="Main">
          <ul>
            {navItems.map((item) => (<li key={item.href}><NavLink to={item.href} end={item.href === "/"}>{item.label}</NavLink></li>))}
            <li><Link className="btn btn--primary nav-cta" to={cta.primary.href}>{cta.primary.label}</Link></li>
          </ul>
        </nav>
        <button type="button" className="btn btn--ghost" onClick={toggleTheme} aria-label="Toggle theme" style={{ marginLeft: "auto", marginRight: "var(--sp-2)", padding: "0.4rem 0.7rem", fontSize: "var(--fs-sm)", color: "var(--c-ink)" }}>
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
        <button ref={toggleRef} type="button" className="nav-toggle" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(v => !v)}>
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <nav className="nav-mobile" id="mobile-nav" aria-label="Main">
          <ul>
            {navItems.map((item) => (<li key={item.href}><NavLink to={item.href} end={item.href === "/"}>{item.label}</NavLink></li>))}
            <li><button className="btn btn--ghost" onClick={toggleTheme} style={{ width: "100%", color: "var(--c-ink)", marginBottom: "var(--sp-2)" }}>{theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}</button></li>
            <li><Link className="btn btn--primary" to={cta.primary.href}>{cta.primary.label}</Link></li>
          </ul>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div>
            <h3>Shakti Udyog</h3>
            <p>Shakti Udyog supplies quality-focused iron casting solutions for industrial and OEM applications.</p>
            <p>{company.address.line1}<br />{company.address.city}, {company.address.state} {company.address.postalCode}, {company.address.country}</p>
          </div>
          <nav aria-label="Quick links"><h3>Quick Links</h3><ul><li><Link to="/about">About Us</Link></li><li><Link to="/products">Products</Link></li><li><Link to="/capabilities">Capabilities</Link></li><li><Link to="/quality">Quality</Link></li><li><Link to="/industries">Industries</Link></li><li><Link to="/contact">Contact</Link></li><li><Link to="/request-a-quote">Request a Quote</Link></li></ul></nav>
          <nav aria-label="Legal"><h3>Legal</h3><ul><li><Link to="/privacy-policy">Privacy Policy</Link></li><li><Link to="/terms-of-use">Terms of Use</Link></li><li><Link to="/cookie-policy">Cookie Policy</Link></li></ul></nav>
          <div><h3>Contact</h3><ul><li><a href={company.contact.phoneHref}>Phone: {company.contact.phone}</a></li><li><a href={company.contact.whatsappHref}>WhatsApp: {company.contact.whatsapp}</a></li><li><a href={`mailto:${company.contact.email}`}>Email: {company.contact.email}</a></li><li>Business hours: {company.contact.businessHours}</li></ul></div>
        </div>
        <div className="site-footer__legal">
          <span>© {year} Shakti Udyog. All rights reserved.</span>
          <span>GST: 03**********1Z0</span>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <ScrollToTop />
      <Header />
      <main id="main-content"><Outlet /></main>
      <Footer />
    </>
  );
}
