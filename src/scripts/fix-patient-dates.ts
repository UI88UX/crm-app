// src/scripts/fix-patient-dates.ts
// این اسکریپت را یکبار اجرا کنید تا تاریخ‌های اشتباه را اصلاح کند

import { createAdminClient } from "@/lib/supabase/admin";
import moment from 'moment-jalaali';

async function fixPatientDates() {
  const supabase = createAdminClient();
  
  // دریافت همه بیماران
  const { data: patients, error } = await supabase
    .from('patients')
    .select('id, birth_date')
    .not('birth_date', 'is', null);
  
  if (error) {
    console.error('Error fetching patients:', error);
    return;
  }
  
  for (const patient of patients) {
    const birthDate = patient.birth_date;
    
    // اگر تاریخ شمسی است (با 13 شروع می‌شود)
    if (birthDate && birthDate.startsWith('13')) {
      const m = moment(birthDate, 'jYYYY-MM-DD');
      if (m.isValid()) {
        const gregorianDate = m.format('YYYY-MM-DD');
        console.log(`Fixing ${patient.id}: ${birthDate} -> ${gregorianDate}`);
        
        // به‌روزرسانی در دیتابیس
        await supabase
          .from('patients')
          .update({ birth_date: gregorianDate })
          .eq('id', patient.id);
      }
    }
  }
  
  console.log('Done!');
}

fixPatientDates();