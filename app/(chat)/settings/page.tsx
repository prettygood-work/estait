import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage integrations and preferences.
        </p>
      </div>
      <div className="grid gap-4">
        <Link
          href="/settings/integrations"
          className="border rounded-lg p-5 hover:bg-muted/40 transition-colors flex flex-col gap-1"
        >
          <span className="font-medium">Integrations</span>
          <span className="text-xs text-muted-foreground">
            Connect Wise Agent CRM and future services.
          </span>
        </Link>
      </div>
    </div>
  );
}
}
}
