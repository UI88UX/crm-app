// Server Component — بدون 'use client'
import { Suspense } from 'react';
import NewAudiogramPageClient from './page.client';

export default function NewAudiogramPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">در حال بارگذاری...</div>}>
            <NewAudiogramPageClient />
        </Suspense>
    );
}