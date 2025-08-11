'use client';

import { UserPlus, Search, NotebookPen, Calendar, Users, Link, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  prompt: string;
  color: string;
}

const actions: QuickAction[] = [
  {
    icon: UserPlus,
    label: 'Add Lead',
    prompt: 'Add lead ',
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    icon: Search,
    label: 'Find Contact',
    prompt: 'Search for contact ',
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    icon: NotebookPen,
    label: 'Add Note',
    prompt: 'Add note to ',
    color: 'bg-yellow-500 hover:bg-yellow-600',
  },
  {
    icon: Calendar,
    label: 'Create Task',
    prompt: 'Create task: ',
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    icon: Link,
    label: 'Link Property',
    prompt: 'Link property to ',
    color: 'bg-orange-500 hover:bg-orange-600',
  },
  {
    icon: Users,
    label: 'View Team',
    prompt: 'Show my team members',
    color: 'bg-indigo-500 hover:bg-indigo-600',
  },
  {
    icon: LogIn,
    label: 'Open Wise Agent',
    prompt: 'Generate Wise Agent login link',
    color: 'bg-pink-500 hover:bg-pink-600',
  },
];

interface WiseAgentQuickActionsProps {
  onAction: (prompt: string) => void;
  isLoading?: boolean;
}

export function WiseAgentQuickActions({ onAction, isLoading = false }: WiseAgentQuickActionsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-4 md:px-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
      {actions.map((action) => (
        <Button
          key={action.label}
          onClick={() => onAction(action.prompt)}
          disabled={isLoading}
          variant="ghost"
          size="sm"
          className={`
            flex items-center gap-2 whitespace-nowrap text-white
            transition-all duration-200 ${action.color}
            hover:scale-105 active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <action.icon className="w-4 h-4" />
          <span className="text-sm font-medium">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}

// Mobile-optimized version with larger touch targets
export function WiseAgentQuickActionsMobile({ onAction, isLoading = false }: WiseAgentQuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 p-4">
      {actions.slice(0, 4).map((action) => (
        <Button
          key={action.label}
          onClick={() => onAction(action.prompt)}
          disabled={isLoading}
          variant="ghost"
          className={`
            flex flex-col items-center gap-2 p-4 h-auto
            text-white transition-all duration-200 ${action.color}
            hover:scale-105 active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <action.icon className="w-6 h-6" />
          <span className="text-xs font-medium">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}