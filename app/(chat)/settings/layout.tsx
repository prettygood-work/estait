import Link from 'next/link';
import { ReactNode } from 'react';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-muted/10 p-6">
        <h2 className="text-lg font-semibold mb-4">Settings</h2>
        <nav className="space-y-2">
          <Link
            href="/settings/integrations"
            className="block px-3 py-2 rounded-md hover:bg-muted transition-colors"
          >
            Integrations
          </Link>
        </nav>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
