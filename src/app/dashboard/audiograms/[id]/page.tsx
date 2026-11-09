'use client';

import { use, useState, useEffect } from 'react';
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
import { ReportModal } from '@/components/audiogram/ReportModal';
import { FileText } from 'lucide-react';
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
import { AudiogramLiveTable } from '@/components/audiogram/AudiogramLiveTable';

const supabase = createClient();

// -------------------------------------------------------------
// 1. توابع ارتباط با دیتابیس
// -------------------------------------------------------------


// تابع محاسبه سن از تاریخ تولد
function calculateAge(birthDate: string | null): string {
    if (!birthDate) return 'نامشخص';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age.toString();
}

async function fetchHearingTest(testId: string) {
    const { data, error } = await supabase
        .from('hearing_tests')
        .select(
            `
      *,
      patients ( id, first_name, last_name, national_code, birth_date )
    `
        )
        .eq('id', testId)
        .single();

    if (error) throw new Error(error.message);
    return data;
}

async function updateHearingTest(testId: string, testData: AudiogramTestData) {
    const { data, error } = await supabase
        .from('hearing_tests')
        .update({
            audiogram_data: testData,
            updated_at: new Date().toISOString(),
        })
        .eq('id', testId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

// -------------------------------------------------------------
// 2. کامپوننت اصلی
// -------------------------------------------------------------

export default function AudiogramDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const resolvedParams = use(params); // ← باز کردن Promise
    const testId = resolvedParams.id;

    // --- 2.1. واکشی تست ---
    const {
        data: test,
        isLoading: isLoadingTest,
        error: testError,
    } = useQuery({
        queryKey: ['hearing_test', testId],
        queryFn: () => fetchHearingTest(testId),
        enabled: !!testId,
    });

    // --- 2.2. State های فرم ---
    const [rightData, setRightData] = useState<EarData>(createEmptyEarData());
    const [leftData, setLeftData] = useState<EarData>(createEmptyEarData());
    const [activeInputType, setActiveInputType] = useState<'air' | 'bone'>('air');
    const [activeMasked, setActiveMasked] = useState<boolean>(false);
    const [notes, setNotes] = useState<string>('');
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [reportText, setReportText] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

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

    const [tymp, setTymp] = useState({ type_right: '', type_left: '' });
    const [otoscopy, setOtoscopy] = useState({
        right: { normal: false, perforation: false, canal_redness: false, impacted_cerumen: false },
        left: { normal: false, perforation: false, canal_redness: false, impacted_cerumen: false },
    });

    // --- 2.3. پر کردن فرم با داده‌های واکشی شده ---
    useEffect(() => {
        if (test?.audiogram_data) {
            const d = test.audiogram_data as AudiogramTestData;
            setRightData(d.audiogram?.right_ear || createEmptyEarData());
            setLeftData(d.audiogram?.left_ear || createEmptyEarData());
            setSpeech({
                srt_right: d.speech_audiometry?.srt_right ?? '',
                srt_left: d.speech_audiometry?.srt_left ?? '',
                wrs_right: d.speech_audiometry?.wrs_right ?? '',
                wrs_left: d.speech_audiometry?.wrs_left ?? '',
            });
            setTymp({
                type_right: d.tympanometry?.type_right || '',
                type_left: d.tympanometry?.type_left || '',
            });
            setOtoscopy({
                right: d.otoscopy?.right || { normal: false, perforation: false, canal_redness: false, impacted_cerumen: false },
                left: d.otoscopy?.left || { normal: false, perforation: false, canal_redness: false, impacted_cerumen: false },
            });
            setSymptoms({
                noise_exposure: d.symptoms?.noise_exposure || false,
                background_noise_difficulty: d.symptoms?.background_noise_difficulty || false,
                hyperacusis: d.symptoms?.hyperacusis || false,
                vertigo_balance: d.symptoms?.vertigo_balance || false,
                otalgia: d.symptoms?.otalgia || false,
                otorrhea: d.symptoms?.otorrhea || false,
                sudden_fluctuating_loss: d.symptoms?.sudden_fluctuating_loss || false,
                history_ear_infections_surgeries: d.symptoms?.history_ear_infections_surgeries || false,
                aural_fullness: d.symptoms?.aural_fullness || false,
                tinnitus: d.symptoms?.tinnitus?.present || false,
                tinnitus_location: d.symptoms?.tinnitus?.location || '',
            });
            setNotes(d.clinical_notes || '');
        }
    }, [test]);

    // --- 2.4. Mutation برای ذخیره ---
    const mutation = useMutation({
        mutationFn: (testData: AudiogramTestData) => updateHearingTest(testId, testData),
        onSuccess: () => {
            toast.success('تغییرات با موفقیت ذخیره شد.');
            queryClient.invalidateQueries({ queryKey: ['hearing_test', testId] });
            queryClient.invalidateQueries({ queryKey: ['hearing_tests'] });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

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

    const handleSubmit = () => {
        const testData: AudiogramTestData = {
            audiogram: { right_ear: rightData, left_ear: leftData },
            speech_audiometry: {
                srt_right: speech.srt_right === '' ? null : Number(speech.srt_right),
                srt_left: speech.srt_left === '' ? null : Number(speech.srt_left),
                wrs_right: speech.wrs_right === '' ? null : Number(speech.wrs_right),
                wrs_left: speech.wrs_left === '' ? null : Number(speech.wrs_left),
            },
            tympanometry: { type_right: tymp.type_right || null, type_left: tymp.type_left || null },
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

    const handleGenerateReport = async () => {
        setIsGenerating(true);
        setReportText(null);
        try {
            const response = await fetch(`/api/audiograms/${testId}/report`, {
                method: 'POST',
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setReportText(data.report);
            setIsReportOpen(true);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    // --- 2.5. رندر حالت‌های بارگذاری / خطا ---
    if (isLoadingTest) return <div className="p-8 text-center">در حال بارگذاری...</div>;
    if (testError || !test) return <div className="p-8 text-center text-red-500">تست یافت نشد.</div>;

    // --- 2.6. رندر اصلی ---
    return (
        <div className="container mx-auto p-6 space-y-6 max-w-6xl text-foreground">
            {/* هدر */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">جزئیات تست شنوایی</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        بیمار: {test.patients?.first_name} {test.patients?.last_name}
                        {test.patients?.national_code ? ` (${test.patients.national_code})` : ''}
                        {test.patients?.birth_date ? ` - ${calculateAge(test.patients.birth_date)} ساله` : ''}
                    </p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>بازگشت</Button>
            </div>

            {/* علائم */}
            <Card>
                <CardHeader><CardTitle>چک‌لیست علائم</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                onCheckedChange={(c) => setSymptoms((prev) => ({ ...prev, [s.key]: !!c }))}
                            />
                            <Label htmlFor={s.key}>{s.label}</Label>
                        </div>
                    ))}
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
                                            onChange={() => setSymptoms((prev) => ({ ...prev, tinnitus_location: loc as any }))}
                                        />
                                        <span>{loc === 'left' ? 'چپ' : loc === 'right' ? 'راست' : 'هر دو'}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* نمودارها */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
                    <CardTitle>ادیوگرام (Pure Tone)</CardTitle>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex rounded-md border p-0.5 bg-slate-50">
                            <Button size="sm" variant={activeInputType === 'air' ? 'default' : 'ghost'} onClick={() => setActiveInputType('air')}>Air</Button>
                            <Button size="sm" variant={activeInputType === 'bone' ? 'default' : 'ghost'} onClick={() => setActiveInputType('bone')}>Bone</Button>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="masked" checked={activeMasked} onCheckedChange={(c) => setActiveMasked(!!c)} />
                            <Label htmlFor="masked">Masked</Label>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

            {/* گفتار، اتوسکوپی و تیمپانومتری */}
            <Card>
                <CardHeader><CardTitle>گفتار، اتوسکوپی و تیمپانومتری</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* گوش راست */}
                    <div className="border-r-4 border-red-500 pr-4 space-y-4">
                        <h3 className="text-red-500 font-semibold">گوش راست</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <div><Label>SRT (dB)</Label><Input type="number" value={speech.srt_right} onChange={(e) => setSpeech((prev) => ({ ...prev, srt_right: e.target.value === '' ? '' : Number(e.target.value) }))} /></div>
                            <div><Label>WRS (%)</Label><Input type="number" value={speech.wrs_right} onChange={(e) => setSpeech((prev) => ({ ...prev, wrs_right: e.target.value === '' ? '' : Number(e.target.value) }))} /></div>
                        </div>
                        <div>
                            <Label>اتوسکوپی</Label>
                            <div className="flex flex-wrap gap-3 mt-1">
                                {(['normal', 'perforation', 'canal_redness', 'impacted_cerumen'] as const).map((opt) => (
                                    <label key={opt} className="flex items-center gap-1 text-sm">
                                        <Checkbox checked={otoscopy.right[opt]} onCheckedChange={(c) => setOtoscopy((prev) => ({ ...prev, right: { ...prev.right, [opt]: !!c } }))} />
                                        {opt === 'normal' ? 'نرمال' : opt === 'perforation' ? 'پرفوراسیون' : opt === 'canal_redness' ? 'قرمزی کانال' : 'جرم گوش'}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label>تیمپانومتری</Label>
                            <Select value={tymp.type_right} onValueChange={(v) => setTymp((prev) => ({ ...prev, type_right: v }))}>
                                <SelectTrigger><SelectValue placeholder="نوع" /></SelectTrigger>
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
                            <div><Label>SRT (dB)</Label><Input type="number" value={speech.srt_left} onChange={(e) => setSpeech((prev) => ({ ...prev, srt_left: e.target.value === '' ? '' : Number(e.target.value) }))} /></div>
                            <div><Label>WRS (%)</Label><Input type="number" value={speech.wrs_left} onChange={(e) => setSpeech((prev) => ({ ...prev, wrs_left: e.target.value === '' ? '' : Number(e.target.value) }))} /></div>
                        </div>
                        <div>
                            <Label>اتوسکوپی</Label>
                            <div className="flex flex-wrap gap-3 mt-1">
                                {(['normal', 'perforation', 'canal_redness', 'impacted_cerumen'] as const).map((opt) => (
                                    <label key={opt} className="flex items-center gap-1 text-sm">
                                        <Checkbox checked={otoscopy.left[opt]} onCheckedChange={(c) => setOtoscopy((prev) => ({ ...prev, left: { ...prev.left, [opt]: !!c } }))} />
                                        {opt === 'normal' ? 'نرمال' : opt === 'perforation' ? 'پرفوراسیون' : opt === 'canal_redness' ? 'قرمزی کانال' : 'جرم گوش'}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label>تیمپانومتری</Label>
                            <Select value={tymp.type_left} onValueChange={(v) => setTymp((prev) => ({ ...prev, type_left: v }))}>
                                <SelectTrigger><SelectValue placeholder="نوع" /></SelectTrigger>
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

            {/* یادداشت‌ها */}
            <Card>
                <CardHeader><CardTitle>یادداشت‌های بالینی</CardTitle></CardHeader>
                <CardContent>
                    <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="مشاهدات، تشخیص یا توصیه‌ها..." />
                </CardContent>
            </Card>

            {/* دکمه ذخیره */}
            <div className="flex justify-end gap-3">
                <Button
                    variant="outline"
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                >
                    <FileText className="w-4 h-4 ml-2" />
                    {isGenerating ? 'در حال تولید...' : 'تولید گزارش AI'}
                </Button>
                <Button onClick={handleSubmit} disabled={mutation.isPending} size="lg">
                    {mutation.isPending ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </Button>
            </div>
            <ReportModal
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                reportText={reportText}
                patientName={`${test.patients?.first_name} ${test.patients?.last_name}`}
                testDate={new Date(test.test_date).toLocaleDateString('fa-IR')}
                testData={test.audiogram_data as AudiogramTestData}
                patientAge={calculateAge(test.patients?.birth_date)}
            />
        </div>
    );
}