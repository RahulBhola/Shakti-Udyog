import { useEffect, useState } from "react";
import { adminApi, type AdminCategory } from "../../api/adminApi";
import { EmptyState, Loading } from "../../components/ui";

export default function AdminCategoryPage() {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.categories().then(setCategories).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <>
      <h1>Categories</h1>
      {error && <EmptyState title="Categories unavailable" text={error} />}
      {!categories && !error && <Loading label="Loading categories" />}
      {categories && categories.length === 0 && <EmptyState title="No categories" />}
      {categories && categories.length > 0 && (
        <div className="list-rows">
          {categories.map((c) => (
            <div key={c.id} className="list-row">
              <div className="list-row__main">
                <div className="list-row__title">{c.name}</div>
                <div className="list-row__meta">{c.slug ?? "—"} · Order: {c.displayOrder} · {c.isVisible ? "Visible" : "Hidden"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
