import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-muted text-lg mb-8">Page not found</p>
      <Link
        href="/"
        className="text-blue-600 dark:text-blue-400 hover:underline"
      >
        ← Back to home
      </Link>
    </div>
  );
}
