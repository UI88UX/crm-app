// src/components/appointments/PatientSearchResult.tsx
import React from 'react';
import { User, CreditCard, Phone, ChevronRight } from 'lucide-react';
import type { Patient } from '@/types';

interface PatientSearchResultProps {
  patient: Patient;
  onSelect: (patient: Patient) => void;
}

export const PatientSearchResult = React.memo(({ patient, onSelect }: PatientSearchResultProps) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(patient)}
      className="w-full text-left p-4 hover:bg-primary/5 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">
            {patient.first_name} {patient.last_name}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" />
              {patient.national_code}
            </span>
            {patient.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {patient.phone}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </div>
    </button>
  );
});

PatientSearchResult.displayName = 'PatientSearchResult';