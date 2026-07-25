import { createClient } from "@/lib/supabase/server";
import NewPatientClient from "./page.client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ثبت بیمار جدید | سیستم مدیریت مطب",
  description: "ثبت اطلاعات بیمار جدید در مطب شنوایی‌سنجی",
};

export default async function NewPatientPage() {
  const supabase = await createClient();
  
  // بررسی احراز هویت
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">لطفاً وارد حساب کاربری خود شوید</h2>
      </div>
    );
  }

  return <NewPatientClient />;
}