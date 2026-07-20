import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { Section } from "../components/ui";

export default function NotFoundPage() {
  return (
    <>
      <Seo
        title="Page Not Found | Shakti Udyog"
        description="The page you requested could not be found."
        path="/404"
      />
      <Section labelledBy="nf-heading">
        <div className="empty-state">
          <h1 id="nf-heading">Page not found</h1>
          <p>The page you are looking for does not exist or has moved.</p>
          <p>
            <Link className="btn btn--primary" to="/">Go to homepage</Link>{" "}
            <Link className="btn btn--ghost" to="/products" style={{ color: "var(--c-ink)" }}>
              Browse products
            </Link>
          </p>
        </div>
      </Section>
    </>
  );
}
