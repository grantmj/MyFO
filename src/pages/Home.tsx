import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../api/client";
import { getExample, createExample, ExampleItem } from "../api/example";

interface HealthResponse {
  ok: boolean;
  service: string;
}

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [items, setItems] = useState<ExampleItem[]>([]);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formValue, setFormValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      setHealthError(null);
      const data = await apiFetch<HealthResponse>("/health");
      setHealth(data);
    } catch (e) {
      setHealthError(e instanceof Error ? e.message : "Failed to fetch health");
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      setItemsError(null);
      const data = await getExample();
      setItems(data.items);
    } catch (e) {
      setItemsError(e instanceof Error ? e.message : "Failed to fetch items");
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createExample({ name: formName, value: formValue || undefined });
      setFormName("");
      setFormValue("");
      await fetchItems();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container">
      <h1>project-web</h1>

      <section>
        <h2>Health</h2>
        {health ? (
          <p className="success">
            {health.service}: {health.ok ? "ok" : "error"}
          </p>
        ) : healthError ? (
          <p className="error">{healthError}</p>
        ) : (
          <p>Loading…</p>
        )}
      </section>

      <section>
        <h2>Example Items</h2>
        {itemsError ? (
          <p className="error">{itemsError}</p>
        ) : items.length === 0 ? (
          <p>No items yet.</p>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <code>{JSON.stringify(item)}</code>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Add Item</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Value (optional)"
            value={formValue}
            onChange={(e) => setFormValue(e.target.value)}
          />
          <button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create"}
          </button>
        </form>
        {submitError && <p className="error">{submitError}</p>}
      </section>
    </main>
  );
}
