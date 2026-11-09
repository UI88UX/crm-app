// components/audiogram/AudiogramLiveTable.tsx
'use client';

import { EarData, FREQUENCIES } from '@/types/audiogram';
import { cn } from '@/lib/utils';

interface AudiogramLiveTableProps {
  data: EarData;
  isRight: boolean;
}

export function AudiogramLiveTable({ data, isRight }: AudiogramLiveTableProps) {
  const colorClass = isRight ? 'text-red-600' : 'text-blue-600';
  const bgClass = isRight ? 'bg-red-50/30' : 'bg-blue-50/30';
  const borderClass = isRight ? 'border-red-200' : 'border-blue-200';

  return (
    <div className={cn("mt-2 rounded-md border overflow-hidden w-full max-w-[200px]", borderClass)}>
      <table className="w-full text-[8px] text-center border-collapse leading-tight">
        <thead>
          <tr className={cn("text-slate-600", bgClass)}>
            <th className="border-b border-r p-1 font-semibold w-12">Hz</th>
            <th className={cn("border-b border-r p-1 font-semibold", colorClass)}>Air</th>
            <th className={cn("border-b p-1 font-semibold", colorClass)}>Bone</th>
          </tr>
        </thead>
        <tbody>
          {FREQUENCIES.map((freq) => {
            const air = data[freq]?.air;
            const bone = data[freq]?.bone;

            return (
              <tr key={freq} className="hover:bg-slate-50">
                <td className="border-r border-b border-slate-100 p-1 font-medium bg-slate-50/50">{freq >= 1000 ? `${freq / 1000}k` : freq}</td>
                <td className="border-r border-b border-slate-100 p-1">
                  {air?.db !== null ? air?.db : '-'}
                  {air?.masked && <span className="text-[9px] text-slate-400 mr-0.5">M</span>}
                </td>
                <td className="border-b border-slate-100 p-1">
                  {bone?.db !== null ? bone?.db : '-'}
                  {bone?.masked && <span className="text-[9px] text-slate-400 mr-0.5">M</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}