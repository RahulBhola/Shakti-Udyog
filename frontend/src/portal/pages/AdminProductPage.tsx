import { useEffect, useState } from "react";
import { adminApi, type AdminProduct } from "../../api/adminApi";
import { EmptyState, Loading } from "../../components/ui";
import { formatDate } from "../shared";

export default function AdminProductListPage() {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.products().then(setProducts).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <>
      <h1>Products</h1>
      {error && <EmptyState title="Products unavailable" text={error} />}
      {!products && !error && <Loading label="Loading products" />}
      {products && products.length === 0 && <EmptyState title="No products" />}
      {products && products.length > 0 && (
        <div className="list-rows">
          {products.map((p) => (
            <div key={p.id} className="list-row">
              <div className="list-row__main">
                <div className="list-row__title">{p.title}</div>
                <div className="list-row__meta">{p.slug} · {formatDate(p.createdAtUtc)} · {p.isPublished ? "Published" : "Draft"}</div>
              </div>
              <span style={{ fontSize: "var(--fs-xs)", padding: "0.2rem 0.6rem", borderRadius: 999, background: p.isPublished ? "rgba(110,231,183,0.12)" : "rgba(255,107,107,0.12)", color: p.isPublished ? "var(--c-success)" : "var(--c-error)" }}>
                {p.isPublished ? "Published" : "Draft"}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
