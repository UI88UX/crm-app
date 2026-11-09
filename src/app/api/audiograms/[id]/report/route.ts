// app/api/audiograms/[id]/report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // از سرویس رول برای دسترسی بدون محدودیت RLS استفاده می‌کنیم
);

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const testId = params.id;

    try {
        // ۱. واکشی داده‌های تست از Supabase
        const { data: test, error } = await supabase
            .from('hearing_tests')
            .select('*, patients(first_name, last_name, national_code)')
            .eq('id', testId)
            .single();

        if (error || !test) {
            return NextResponse.json({ error: 'تست یافت نشد' }, { status: 404 });
        }

        // ۲. ساخت پرامپت برای هوش مصنوعی
        const patientName = test.patients
            ? `${test.patients.first_name} ${test.patients.last_name}`
            : 'نامشخص';
        const patientCode = test.patients?.national_code || 'نامشخص';

        const systemPrompt = `You are an expert clinical audiologist. Based on the provided hearing test data, write ONLY a concise clinical interpretation (max 150 words) in Persian. Do NOT include tables or patient demographics. Focus on: type and degree of hearing loss for each ear, and a brief differential diagnosis`;

        const userPrompt = `
Patient: ${patientName} (Code: ${patientCode})
Test Date: ${test.test_date}
Audiogram Data (JSON):
${JSON.stringify(test.audiogram_data, null, 2)}
`;

        // ۳. ارسال درخواست به Pollinations AI (روش رایگان و بدون کلید)
        const response = await fetch('https://text.pollinations.ai/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'openai', // مدل پیش‌فرض رایگان
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.3, // برای خروجی بالینی دقیق‌تر
                max_tokens: 1500,
            }),
        });

        if (!response.ok) {
            throw new Error(`Pollinations API error: ${response.status}`);
        }

        const data = await response.json();
        const reportText = data.choices[0].message.content;

        // ۴. ذخیره گزارش در دیتابیس (اختیاری اما توصیه می‌شود)
        await supabase
            .from('hearing_tests')
            .update({ interpretation: reportText })
            .eq('id', testId);

        // ۵. بازگرداندن گزارش
        return NextResponse.json({ report: reportText });
    } catch (error: any) {
        console.error('Error generating report:', error);
        return NextResponse.json(
            { error: error.message || 'خطا در تولید گزارش' },
            { status: 500 }
        );
    }
}