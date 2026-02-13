import Link from "next/link";

interface BreadcrumbsProps {
  items: { label: string; href?: string }[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="text-sm mb-6">
      <ol className="flex items-center gap-2">
        <li>
          <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            Home
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="text-gray-400 dark:text-gray-600">/</span>
            {item.href ? (
              <Link href={item.href} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-700 dark:text-gray-200">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
