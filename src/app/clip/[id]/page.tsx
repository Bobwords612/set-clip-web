'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, Clip, Show, Venue } from '@/lib/supabase';

interface ClipDetail extends Clip {
    show: Show & { venue: Venue };
}

function formatDuration(seconds: number | null): string {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}

export default function ClipPage() {
    const params = useParams();
    const clipId = params.id as string;
    const [clip, setClip] = useState<ClipDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        async function fetchClip() {
            const { data, error } = await supabase
                .from('clips')
                .select(`
                    *,
                    show:shows (
                        *,
                        venue:venues (*)
                    )
                `)
                .eq('id', clipId)
                .single();

            if (error) {
                console.error('Error fetching clip:', error);
            } else {
                setClip(data as ClipDetail);
            }
            setLoading(false);
        }

        if (clipId) {
            fetchClip();
        }
    }, [clipId]);

    const handlePurchase = async () => {
        setPurchasing(true);
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clipId }),
            });

            const { url, error } = await response.json();

            if (error) {
                alert('Error creating checkout: ' + error);
                return;
            }

            // Redirect to Stripe Checkout
            window.location.href = url;
        } catch (err) {
            console.error('Checkout error:', err);
            alert('Failed to start checkout. Please try again.');
        } finally {
            setPurchasing(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-400">Loading...</p>
                    </div>
                </div>
            </main>
        );
    }

    if (!clip) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-12">
                        <h1 className="text-2xl font-bold mb-4">Clip Not Found</h1>
                        <Link href="/" className="text-blue-400 hover:underline">
                            Back to search
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="text-2xl font-bold hover:text-blue-400 transition-colors">
                        Set-Clip
                    </Link>
                </div>

                {/* Back link */}
                <Link href="/search" className="text-blue-400 hover:underline mb-6 inline-block">
                    &larr; Back to search
                </Link>

                <div className="max-w-4xl mx-auto">
                    {/* Video Preview */}
                    <div className="bg-gray-800 rounded-lg overflow-hidden mb-8">
                        {clip.preview_path ? (
                            <video
                                className="w-full aspect-video"
                                controls
                                poster="/video-placeholder.png"
                            >
                                <source src={clip.preview_path} type="video/mp4" />
                                Your browser does not support video playback.
                            </video>
                        ) : (
                            <div className="w-full aspect-video bg-gray-700 flex items-center justify-center">
                                <p className="text-gray-400">Preview not available</p>
                            </div>
                        )}
                    </div>

                    {/* Clip Info */}
                    <div className="bg-gray-800 rounded-lg p-8">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold mb-2">{clip.performer_name}</h1>
                                <p className="text-xl text-gray-400 mb-4">
                                    {clip.show.venue.name}
                                </p>
                                <div className="space-y-2 text-gray-400">
                                    <p>{formatDate(clip.show.show_date)}</p>
                                    {clip.show.show_name && <p>{clip.show.show_name}</p>}
                                    <p>Set #{clip.set_number} &bull; {formatDuration(clip.duration_seconds)}</p>
                                </div>
                            </div>

                            <div className="text-center md:text-right">
                                <p className="text-4xl font-bold text-green-400 mb-4">
                                    {formatPrice(clip.price_cents)}
                                </p>
                                <button
                                    onClick={handlePurchase}
                                    disabled={purchasing}
                                    className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-full font-medium text-lg transition-colors"
                                >
                                    {purchasing ? 'Processing...' : 'Purchase & Download'}
                                </button>
                            </div>
                        </div>

                        {/* What's Included */}
                        <div className="mt-8 pt-8 border-t border-gray-700">
                            <h3 className="text-lg font-semibold mb-4">What&apos;s Included</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li className="flex items-center gap-2">
                                    <span className="text-green-400">✓</span>
                                    Full quality video clip (MP4)
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-400">✓</span>
                                    Social media version (9:16 vertical with subtitles)
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-400">✓</span>
                                    Subtitle file (SRT)
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-400">✓</span>
                                    Instant download after purchase
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
