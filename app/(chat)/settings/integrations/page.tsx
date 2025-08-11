'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function IntegrationsPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  
  useEffect(() => {
    checkConnection();
  }, []);
  
  async function checkConnection() {
    try {
      const response = await fetch('/api/crm/status');
      if (!response.ok) {
        throw new Error('Failed to check connection status');
      }
      const data = await response.json();
      const wiseAgent = data.crms?.find((crm: any) => crm.type === 'wise_agent');
      setIsConnected(wiseAgent?.connected || false);
    } catch (error) {
      console.error('Error checking connection:', error);
      toast.error('Failed to check connection status');
    } finally {
      setIsLoading(false);
    }
  }
  
  async function handleConnect() {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/auth/wiseagent');
      if (!response.ok) {
        throw new Error('Failed to initiate connection');
      }
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('Error connecting:', error);
      toast.error('Failed to connect to Wise Agent');
      setIsConnecting(false);
    }
  }
  
  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect your Wise Agent account?')) {
      return;
    }
    
    setIsDisconnecting(true);
    try {
      const response = await fetch('/api/crm/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ crmType: 'wise_agent' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }
      
      setIsConnected(false);
      toast.success('Successfully disconnected from Wise Agent');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect from Wise Agent');
    } finally {
      setIsDisconnecting(false);
    }
  }
  
  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your external services to enhance Estait AI capabilities
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">W</span>
              </div>
              <div>
                <CardTitle>Wise Agent CRM</CardTitle>
                <CardDescription>
                  Connect your Wise Agent account to manage leads, contacts, and tasks
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : isConnected ? (
                <>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">Connected</span>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                    size="sm"
                  >
                    {isDisconnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      'Disconnect'
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <XCircle className="w-5 h-5" />
                    <span className="text-sm">Not connected</span>
                  </div>
                  <Button 
                    onClick={handleConnect}
                    disabled={isConnecting}
                    size="sm"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect'
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Features</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Create and manage leads directly from chat</li>
                <li>• Add notes and track interactions</li>
                <li>• Search contacts by name, email, or phone</li>
                <li>• Create tasks and set reminders</li>
                <li>• Link properties to contacts</li>
                <li>• View and assign to team members</li>
              </ul>
            </div>
            
            {isConnected && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/chat?message=Show my team members'}
                  >
                    View Team
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/chat?message=Search for recent contacts'}
                  >
                    Recent Contacts
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/chat?message=Create a new lead'}
                  >
                    Add Lead
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/chat?message=Show my tasks'}
                  >
                    View Tasks
                  </Button>
                </div>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground">
              <p>
                By connecting, you authorize Estait AI to access your Wise Agent data including
                contacts, tasks, and team information. You can revoke access at any time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Need help? Check out our{' '}
          <a 
            href="/docs/integrations/wise-agent" 
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            integration guide
            <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </div>
    </div>
  );
}