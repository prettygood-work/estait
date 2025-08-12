'use client';

import { useEffect, useState } from 'react';

interface WiseAgentStatus {
  connected: boolean;
  expiresAt?: string;
  expired?: boolean;
}

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [waStatus, setWaStatus] = useState<WiseAgentStatus | null>(null);
  const [pending, setPending] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/crm/wise-agent/status', { cache: 'no-store' });
      setWaStatus(await r.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function connect() {
    window.location.href = '/api/auth/wiseagent';
  }

  async function disconnect() {
    setPending(true);
    try {
      await fetch('/api/crm/wise-agent/disconnect', { method: 'POST' });
      await load();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Connect CRMs and enable AI tooling. Wise Agent is the first supported CRM.
        </p>
      </div>

      <section className="border rounded-lg p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="font-medium">Wise Agent CRM</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Once connected, create leads, notes, tasks, view team, and generate SSO links directly in chat.
          </p>
          {waStatus?.expiresAt && (
            <p className="text-xs text-muted-foreground">
              Token expires: {new Date(waStatus.expiresAt).toLocaleString()}
              {waStatus.expired && <span className="text-red-500 ml-1">(expired)</span>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-sm">Checking…</span>
          ) : waStatus?.connected ? (
            <>
              <span className="text-green-600 text-sm">Connected</span>
              <button
                disabled={pending}
                onClick={disconnect}
                className="text-xs border rounded px-3 py-1 hover:bg-neutral-100 disabled:opacity-50"
              >
                {pending ? '...' : 'Disconnect'}
              </button>
            </>
          ) : (
            <button
              disabled={pending}
              onClick={connect}
              className="text-xs border rounded px-3 py-1 hover:bg-neutral-100 disabled:opacity-50"
            >
              {pending ? '...' : 'Connect'}
            </button>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-medium">Chat Examples</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Create lead Jane Doe 555-1234 jane@example.com</li>
          <li>Add note to Jane Doe that she wants a 3 bed home</li>
          <li>Create task to follow up with Jane tomorrow</li>
          <li>Show my team members</li>
          <li>Generate Wise Agent login link</li>
        </ul>
      </section>
    </div>
  );
}
      </section>
    </div>
  );
}
