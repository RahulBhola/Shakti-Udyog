interface PortalPlaceholderProps {
  title: string;
  milestone: string;
}

/**
 * Placeholder page for portals that ship in later milestones. Real portal
 * access will require authentication and backend-enforced authorization.
 */
export function PortalPlaceholder({ title, milestone }: PortalPlaceholderProps) {
  return (
    <main className="page">
      <h1>{title}</h1>
      <p className="placeholder-note">
        [Placeholder — this portal is implemented in {milestone}. Access will
        require sign-in and server-side authorization.]
      </p>
    </main>
  );
}
