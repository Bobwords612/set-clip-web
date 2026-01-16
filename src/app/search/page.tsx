'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { supabase, ClipSearchResult } from '@/lib/supabase';

function formatDuration(seconds: number | null): string {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState<ClipSearchResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState(query);

    useEffect(() => {
        async function search() {
            if (!query) {
                setResults([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9\s]/g, '');

            const { data, error } = await supabase
                .from('clip_search')
                .select('*')
                .ilike('search_name', `%${normalizedQuery}%`)
                .order('show_date', { ascending: false });

            if (error) {
                console.error('Search error:', error);
                setResults([]);
            } else {
                setResults(data || []);
            }
            setLoading(false);
        }

        search();
    }, [query]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInput.trim()) {
            window.location.href = `/search?q=${encodeURIComponent(searchInput.trim())}`;
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="text-2xl font-bold hover:text-blue-400 transition-colors">
                        Set-Clip
                    </Link>
                </div>

                {/* Search Box */}
                <div className="max-w-2xl mx-auto mb-12">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by performer name..."
                            className="w-full px-6 py-4 text-lg bg-gray-800 border border-gray-700 rounded-full focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-full font-medium transition-colors"
                        >
                            Search
                        </button>
                    </form>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-400">Searching...</p>
                    </div>
                ) : query && results.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-xl text-gray-400">No clips found for &quot;{query}&quot;</p>
                        <p className="mt-2 text-gray-500">Try a different spelling or check back later</p>
                    </div>
                ) : query ? (
                    <div>
                        <p className="text-gray-400 mb-6">
                            Found {results.length} clip{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
                        </p>
                        <div className="grid gap-4">
                            {results.map((clip) => (
                                <div
                                    key={clip.id}
                                    className="bg-gray-800 rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-gray-750 transition-colors"
                                >
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold">{clip.performer_name}</h3>
                                        <p className="text-gray-400">
                                            {clip.venue_name} &bull; {formatDate(clip.show_date)}
                                            {clip.show_name && ` &bull; ${clip.show_name}`}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Set #{clip.set_number} &bull; {formatDuration(clip.duration_seconds)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl font-bold text-green-400">
                                            {formatPrice(clip.price_cents)}
                                        </span>
                                        <Link
                                            href={`/clip/${clip.id}`}
                                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-full font-medium transition-colors"
                                        >
                                            View
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-xl text-gray-400">Enter a name to search for clips</p>
                    </div>
                )}
            </div>
        </main>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-400">Loading...</p>
                    </div>
                </div>
            </main>
        }>
            <SearchContent />
        </Suspense>
    );
}
