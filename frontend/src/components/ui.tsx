import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { breadcrumbJsonLd } from "./Seo";

/* ---- Section & headings -------------------------------------------------- */

export function Section({
  children,
  tint,
  dark,
  labelledBy,
}: {
  children: ReactNode;
  tint?: boolean;
  dark?: boolean;
  labelledBy?: string;
}) {
  const cls = ["section", tint && "section--tint", dark && "section--dark"].filter(Boolean).join(" ");
  return (
    <section className={cls} aria-labelledby={labelledBy}>
      <div className="container">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  center,
  id,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  center?: boolean;
  id?: string;
}) {
  return (
    <div className={center ? "section-heading section-heading--center" : "section-heading"}>
      {eyebrow && <span className="section-heading__eyebrow">{eyebrow}</span>}
      <h2 id={id}>{title}</h2>
      {lead && <p>{lead}</p>}
    </div>
  );
}

/* ---- Cards ---------------------------------------------------------------- */

export function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="card card--accent">
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

export function ServiceCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <article className="card card--accent">
      <h3>{title}</h3>
      <p>{description}</p>
      <Link className="card__link" to={href} aria-label={`Learn more about ${title}`}>
        Learn more →
      </Link>
    </article>
  );
}

export function IndustryCard({ industry, components }: { industry: string; components?: string }) {
  return (
    <article className="card">
      <h3>{industry}</h3>
      {components && <p>Example components: {components}</p>}
    </article>
  );
}

export function ContactCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="card">
      <h3>{title}</h3>
      {children}
    </article>
  );
}

/* ---- Stats, timeline, FAQ ------------------------------------------------- */

export function StatStrip({ stats }: { stats: readonly { value: string; label: string }[] }) {
  return (
    <dl className="stats">
      {stats.map((s) => (
        <div key={s.label}>
          <dd className="stats__value">{s.value}</dd>
          <dt className="stats__label">{s.label}</dt>
        </div>
      ))}
    </dl>
  );
}

export function Timeline({
  items,
}: {
  items: readonly { title: string; text?: string; period?: string }[];
}) {
  return (
    <ol className="timeline">
      {items.map((item) => (
        <li key={item.title}>
          <h3>
            {item.period ? `${item.period} — ` : ""}
            {item.title}
          </h3>
          {item.text && <p>{item.text}</p>}
        </li>
      ))}
    </ol>
  );
}

export function FaqAccordion({
  items,
}: {
  items: readonly { question: string; answer: string }[];
}) {
  return (
    <div className="faq">
      {items.map((faq) => (
        <details key={faq.question}>
          <summary>{faq.question}</summary>
          <p className="faq__body">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}

/* ---- CTA band -------------------------------------------------------------- */

export function CtaBand({
  heading,
  text,
  buttonLabel,
  buttonHref,
}: {
  heading: string;
  text?: string;
  buttonLabel: string;
  buttonHref: string;
}) {
  return (
    <div className="cta-band">
      <div>
        <h2>{heading}</h2>
        {text && <p>{text}</p>}
      </div>
      <Link className="btn btn--primary" to={buttonHref}>
        {buttonLabel}
      </Link>
    </div>
  );
}

/* ---- Media placeholders ---------------------------------------------------- */

export function ImagePlaceholder({ label, tall }: { label: string; tall?: boolean }) {
  return (
    <div
      className="img-placeholder"
      role="img"
      aria-label={`Placeholder: ${label}`}
      style={tall ? { minHeight: "18rem" } : undefined}
    >
      <span>
        [Image placeholder]
        <br />
        {label}
      </span>
    </div>
  );
}

export function Gallery({ items }: { items: string[] }) {
  return (
    <div className="grid grid--3">
      {items.map((label) => (
        <ImagePlaceholder key={label} label={label} />
      ))}
    </div>
  );
}

/* ---- Breadcrumb ------------------------------------------------------------ */

export function Breadcrumb({ items }: { items: { label: string; href: string }[] }) {
  return (
    <nav className="breadcrumb container" aria-label="Breadcrumb">
      <ol>
        {items.map((item, i) => (
          <li key={item.href}>
            {i === items.length - 1 ? (
              <span aria-current="page">{item.label}</span>
            ) : (
              <Link to={item.href}>{item.label}</Link>
            )}
          </li>
        ))}
      </ol>
      <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd(items))}</script>
    </nav>
  );
}

/* ---- Loading / empty ------------------------------------------------------- */

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </div>
  );
}

export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {text && <p>{text}</p>}
    </div>
  );
}
