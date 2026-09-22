// src/components/admin/AdminLogoutButton.tsx
'use client';

import { LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { adminLogout } from '@/lib/supabase/admin-auth-actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminLogoutButtonProps {
  compact?: boolean;
}

export function AdminLogoutButton({ compact = false }: AdminLogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      queryClient.clear();
      await adminLogout();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className="p-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
        aria-label="خروج"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={cn(
        'flex items-center gap-2 w-full px-3 py-2.5 rounded-lg',
        'text-gray-400 hover:bg-red-900/30 hover:text-red-400',
        'transition-colors text-xs disabled:opacity-50'
      )}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <LogOut className="h-3.5 w-3.5" />
      )}
      <span>خروج از پنل</span>
    </button>
  );
}