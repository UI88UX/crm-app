'use client';

import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ColorVariant = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  color?: ColorVariant;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

const colorStyles: Record<ColorVariant, { bg: string; iconBg: string; iconColor: string }> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    iconBg: 'bg-green-100 dark:bg-green-900/40',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    iconBg: 'bg-purple-100 dark:bg-purple-900/40',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    iconBg: 'bg-orange-100 dark:bg-orange-900/40',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    iconBg: 'bg-red-100 dark:bg-red-900/40',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-950/20',
    iconBg: 'bg-gray-100 dark:bg-gray-900/40',
    iconColor: 'text-gray-600 dark:text-gray-400',
  },
};

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  color = 'blue',
  trend,
  loading = false,
}: StatsCardProps) {
  const styles = colorStyles[color];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold tracking-tight mb-1">
              {typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground truncate">
                {description}
              </p>
            )}
            {trend && (
              <p
                className={cn(
                  'text-xs font-medium mt-1',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? '▲' : '▼'} {Math.abs(trend.value)}%
              </p>
            )}
          </div>

          {/* Icon */}
          <div
            className={cn(
              'p-3 rounded-xl shrink-0',
              styles.iconBg
            )}
          >
            <Icon className={cn('h-6 w-6', styles.iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}