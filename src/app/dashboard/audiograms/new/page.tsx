'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { AudiogramChart } from '@/components/audiogram/AudiogramChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    EarData,
    createEmptyEarData,
    AudiogramTestData,
} from '@/types/audiogram';
import { useSearchParams } from 'next/navigation';
import { AudiogramLiveTable } from '@/components/audiogram/AudiogramLiveTable';

const supabase = createClient();

// -------------------------------------------------------------
// 1. توابع ارتباط با دیتابیس
// -------------------------------------------------------------

/**
 * دریافت اطلاعات کاربر جاری و tenant_id او از سشن Supabase
 */
async function getCurrentUserContext() {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('کاربر احراز هویت نشده است.');

    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, tenant_id')
        .eq('id', user.id)
        .maybeSingle();

    if (profileError || !profile) throw new Error('پروفایل کاربر یافت نشد.');

    return { userId: profile.id, tenantId: profile.tenant_id };
}

/**
 * واکشی لیست بیماران فعال در همان tenant
 */
async function fetchPatients(tenantId: string) {
    const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, national_code')
        .eq('tenant_id', tenantId)
        .eq('is_active', true) 
        .is('deleted_at', null) 
        .order('last_name', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
}

/**
 * ذخیره تست شنوایی در جدول hearing_tests
 */
async function saveHearingTest(
    tenantId: string,
    patientId: string,
    doctorId: string,
    testData: AudiogramTestData
) {
    const { data, error } = await supabase
        .from('hearing_tests')
        .insert({
            tenant_id: tenantId,
            patient_id: patientId,
            doctor_id: doctorId,
            test_type: 'comprehensive',
            audiogram_data: testData, // کل داده‌ها در یک فیلد JSONB
            test_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

// -------------------------------------------------------------
// 2. کامپوننت اصلی
// -------------------------------------------------------------

export default function NewAudiogramPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const initialPatientId = searchParams.get('patientId') || '';
    const isPatientLocked = !!initialPatientId;

    // --- 2.1. دریافت اطلاعات کاربر و tenant ---
    const {
        data: userContext,
        isLoading: isUserLoading,
        error: userError,
    } = useQuery({
        queryKey: ['current-user-context'],
        queryFn: getCurrentUserContext,
        staleTime: Infinity, // اطلاعات کاربر تغییر نمی‌کند
    });

    const tenantId = userContext?.tenantId;
    const userId = userContext?.userId;

    // --- 2.2. State های فرم ---
    const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId);
    const [rightData, setRightData] = useState<EarData>(createEmptyEarData());
    const [leftData, setLeftData] = useState<EarData>(createEmptyEarData());
    const [activeInputType, setActiveInputType] = useState<'air' | 'bone'>('air');
    const [activeMasked, setActiveMasked] = useState<boolean>(false);
    const [notes, setNotes] = useState<string>('');

    const [symptoms, setSymptoms] = useState({
        noise_exposure: false,
        background_noise_difficulty: false,
        hyperacusis: false,
        vertigo_balance: false,
        otalgia: false,
        otorrhea: false,
        sudden_fluctuating_loss: false,
        history_ear_infections_surgeries: false,
        aural_fullness: false,
        tinnitus: false,
        tinnitus_location: '' as '' | 'left' | 'right' | 'both',
    });

    const [speech, setSpeech] = useState({
        srt_right: '' as number | '',
        srt_left: '' as number | '',
        wrs_right: '' as number | '',
        wrs_left: '' as number | '',
    });

    const [tymp, setTymp] = useState({
        type_right: '',
        type_left: '',
    });

    const [otoscopy, setOtoscopy] = useState({
        right: {
            normal: false,
            perforation: false,
            canal_redness: false,
            impacted_cerumen: false,
        },
        left: {
            normal: false,
            perforation: false,
            canal_redness: false,
            impacted_cerumen: false,
        },
    });

    // --- 2.3. واکشی بیماران ---
    const {
        data: patients,
        isLoading: isLoadingPatients,
        error: patientsError,
    } = useQuery({
        queryKey: ['patients', tenantId],
        queryFn: () => fetchPatients(tenantId!),
        enabled: !!tenantId, // فقط وقتی tenantId داریم اجرا شود
    });

    // --- 2.4. Mutation برای ذخیره ---
    const mutation = useMutation({
        mutationFn: (testData: AudiogramTestData) =>
            saveHearingTest(tenantId!, selectedPatientId, userId!, testData),
        onSuccess: () => {
            toast.success('تست شنوایی با موفقیت ذخیره شد.');
            queryClient.invalidateQueries({ queryKey: ['hearing_tests', tenantId] });
            router.push('/dashboard/audiograms');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // --- 2.5. مدیریت تغییر نقطه در نمودار ---
    const handlePointChange = (
        isRight: boolean,
        freq: number,
        type: 'air' | 'bone',
        db: number | null
    ) => {
        const setter = isRight ? setRightData : setLeftData;
        setter((prev) => ({
            ...prev,
            [freq]: {
                ...prev[freq],
                [type]: { ...prev[freq][type], db, masked: activeMasked },
            },
        }));
    };

    // --- 2.6. ارسال فرم ---
    const handleSubmit = () => {
        if (!selectedPatientId) {
            toast.error('لطفاً ابتدا یک بیمار انتخاب کنید.');
            return;
        }
        if (!tenantId || !userId) {
            toast.error('اطلاعات کاربری یافت نشد. لطفاً دوباره وارد شوید.');
            return;
        }

        const testData: AudiogramTestData = {
            audiogram: {
                right_ear: rightData,
                left_ear: leftData,
            },
            speech_audiometry: {
                srt_right: speech.srt_right === '' ? null : Number(speech.srt_right),
                srt_left: speech.srt_left === '' ? null : Number(speech.srt_left),
                wrs_right: speech.wrs_right === '' ? null : Number(speech.wrs_right),
                wrs_left: speech.wrs_left === '' ? null : Number(speech.wrs_left),
            },
            tympanometry: {
                type_right: tymp.type_right || null,
                type_left: tymp.type_left || null,
            },
            otoscopy,
            symptoms: {
                ...symptoms,
                tinnitus: {
                    present: symptoms.tinnitus,
                    location: symptoms.tinnitus ? symptoms.tinnitus_location || null : null,
                },
            },
            clinical_notes: notes.trim() || null,
        };

        mutation.mutate(testData);
    };

    // --- 2.7. رندر حالت‌های بارگذاری / خطا ---
    if (isUserLoading || isLoadingPatients) {
        return <div className="p-8 text-center">در حال بارگذاری...</div>;
    }

    if (userError || patientsError) {
        return (
            <div className="p-8 text-center text-red-500">
                خطا در بارگذاری اطلاعات. لطفاً صفحه را رفرش کنید.
            </div>
        );
    }

    // --- 2.8. رندر اصلی ---
    return (
        <div className="container mx-auto p-6 space-y-6 max-w-6xl">
            {/* هدر صفحه */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">تست شنوایی جدید</h1>
                <Button variant="outline" onClick={() => router.back()}>
                    بازگشت
                </Button>
            </div>

            {/* 1. انتخاب بیمار */}
            <Card>
                <CardHeader>
                    <CardTitle>اطلاعات بیمار</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>انتخاب بیمار</Label>
                            <Select value={selectedPatientId} onValueChange={setSelectedPatientId} disabled={isPatientLocked}>
                                <SelectTrigger>
                                    <SelectValue placeholder="یک بیمار را انتخاب کنید..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {patients?.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.first_name} {p.last_name}{' '}
                                            {p.national_code ? `(${p.national_code})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. چک‌لیست علائم */}
            <Card>
                <CardHeader>
                    <CardTitle>چک‌لیست علائم</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { key: 'noise_exposure', label: 'سابقه قرار گرفتن در معرض صدا' },
                        { key: 'background_noise_difficulty', label: 'مشکل شنوایی در محیط پر سر و صدا' },
                        { key: 'hyperacusis', label: 'حساسیت به صداهای بلند' },
                        { key: 'vertigo_balance', label: 'سرگیجه یا مشکلات تعادل' },
                        { key: 'otalgia', label: 'درد گوش' },
                        { key: 'otorrhea', label: 'ترشح از گوش' },
                        { key: 'sudden_fluctuating_loss', label: 'کاهش شنوایی ناگهانی یا نوسانی' },
                        { key: 'history_ear_infections_surgeries', label: 'سابقه عفونت یا جراحی گوش' },
                        { key: 'aural_fullness', label: 'پری گوش' },
                    ].map((s) => (
                        <div key={s.key} className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox
                                id={s.key}
                                checked={(symptoms as any)[s.key]}
                                onCheckedChange={(c) =>
                                    setSymptoms((prev) => ({ ...prev, [s.key]: !!c }))
                                }
                            />
                            <Label htmlFor={s.key}>{s.label}</Label>
                        </div>
                    ))}

                    {/* وزوز گوش */}
                    <div className="flex flex-col space-y-2 col-span-full border-t pt-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox
                                id="tinnitus"
                                checked={symptoms.tinnitus}
                                onCheckedChange={(c) =>
                                    setSymptoms((prev) => ({
                                        ...prev,
                                        tinnitus: !!c,
                                        tinnitus_location: c ? prev.tinnitus_location : '',
                                    }))
                                }
                            />
                            <Label htmlFor="tinnitus">وزوز گوش (Tinnitus)</Label>
                        </div>
                        {symptoms.tinnitus && (
                            <div className="flex space-x-4 space-x-reverse pr-6">
                                {['left', 'right', 'both'].map((loc) => (
                                    <label key={loc} className="flex items-center space-x-1 space-x-reverse">
                                        <input
                                            type="radio"
                                            name="tinnitus_loc"
                                            value={loc}
                                            checked={symptoms.tinnitus_location === loc}
                                            onChange={() =>
                                                setSymptoms((prev) => ({
                                                    ...prev,
                                                    tinnitus_location: loc as any,
                                                }))
                                            }
                                        />
                                        <span>
                                            {loc === 'left' ? 'چپ' : loc === 'right' ? 'راست' : 'هر دو'}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 3. نمودارها */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
                    <CardTitle>ادیوگرام (Pure Tone)</CardTitle>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex rounded-md border p-0.5 bg-slate-50">
                            <Button
                                size="sm"
                                variant={activeInputType === 'air' ? 'default' : 'ghost'}
                                onClick={() => setActiveInputType('air')}
                            >
                                Air
                            </Button>
                            <Button
                                size="sm"
                                variant={activeInputType === 'bone' ? 'default' : 'ghost'}
                                onClick={() => setActiveInputType('bone')}
                            >
                                Bone
                            </Button>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox
                                id="masked"
                                checked={activeMasked}
                                onCheckedChange={(c) => setActiveMasked(!!c)}
                            />
                            <Label htmlFor="masked">Masked</Label>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* ستون گوش راست */}
                    <div className="flex flex-col items-center w-full">
                        <div className="w-full max-w-[450px]"> {/* ← عرض حداکثر را افزایش دهید */}
                            <AudiogramChart
                                isRight={true}
                                data={rightData}
                                onPointChange={(f, t, d) => handlePointChange(true, f, t, d)}
                                activeInputType={activeInputType}
                            />
                        </div>
                        <AudiogramLiveTable data={rightData} isRight={true} />
                    </div>

                    {/* ستون گوش چپ */}
                    <div className="flex flex-col items-center w-full">
                        <div className="w-full max-w-[450px]">
                            <AudiogramChart
                                isRight={false}
                                data={leftData}
                                onPointChange={(f, t, d) => handlePointChange(false, f, t, d)}
                                activeInputType={activeInputType}
                            />
                        </div>
                        <AudiogramLiveTable data={leftData} isRight={false} />
                    </div>
                </CardContent>
            </Card>


            {/* 4. گفتار، اتوسکوپی و تیمپانومتری */}
            <Card>
                <CardHeader>
                    <CardTitle>گفتار، اتوسکوپی و تیمپانومتری</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* گوش راست */}
                    <div className="border-r-4 border-red-500 pr-4 space-y-4">
                        <h3 className="text-red-500 font-semibold">گوش راست</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label>SRT (dB)</Label>
                                <Input
                                    type="number"
                                    value={speech.srt_right}
                                    onChange={(e) =>
                                        setSpeech((prev) => ({
                                            ...prev,
                                            srt_right: e.target.value === '' ? '' : Number(e.target.value),
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <Label>WRS (%)</Label>
                                <Input
                                    type="number"
                                    value={speech.wrs_right}
                                    onChange={(e) =>
                                        setSpeech((prev) => ({
                                            ...prev,
                                            wrs_right: e.target.value === '' ? '' : Number(e.target.value),
                                        }))
                                    }
                                />
                            </div>
                        </div>
                        <div>
                            <Label>اتوسکوپی</Label>
                            <div className="flex flex-wrap gap-3 mt-1">
                                {(
                                    ['normal', 'perforation', 'canal_redness', 'impacted_cerumen'] as const
                                ).map((opt) => (
                                    <label key={opt} className="flex items-center gap-1 text-sm">
                                        <Checkbox
                                            checked={otoscopy.right[opt]}
                                            onCheckedChange={(c) =>
                                                setOtoscopy((prev) => ({
                                                    ...prev,
                                                    right: { ...prev.right, [opt]: !!c },
                                                }))
                                            }
                                        />
                                        {opt === 'normal'
                                            ? 'نرمال'
                                            : opt === 'perforation'
                                                ? 'پرفوراسیون'
                                                : opt === 'canal_redness'
                                                    ? 'قرمزی کانال'
                                                    : 'جرم گوش'}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label>تیمپانومتری</Label>
                            <Select
                                value={tymp.type_right}
                                onValueChange={(v) => setTymp((prev) => ({ ...prev, type_right: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="نوع" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="An">A (نرمال)</SelectItem>
                                    <SelectItem value="As">As (سفت)</SelectItem>
                                    <SelectItem value="B">B (مسطح)</SelectItem>
                                    <SelectItem value="C">C (منفی)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* گوش چپ */}
                    <div className="border-l-4 border-blue-500 pl-4 space-y-4">
                        <h3 className="text-blue-500 font-semibold">گوش چپ</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label>SRT (dB)</Label>
                                <Input
                                    type="number"
                                    value={speech.srt_left}
                                    onChange={(e) =>
                                        setSpeech((prev) => ({
                                            ...prev,
                                            srt_left: e.target.value === '' ? '' : Number(e.target.value),
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <Label>WRS (%)</Label>
                                <Input
                                    type="number"
                                    value={speech.wrs_left}
                                    onChange={(e) =>
                                        setSpeech((prev) => ({
                                            ...prev,
                                            wrs_left: e.target.value === '' ? '' : Number(e.target.value),
                                        }))
                                    }
                                />
                            </div>
                        </div>
                        <div>
                            <Label>اتوسکوپی</Label>
                            <div className="flex flex-wrap gap-3 mt-1">
                                {(
                                    ['normal', 'perforation', 'canal_redness', 'impacted_cerumen'] as const
                                ).map((opt) => (
                                    <label key={opt} className="flex items-center gap-1 text-sm">
                                        <Checkbox
                                            checked={otoscopy.left[opt]}
                                            onCheckedChange={(c) =>
                                                setOtoscopy((prev) => ({
                                                    ...prev,
                                                    left: { ...prev.left, [opt]: !!c },
                                                }))
                                            }
                                        />
                                        {opt === 'normal'
                                            ? 'نرمال'
                                            : opt === 'perforation'
                                                ? 'پرفوراسیون'
                                                : opt === 'canal_redness'
                                                    ? 'قرمزی کانال'
                                                    : 'جرم گوش'}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label>تیمپانومتری</Label>
                            <Select
                                value={tymp.type_left}
                                onValueChange={(v) => setTymp((prev) => ({ ...prev, type_left: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="نوع" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="An">A (نرمال)</SelectItem>
                                    <SelectItem value="As">As (سفت)</SelectItem>
                                    <SelectItem value="B">B (مسطح)</SelectItem>
                                    <SelectItem value="C">C (منفی)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 5. یادداشت‌ها */}
            <Card>
                <CardHeader>
                    <CardTitle>یادداشت‌های بالینی</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        rows={4}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="مشاهدات، تشخیص یا توصیه‌ها..."
                    />
                </CardContent>
            </Card>

            {/* 6. دکمه ذخیره */}
            <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={mutation.isPending} size="lg">
                    {mutation.isPending ? 'در حال ذخیره...' : 'ذخیره تست شنوایی'}
                </Button>
            </div>
        </div>
    );
}