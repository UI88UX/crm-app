// types/audiogram.ts

export interface TestPoint {
    db: number | null; // در دیتابیس null برای مقادیر خالی بهتر است
    masked: boolean;
  }
  
  export interface FrequencyData {
    air: TestPoint;
    bone: TestPoint;
  }
  
  // نوع داده برای هر گوش (راست یا چپ)
  export type EarData = Record<number, FrequencyData>;
  
  // فرکانس‌های استاندارد
  export const FREQUENCIES = [250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000] as const;
  
  // مقادیر dB برای محور عمودی
  export const DB_VALUES = [-10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120] as const;

  
  // تابع کمکی برای ساخت داده خالی
  export const createEmptyEarData = (): EarData => {
    const data: EarData = {};
    FREQUENCIES.forEach((freq) => {
      data[freq] = {
        air: { db: null, masked: false },
        bone: { db: null, masked: false },
      };
    });
    return data;
  };
  
  // ساختار کامل داده‌های تست شنوایی که در فیلد audiogram_data ذخیره می‌شود
  export interface AudiogramTestData {
    audiogram: {
      right_ear: EarData;
      left_ear: EarData;
    };
    speech_audiometry: {
      srt_right: number | null;
      srt_left: number | null;
      wrs_right: number | null;
      wrs_left: number | null;
    };
    tympanometry: {
      type_right: string | null;
      type_left: string | null;
    };
    otoscopy: {
      right: { normal: boolean; perforation: boolean; canal_redness: boolean; impacted_cerumen: boolean };
      left: { normal: boolean; perforation: boolean; canal_redness: boolean; impacted_cerumen: boolean };
    };
    symptoms: {
      noise_exposure: boolean;
      background_noise_difficulty: boolean;
      hyperacusis: boolean;
      vertigo_balance: boolean;
      otalgia: boolean;
      otorrhea: boolean;
      sudden_fluctuating_loss: boolean;
      history_ear_infections_surgeries: boolean;
      aural_fullness: boolean;
      tinnitus: {
        present: boolean;
        location: 'left' | 'right' | 'both' | null;
      };
    };
    clinical_notes: string | null;
  }