'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AudiogramChart } from '@/components/audiogram/AudiogramChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EarData, createEmptyEarData } from '@/types/audiogram';
import { toast } from 'sonner';
import {
    Volume2,
    VolumeX,
    Headphones,
    Play,
    RotateCcw,
    Square,
    CheckCircle2,
    Ear,
} from 'lucide-react';

// ترتیب فرکانس‌های تست
const TEST_FREQUENCIES = [1000, 2000, 4000, 8000, 500, 250];
const START_DB = 40;
const MIN_DB = -10;
const MAX_DB = 100;
const TONE_DURATION_MS = 1500;
const NEXT_STEP_DELAY_MS = 350;
const MAX_STEPS_PER_FREQ = 12;
const TOTAL_STEPS = TEST_FREQUENCIES.length * MAX_STEPS_PER_FREQ;

type Answer = { db: number; heard: boolean };
type EarType = 'right' | 'left';
type TestPhase = 'intro' | 'testing' | 'ear-finished' | 'all-finished';

/**
 * تخمین آستانه شنوایی از پاسخ‌های ثبت‌شده.
 */
function estimateThreshold(answers: Answer[]): number | null {
    if (answers.length === 0) return null;

    const sorted = [...answers].sort((a, b) => a.db - b.db);
    const heardAt = sorted.find((a) => a.heard);
    if (!heardAt) return null;

    const missedBelow = sorted.some((a) => !a.heard && a.db < heardAt.db);
    if (!missedBelow) {
        return heardAt.db;
    }

    return heardAt.db;
}

export default function PublicHearingTestPage() {
    const [phase, setPhase] = useState<TestPhase>('intro');
    const [selectedEar, setSelectedEar] = useState<EarType>('right');
    const [hasTestedRight, setHasTestedRight] = useState(false);
    const [hasTestedLeft, setHasTestedLeft] = useState(false);

    const [currentFreqIndex, setCurrentFreqIndex] = useState(0);
    const [currentDb, setCurrentDb] = useState(START_DB);
    const [isPlaying, setIsPlaying] = useState(false);
    const [stepInFreq, setStepInFreq] = useState(0);

    // نتایج جداگانه برای هر گوش
    const [rightEarResults, setRightEarResults] = useState<Record<number, number>>({});
    const [leftEarResults, setLeftEarResults] = useState<Record<number, number>>({});

    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const pannerNodeRef = useRef<StereoPannerNode | null>(null);
    const toneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const actionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMountedRef = useRef(true);
    const isTestRunningRef = useRef(false);
    const currentFreqIndexRef = useRef(0);
    const currentDbRef = useRef(START_DB);
    const isPlayingRef = useRef(false);
    const stepInFreqRef = useRef(0);
    const answersByFreqRef = useRef<Record<number, Answer[]>>({});
    const selectedEarRef = useRef<EarType>('right');

    const clearActionTimer = useCallback(() => {
        if (actionTimerRef.current) {
            clearTimeout(actionTimerRef.current);
            actionTimerRef.current = null;
        }
    }, []);

    const stopTone = useCallback(() => {
        if (toneTimerRef.current) {
            clearTimeout(toneTimerRef.current);
            toneTimerRef.current = null;
        }

        if (oscillatorRef.current) {
            try {
                oscillatorRef.current.stop();
            } catch { }
            oscillatorRef.current.disconnect();
            oscillatorRef.current = null;
        }

        if (gainNodeRef.current) {
            gainNodeRef.current.disconnect();
            gainNodeRef.current = null;
        }

        if (pannerNodeRef.current) {
            pannerNodeRef.current.disconnect();
            pannerNodeRef.current = null;
        }

        isPlayingRef.current = false;
        if (isMountedRef.current) setIsPlaying(false);
    }, []);

    const initAudio = useCallback(async () => {
        if (typeof window === 'undefined') return null;

        const AudioContextClass =
            window.AudioContext ||
            (window as typeof window & { webkitAudioContext?: typeof AudioContext })
                .webkitAudioContext;

        if (!AudioContextClass) {
            toast.error('مرورگر شما از پخش صدای تست پشتیبانی نمی‌کند.');
            return null;
        }

        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new AudioContextClass();
        }

        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        return audioContextRef.current;
    }, []);

    const playTone = useCallback(
        async (freq: number, db: number) => {
            if (!isTestRunningRef.current) return;

            const ctx = await initAudio();
            if (!ctx || !isTestRunningRef.current) return;

            stopTone();

            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            const panner = ctx.createStereoPanner();

            panner.pan.setValueAtTime(selectedEarRef.current === 'left' ? -1 : 1, ctx.currentTime);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

            const gainValue = Math.min(Math.pow(10, (db - 100) / 20), 0.8);
            gain.gain.setValueAtTime(gainValue, ctx.currentTime);

            oscillator.connect(gain);
            gain.connect(panner);
            panner.connect(ctx.destination);

            oscillator.start();

            oscillatorRef.current = oscillator;
            gainNodeRef.current = gain;
            pannerNodeRef.current = panner;

            isPlayingRef.current = true;
            setIsPlaying(true);

            toneTimerRef.current = setTimeout(() => {
                stopTone();
            }, TONE_DURATION_MS);
        },
        [initAudio, stopTone]
    );

    const finishEar = useCallback(() => {
        clearActionTimer();
        stopTone();
        isTestRunningRef.current = false;
        setIsPlaying(false);
        setPhase('ear-finished');
    }, [clearActionTimer, stopTone]);

    const goToNextFrequency = useCallback(
        (completedFrequency: number, threshold: number) => {
            if (selectedEarRef.current === 'right') {
                setRightEarResults((prev) => ({ ...prev, [completedFrequency]: threshold }));
            } else {
                setLeftEarResults((prev) => ({ ...prev, [completedFrequency]: threshold }));
            }

            const nextIndex = currentFreqIndexRef.current + 1;

            if (nextIndex >= TEST_FREQUENCIES.length) {
                if (selectedEarRef.current === 'right') {
                    setHasTestedRight(true);
                } else {
                    setHasTestedLeft(true);
                }
                finishEar();
                return;
            }

            currentFreqIndexRef.current = nextIndex;
            currentDbRef.current = START_DB;
            stepInFreqRef.current = 0;
            setCurrentFreqIndex(nextIndex);
            setCurrentDb(START_DB);
            setStepInFreq(0);

            clearActionTimer();
            actionTimerRef.current = setTimeout(() => {
                if (isTestRunningRef.current) {
                    void playTone(TEST_FREQUENCIES[nextIndex], START_DB);
                }
            }, 600);
        },
        [clearActionTimer, finishEar, playTone]
    );

    const startEarTest = useCallback(async (ear: EarType) => {
        clearActionTimer();
        stopTone();

        setSelectedEar(ear);
        selectedEarRef.current = ear;

        currentFreqIndexRef.current = 0;
        currentDbRef.current = START_DB;
        stepInFreqRef.current = 0;
        answersByFreqRef.current = {};
        isTestRunningRef.current = true;

        setCurrentFreqIndex(0);
        setCurrentDb(START_DB);
        setStepInFreq(0);

        if (ear === 'right') {
            setRightEarResults({});
        } else {
            setLeftEarResults({});
        }

        setPhase('testing');

        const ctx = await initAudio();
        if (!ctx || !isTestRunningRef.current) return;

        await playTone(TEST_FREQUENCIES[0], START_DB);
    }, [clearActionTimer, initAudio, playTone, stopTone]);

    const handleAnswer = useCallback(
        (heard: boolean) => {
            if (!isTestRunningRef.current || isPlayingRef.current) return;

            const frequency = TEST_FREQUENCIES[currentFreqIndexRef.current];
            const dbAtAnswer = currentDbRef.current;

            const newAnswer: Answer = { db: dbAtAnswer, heard };
            const updatedAnswers = [
                ...(answersByFreqRef.current[frequency] ?? []),
                newAnswer,
            ];
            answersByFreqRef.current[frequency] = updatedAnswers;

            const newStep = stepInFreqRef.current + 1;
            stepInFreqRef.current = newStep;
            setStepInFreq(newStep);

            stopTone();

            if (newStep >= MAX_STEPS_PER_FREQ) {
                const threshold = estimateThreshold(updatedAnswers) ?? MAX_DB;
                clearActionTimer();
                actionTimerRef.current = setTimeout(() => {
                    if (isTestRunningRef.current) {
                        goToNextFrequency(frequency, threshold);
                    }
                }, NEXT_STEP_DELAY_MS);
                return;
            }

            const nextDb = heard
                ? Math.max(dbAtAnswer - 10, MIN_DB)
                : Math.min(dbAtAnswer + 5, MAX_DB);

            currentDbRef.current = nextDb;
            setCurrentDb(nextDb);

            clearActionTimer();
            actionTimerRef.current = setTimeout(() => {
                if (isTestRunningRef.current) {
                    void playTone(frequency, nextDb);
                }
            }, NEXT_STEP_DELAY_MS);
        },
        [clearActionTimer, goToNextFrequency, playTone, stopTone]
    );

    const replayTone = useCallback(() => {
        if (!isTestRunningRef.current || isPlayingRef.current) return;
        clearActionTimer();
        void playTone(
            TEST_FREQUENCIES[currentFreqIndexRef.current],
            currentDbRef.current
        );
    }, [clearActionTimer, playTone]);

    const stopTestTone = useCallback(() => {
        clearActionTimer();
        stopTone();
    }, [clearActionTimer, stopTone]);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            isTestRunningRef.current = false;
            clearActionTimer();
            stopTone();

            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                void audioContextRef.current.close();
            }
        };
    }, [clearActionTimer, stopTone]);

    const rightEarData: EarData = createEmptyEarData();
    Object.entries(rightEarResults).forEach(([frequency, db]) => {
        const point = rightEarData[Number(frequency)];
        if (point) point.air.db = db;
    });

    const leftEarData: EarData = createEmptyEarData();
    Object.entries(leftEarResults).forEach(([frequency, db]) => {
        const point = leftEarData[Number(frequency)];
        if (point) point.air.db = db;
    });

    const completedFreqs = selectedEar === 'right'
        ? Object.keys(rightEarResults).length
        : Object.keys(leftEarResults).length;

    const completedSteps = completedFreqs * MAX_STEPS_PER_FREQ + stepInFreq;
    const progress = Math.round((completedSteps / TOTAL_STEPS) * 100);

    const handleEarFinished = (startNextEar: boolean) => {
        if (startNextEar) {
            const nextEar = selectedEar === 'right' ? 'left' : 'right';
            void startEarTest(nextEar);
        } else {
            setPhase('all-finished');
            toast.success('تست به پایان رسید!');
        }
    };

    const restartAll = () => {
        setRightEarResults({});
        setLeftEarResults({});
        setHasTestedRight(false);
        setHasTestedLeft(false);
        setPhase('intro');
    };

    return (
        <div className="container mx-auto max-w-4xl space-y-4 p-4 sm:space-y-6 sm:p-6" dir="rtl">
            <div className="space-y-1.5 text-center sm:space-y-2">
                <h1 className="text-2xl font-bold sm:text-3xl">تست شنوایی آنلاین</h1>
                <p className="text-sm text-muted-foreground sm:text-base">
                    با استفاده از هدفون، شنوایی خود را در چند دقیقه بسنجید.
                </p>
            </div>

            {phase === 'intro' && (
                <Card className="border-blue-200 bg-blue-50/50">
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="flex items-center gap-2 text-base text-blue-700 sm:text-lg">
                            <Headphones className="h-5 w-5 shrink-0" />
                            راهنمای تست
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4 pt-0 text-xs text-blue-900 sm:space-y-4 sm:p-6 sm:pt-0 sm:text-sm">
                        <div className="space-y-1.5 leading-relaxed sm:space-y-2">
                            <p>۱. هدفون را به گوش بزنید و در محیطی ساکت قرار بگیرید.</p>
                            <p>۲. صدای سیستم را در سطحی راحت تنظیم کنید.</p>
                            <p>۳. هر بار صدا را شنیدید، پس از پایان پخش «شنیدم» را بزنید.</p>
                            <p>۴. اگر صدا را نشنیدید، «نشنیدم» را بزنید تا سطح صدا افزایش یابد.</p>
                            <p>۵. هر فرکانس حداکثر ۱۲ پاسخ دارد و سپس به‌طور خودکار به فرکانس بعدی می‌رود.</p>
                            <p className="pt-2 font-bold text-red-600">
                                ⚠️ لطفاً قبل از شروع، از قرارگیری صحیح هدفون در گوش اطمینان حاصل کنید. در طول تست، صدا فقط در گوش انتخاب‌شده پخش می‌شود.
                            </p>
                        </div>
                        <p className="font-semibold text-red-600">
                            ⚠️ این تست آنلاین کالیبره‌شده نیست و جایگزین ادیومتری بالینی نمی‌شود.
                        </p>

                        <div className="grid grid-cols-1 gap-2.5 pt-2 sm:grid-cols-2 sm:gap-3">
                            <Button
                                onClick={() => startEarTest('right')}
                                className="w-full bg-red-600 py-5 text-sm hover:bg-red-700 sm:py-6 sm:text-base"
                                size="lg"
                            >
                                <Ear className="ml-2 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                                شروع تست گوش راست
                            </Button>
                            <Button
                                onClick={() => startEarTest('left')}
                                className="w-full bg-blue-600 py-5 text-sm hover:bg-blue-700 sm:py-6 sm:text-base"
                                size="lg"
                            >
                                <Ear className="ml-2 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                                شروع تست گوش چپ
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {phase === 'testing' && (
                <Card className="border-slate-200">
                    <CardHeader className="p-4 sm:p-6">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle
                                className={`flex items-center gap-2 text-sm sm:text-base ${
                                    selectedEar === 'right' ? 'text-red-600' : 'text-blue-600'
                                }`}
                            >
                                <Ear className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                                گوش {selectedEar === 'right' ? 'راست' : 'چپ'} - فرکانس {TEST_FREQUENCIES[currentFreqIndex]} هرتز
                            </CardTitle>
                            <span className="text-xs text-slate-500 sm:text-sm">
                                {completedSteps} از {TOTAL_STEPS} مرحله
                            </span>
                        </div>
                        <div
                            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={progress}
                        >
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    selectedEar === 'right' ? 'bg-red-600' : 'bg-blue-600'
                                }`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="mt-1 text-left text-[11px] text-slate-500 sm:text-xs">
                            {progress}% تکمیل شده
                        </p>
                    </CardHeader>

                    <CardContent className="flex flex-col items-center space-y-4 px-4 py-6 sm:space-y-6 sm:p-6 sm:py-8">
                        <div className="flex items-center justify-center gap-3 sm:gap-4">
                            {isPlaying ? (
                                <div
                                    className={`flex animate-pulse items-center gap-2 ${
                                        selectedEar === 'right' ? 'text-red-600' : 'text-blue-600'
                                    }`}
                                >
                                    <Volume2 className="h-6 w-6 shrink-0 sm:h-8 sm:w-8" />
                                    <span className="text-sm font-semibold sm:text-lg">
                                        در حال پخش صدا در گوش {selectedEar === 'right' ? 'راست' : 'چپ'}...
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-center text-slate-500">
                                    <VolumeX className="h-6 w-6 shrink-0 sm:h-8 sm:w-8" />
                                    <span className="text-xs sm:text-base">
                                        صدا متوقف است؛ پاسخ دهید یا دوباره پخش کنید
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="text-center">
                            <span className="text-3xl font-bold text-slate-800 sm:text-4xl">{currentDb}</span>
                            <span className="mr-2 text-xs text-slate-500 sm:text-sm">dB (سطح نسبی)</span>
                        </div>

                        <div className="flex w-full max-w-md flex-col gap-2.5 sm:gap-3">
                            <Button
                                onClick={() => handleAnswer(true)}
                                className="bg-green-600 py-5 text-base text-white hover:bg-green-700 sm:py-6 sm:text-lg"
                                disabled={isPlaying}
                            >
                                شنیدم
                            </Button>
                            <Button
                                onClick={() => handleAnswer(false)}
                                variant="outline"
                                className="border-red-300 py-5 text-base text-red-600 hover:bg-red-50 sm:py-6 sm:text-lg"
                                disabled={isPlaying}
                            >
                                نشنیدم
                            </Button>
                        </div>

                        <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
                            <Button
                                onClick={replayTone}
                                variant="secondary"
                                className="flex-1 text-xs sm:text-sm"
                                disabled={isPlaying}
                            >
                                <RotateCcw className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                پخش دوباره صدا
                            </Button>
                            <Button
                                onClick={stopTestTone}
                                variant="ghost"
                                className="flex-1 text-xs text-slate-500 sm:text-sm"
                                disabled={!isPlaying}
                            >
                                <Square className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                توقف صدا
                            </Button>
                        </div>

                        <div className="text-center text-[11px] text-slate-400 sm:text-xs">
                            مرحله {stepInFreq} از {MAX_STEPS_PER_FREQ} در این فرکانس | فرکانس{' '}
                            {currentFreqIndex + 1} از {TEST_FREQUENCIES.length}
                        </div>
                    </CardContent>
                </Card>
            )}

            {phase === 'ear-finished' && (
                <Card className="border-green-200 bg-green-50/30">
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="flex items-center justify-center gap-2 text-center text-base text-green-700 sm:text-lg">
                            <CheckCircle2 className="h-5 w-5 shrink-0" />
                            تست گوش {selectedEar === 'right' ? 'راست' : 'چپ'} به پایان رسید
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 text-center sm:p-6">
                        <p className="text-xs text-slate-600 sm:text-sm">
                            {selectedEar === 'right'
                                ? 'آیا می‌خواهید تست گوش چپ را نیز انجام دهید؟'
                                : 'آیا می‌خواهید تست گوش راست را نیز انجام دهید؟'}
                        </p>
                        <div className="flex flex-col justify-center gap-2 sm:flex-row sm:gap-3">
                            <Button
                                onClick={() => handleEarFinished(true)}
                                variant="default"
                                className="w-full text-sm sm:w-auto"
                            >
                                بله، تست گوش {selectedEar === 'right' ? 'چپ' : 'راست'}
                            </Button>
                            <Button
                                onClick={() => handleEarFinished(false)}
                                variant="outline"
                                className="w-full text-sm sm:w-auto"
                            >
                                خیر، مشاهده نتیجه نهایی
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {phase === 'all-finished' && (
                <Card className="border-green-200 bg-green-50/30">
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="flex items-center justify-center gap-2 text-center text-base text-green-700 sm:text-lg">
                            <CheckCircle2 className="h-5 w-5 shrink-0" />
                            تست به پایان رسید
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 p-4 sm:space-y-6 sm:p-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                            {hasTestedRight && (
                                <div className="space-y-2">
                                    <h3 className="text-center text-sm font-semibold text-red-600 sm:text-base">
                                        گوش راست
                                    </h3>
                                    {/* برای جلوگیری از سرریز نمودار در موبایل، overflow-x-auto اضافه شد */}
                                    <div className="overflow-x-auto rounded-lg border p-1 sm:p-2">
                                        <AudiogramChart
                                            isRight={true}
                                            data={rightEarData}
                                            onPointChange={() => {}}
                                            activeInputType="air"
                                        />
                                    </div>
                                </div>
                            )}

                            {hasTestedLeft && (
                                <div className="space-y-2">
                                    <h3 className="text-center text-sm font-semibold text-blue-600 sm:text-base">
                                        گوش چپ
                                    </h3>
                                    <div className="overflow-x-auto rounded-lg border p-1 sm:p-2">
                                        <AudiogramChart
                                            isRight={false}
                                            data={leftEarData}
                                            onPointChange={() => {}}
                                            activeInputType="air"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="text-center text-xs text-slate-600 sm:text-sm">
                            <p>آستانه‌های تخمینی در فرکانس‌های مختلف در نمودارهای بالا نمایش داده شده‌اند.</p>
                            <p className="mt-2 text-[11px] text-muted-foreground sm:text-xs">
                                این تست صرفاً غربالگری غیرتشخیصی است. برای ارزیابی دقیق به متخصص شنوایی‌سنجی مراجعه کنید.
                            </p>
                        </div>

                        <div className="no-print flex flex-col justify-center gap-2 pt-2 sm:flex-row sm:gap-3 sm:pt-4">
                            <Button
                                onClick={() => window.print()}
                                variant="default"
                                className="w-full text-sm sm:w-auto"
                            >
                                چاپ / دانلود گزارش
                            </Button>
                            <Button
                                onClick={restartAll}
                                variant="outline"
                                className="w-full text-sm sm:w-auto"
                            >
                                تست مجدد
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}