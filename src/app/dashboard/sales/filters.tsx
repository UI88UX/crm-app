// src/app/dashboard/sales/filters.tsx
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, X, Calendar as CalendarIcon, Filter } from "lucide-react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatJalaliDateIntl } from "@/lib/util/jalaliDate";

// ============================================
// Types
// ============================================

interface SalesFiltersProps {
    totalCount?: number;
    isLoading?: boolean;
}

type QuickRange = "today" | "yesterday" | "last7" | "last30" | "custom" | null;

// ============================================
// Helpers
// ============================================

const getGregorianDateOnly = (dateObj: any): string => {
    const date = dateObj.toDate();
    const gregorianYear = date.getFullYear();
    const gregorianMonth = date.getMonth() + 1;
    const gregorianDay = date.getDate();
    return `${gregorianYear}-${String(gregorianMonth).padStart(2, "0")}-${String(gregorianDay).padStart(2, "0")}`;
};

const getTodayGregorian = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const getYesterdayGregorian = (): string => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
};

function getRangeForQuickRange(range: Exclude<QuickRange, "custom" | null>): { from: string; to: string } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (range) {
        case "today":
            return { from: getTodayGregorian(), to: getTodayGregorian() };
        case "yesterday": {
            const y = getYesterdayGregorian();
            return { from: y, to: y };
        }
        case "last7": {
            const from = new Date(today);
            from.setDate(from.getDate() - 6);
            const fromStr = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`;
            return { from: fromStr, to: getTodayGregorian() };
        }
        case "last30": {
            const from = new Date(today);
            from.setDate(from.getDate() - 29);
            const fromStr = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`;
            return { from: fromStr, to: getTodayGregorian() };
        }
    }
}

function humanizeRange(fromIso: string, toIso: string): string {
    if (!fromIso || !toIso) return "";
    const fromJalali = formatJalaliDateIntl(`${fromIso}T12:00:00`, "long");
    const toJalali = formatJalaliDateIntl(`${toIso}T12:00:00`, "long");

    if (!fromJalali) return "";
    if (fromIso === toIso) return fromJalali;
    return `${fromJalali} تا ${toJalali}`;
}

// ============================================
// Component
// ============================================

export function SalesFilters({ totalCount, isLoading }: SalesFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const lastSearchWeSetRef = useRef<string | null>(null);

    const urlSearch = searchParams.get("search") || "";
    const urlFrom = searchParams.get("from") || "";
    const urlTo = searchParams.get("to") || "";


    const [localSearch, setLocalSearch] = useState(urlSearch);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(
        !!(urlFrom || urlTo)
    );

    useEffect(() => {
        if (lastSearchWeSetRef.current === urlSearch || lastSearchWeSetRef.current === (urlSearch || null)) {
        lastSearchWeSetRef.current = null;  
        return;
        }
        setLocalSearch(urlSearch);
    }, [urlSearch]);

    const activeQuickRange: QuickRange = useMemo(() => {
        if (!urlFrom || !urlTo) return null;

        const ranges: Array<{ key: Exclude<QuickRange, "custom" | null>; from: string; to: string }> = [
            { key: "today", ...getRangeForQuickRange("today") },
            { key: "yesterday", ...getRangeForQuickRange("yesterday") },
            { key: "last7", ...getRangeForQuickRange("last7") },
            { key: "last30", ...getRangeForQuickRange("last30") },
        ];

        for (const r of ranges) {
            if (urlFrom === r.from && urlTo === r.to) return r.key;
        }

        return "custom";
    }, [urlFrom, urlTo]);

    const updateUrl = useCallback(
        (updates: Record<string, string | null>) => {
            // 🆕 اگه داشتیم search رو عوض می‌کردیم، یادمون بمونه
            if ("search" in updates) {
                lastSearchWeSetRef.current = updates.search;
            }

            const params = new URLSearchParams(searchParams.toString());

            Object.entries(updates).forEach(([key, value]) => {
                if (value === null || value === "") {
                    params.delete(key);
                } else {
                    params.set(key, value);
                }
            });

            if (Object.keys(updates).some((k) => k !== "page")) {
                params.delete("page");
            }

            const qs = params.toString();
            router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
        },
        [pathname, router, searchParams]
    );

    useEffect(() => {
        if (localSearch === urlSearch) return;
        const timer = setTimeout(() => {
            updateUrl({ search: localSearch || null });
        }, 900);
        return () => clearTimeout(timer);
    }, [localSearch, urlSearch, updateUrl]);

    const handleQuickRange = useCallback(
        (range: Exclude<QuickRange, "custom" | null>) => {
            const { from, to } = getRangeForQuickRange(range);
            updateUrl({ from, to });
        },
        [updateUrl]
    );

    const handleCustomDateChange = useCallback(
        (dates: any) => {
            if (!dates || dates.length === 0) {
                updateUrl({ from: null, to: null });
                return;
            }

            if (dates.length === 1) {
                const d = getGregorianDateOnly(dates[0]);
                updateUrl({ from: d, to: d });
                return;
            }

            const from = getGregorianDateOnly(dates[0]);
            const to = getGregorianDateOnly(dates[1]);
            updateUrl({ from, to });
        },
        [updateUrl]
    );

    const clearAllFilters = useCallback(() => {
        setLocalSearch("");
        router.replace(pathname, { scroll: false });
    }, [pathname, router]);

    const activeFilterCount = [urlSearch, urlFrom || urlTo].filter(Boolean).length;

    const datePickerValues = useMemo(() => {
        const values: Date[] = [];
        if (urlFrom) {
            try { values.push(new Date(`${urlFrom}T12:00:00`)); } catch { }
        }
        if (urlTo && urlTo !== urlFrom) {
            try { values.push(new Date(`${urlTo}T12:00:00`)); } catch { }
        }
        return values;
    }, [urlFrom, urlTo]);

    const humanizedRange = useMemo(() => humanizeRange(urlFrom, urlTo), [urlFrom, urlTo]);

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="جستجوی بیمار، مدل سمعک یا سریال..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="pr-10"
                    />
                    {localSearch && (
                        <button
                            type="button"
                            onClick={() => setLocalSearch("")}
                            className="absolute left-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAdvancedFilters((v) => !v)}
                    className="gap-2 sm:hidden"
                >
                    <Filter className="h-4 w-4" />
                    فیلترها
                    {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="mr-1 h-5 px-1.5 text-xs">
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
            </div>

            <div className={`space-y-3 ${showAdvancedFilters ? "block" : "hidden sm:block"}`}>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">بازه تاریخ:</span>
                    <Button
                        type="button"
                        size="sm"
                        variant={activeQuickRange === "today" ? "default" : "outline"}
                        onClick={() => handleQuickRange("today")}
                    >
                        امروز
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={activeQuickRange === "yesterday" ? "default" : "outline"}
                        onClick={() => handleQuickRange("yesterday")}
                    >
                        دیروز
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={activeQuickRange === "last7" ? "default" : "outline"}
                        onClick={() => handleQuickRange("last7")}
                    >
                        ۷ روز اخیر
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={activeQuickRange === "last30" ? "default" : "outline"}
                        onClick={() => handleQuickRange("last30")}
                    >
                        ۳۰ روز اخیر
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            بازه سفارشی
                        </label>
                        <DatePicker
                            calendar={persian}
                            locale={persian_fa}
                            value={datePickerValues}
                            onChange={handleCustomDateChange}
                            range
                            format="YYYY/MM/DD"
                            placeholder="انتخاب بازه تاریخ"
                            inputClass="w-full h-9 px-3 border rounded-md bg-background hover:border-primary/50 transition-colors focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm"
                            containerClassName="w-full"
                            calendarPosition="bottom-right"
                        />
                        {humanizedRange && (
                            <p className="text-[11px] text-muted-foreground">
                                نمایش: {humanizedRange}
                            </p>
                        )}
                    </div>

                    <div className="flex items-end justify-between gap-2">
                        {activeFilterCount > 0 && (
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={clearAllFilters}
                                className="gap-1 text-xs text-muted-foreground hover:text-destructive"
                            >
                                <X className="h-3.5 w-3.5" />
                                پاک کردن فیلترها
                            </Button>
                        )}
                    </div>
                </div>

                {!isLoading && typeof totalCount === "number" && (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                            {totalCount.toLocaleString("fa-IR")} نتیجه
                        </span>
                        {activeFilterCount > 0 && (
                            <>
                                <span className="text-muted-foreground/50">•</span>
                                <span>{activeFilterCount} فیلتر فعال</span>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}