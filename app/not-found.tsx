import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found">
      <h1 className="h1">This page doesn’t exist</h1>
      <p className="lead">The link may be old, or the address mistyped.</p>
      <Link className="btn btn-primary" href="/">Go to Runway</Link>
    </div>
  );
}
