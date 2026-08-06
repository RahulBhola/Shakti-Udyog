import { Link } from "react-router-dom";

export function UnauthorizedPage() {
  return (
    <main className="page">
      <h1>Sign-in required</h1>
      <p>You need to sign in to view this page.</p>
      <Link to="/login">Go to sign in</Link>
    </main>
  );
}

export function AccessDeniedPage() {
  return (
    <main className="page">
      <h1>Access denied</h1>
      <p>Your account does not have permission to view this page.</p>
      <Link to="/">Return to home</Link>
    </main>
  );
}
