'use client';

import Link from 'next/link';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: string;
  breadcrumbs?: Breadcrumb[];
}

export default function PageHeader({ title, description, icon, breadcrumbs }: PageHeaderProps) {
  const defaultBreadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', href: '/dashboard' },
    ...(breadcrumbs || []),
    { label: title },
  ];

  return (
    <div className="mb-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-3">
        <ol className="flex items-center gap-1.5 text-sm text-slate-500">
          {defaultBreadcrumbs.map((crumb, index) => (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-teal-600 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-800 font-medium">{crumb.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Title */}
      <div className="flex items-center gap-3">
        {icon && <span className="text-2xl">{icon}</span>}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
          {description && <p className="text-slate-500 mt-1">{description}</p>}
        </div>
      </div>
    </div>
  );
}
