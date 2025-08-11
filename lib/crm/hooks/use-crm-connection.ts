import { useState, useEffect } from 'react';
import { getCRMAdapter } from '@/lib/crm/factory';
import type { CRMType } from '@/lib/crm/factory';

export function useCRMConnection(crmType: CRMType = 'wise_agent') {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/crm/status');
        if (response.ok) {
          const { crms } = await response.json();
          const crm = crms.find((c: any) => c.type === crmType);
          setIsConnected(crm?.connected || false);
        }
      } catch (error) {
        console.error('Error checking CRM connection:', error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [crmType]);

  return { isConnected, isLoading };
}