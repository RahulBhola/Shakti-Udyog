/** Loading skeleton placeholders for portal pages. */
export function SkeletonCard({ height = 120 }: { height?: number }) {
  return (
    <div style={{
      background: "var(--glass)",
      borderRadius: "var(--radius-lg)",
      height,
      animation: "shimmer 1.5s infinite",
      backgroundImage: "linear-gradient(90deg, var(--glass) 25%, rgba(125,211,252,0.05) 50%, var(--glass) 75%)",
      backgroundSize: "200% 100%",
    }} />
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gap: "var(--sp-3)" }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{
          height: 60,
          background: "var(--glass)",
          borderRadius: "var(--radius)",
          animation: "shimmer 1.5s infinite",
          backgroundImage: "linear-gradient(90deg, var(--glass) 25%, rgba(125,211,252,0.05) 50%, var(--glass) 75%)",
          backgroundSize: "200% 100%",
        }} />
      ))}
    </div>
  );
}
