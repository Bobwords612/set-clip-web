'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface PurchaseDetails {
    id: string;
    download_token: string;
    download_expires_at: string;
    max_downloads: number;
    clip: {
        performer_name: string;
        original_path: string | null;
        social_subtitled_path: string | null;
        srt_path: string | null;
    };
}

function SuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [purchase, setPurchase] = useState<PurchaseDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPurchase() {
            if (!sessionId) {
                setError('No session ID provided');
                setLoading(false);
                return;
            }

            // Poll for completed purchase (webhook might take a moment)
            let attempts = 0;
            const maxAttempts = 10;

            while (attempts < maxAttempts) {
                const { data, error: fetchError } = await supabase
                    .from('purchases')
                    .select(`
                        id,
                        download_token,
                        download_expires_at,
                        max_downloads,
                        clip:clips (
                            performer_name,
                            original_path,
                            social_subtitled_path,
                            srt_path
                        )
                    `)
                    .eq('stripe_checkout_session_id', sessionId)
                    .eq('status', 'completed')
                    .single();

                if (data && data.download_token) {
                    setPurchase(data as unknown as PurchaseDetails);
                    setLoading(false);
                    return;
                }

                if (fetchError && fetchError.code !== 'PGRST116') {
                    console.error('Error fetching purchase:', fetchError);
                }

                attempts++;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            setError('Purchase is being processed. Please refresh in a moment.');
            setLoading(false);
        }

        fetchPurchase();
    }, [sessionId]);

    const formatExpiry = (dateStr: string) => {
        return new Date(dateStr).toLocaleString();
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto"></div>
                        <p className="mt-6 text-xl text-gray-400">Processing your purchase...</p>
                    </div>
                </div>
            </main>
        );
    }

    if (error || !purchase) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-lg mx-auto text-center">
                        <h1 className="text-3xl font-bold mb-4">Processing...</h1>
                        <p className="text-gray-400 mb-8">{error || 'Unable to load purchase details'}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-medium"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-2xl mx-auto">
                    {/* Success Header */}
                    <div className="text-center mb-12">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold mb-4">Purchase Complete!</h1>
                        <p className="text-xl text-gray-400">
                            Thank you for your purchase, {purchase.clip.performer_name}!
                        </p>
                    </div>

                    {/* Download Links */}
                    <div className="bg-gray-800 rounded-lg p-8 mb-8">
                        <h2 className="text-2xl font-semibold mb-6">Your Downloads</h2>

                        <div className="space-y-4">
                            {purchase.clip.social_subtitled_path && (
                                <a
                                    href={`${baseUrl}/api/download/${purchase.download_token}?type=social_subtitled`}
                                    className="flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    <div>
                                        <p className="font-medium">Social Media Version</p>
                                        <p className="text-sm text-gray-400">9:16 vertical with subtitles</p>
                                    </div>
                                    <span className="text-blue-400">Download →</span>
                                </a>
                            )}

                            {purchase.clip.original_path && (
                                <a
                                    href={`${baseUrl}/api/download/${purchase.download_token}?type=original`}
                                    className="flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    <div>
                                        <p className="font-medium">Full Quality Original</p>
                                        <p className="text-sm text-gray-400">Original aspect ratio</p>
                                    </div>
                                    <span className="text-blue-400">Download →</span>
                                </a>
                            )}

                            {purchase.clip.srt_path && (
                                <a
                                    href={`${baseUrl}/api/download/${purchase.download_token}?type=srt`}
                                    className="flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    <div>
                                        <p className="font-medium">Subtitle File</p>
                                        <p className="text-sm text-gray-400">SRT format</p>
                                    </div>
                                    <span className="text-blue-400">Download →</span>
                                </a>
                            )}
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-700 text-sm text-gray-400">
                            <p>Downloads available: {purchase.max_downloads}</p>
                            <p>Link expires: {formatExpiry(purchase.download_expires_at)}</p>
                        </div>
                    </div>

                    {/* Back to Search */}
                    <div className="text-center">
                        <Link
                            href="/"
                            className="text-blue-400 hover:underline"
                        >
                            ← Search for more clips
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto"></div>
                        <p className="mt-6 text-xl text-gray-400">Loading...</p>
                    </div>
                </div>
            </main>
        }>
            <SuccessContent />
        </Suspense>
    );
}
