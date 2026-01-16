'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push('/search?q=' + encodeURIComponent(searchQuery.trim()));1
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold mb-4">Set-Clip</h1>
                    <p className="text-xl text-gray-400 mb-8">
                        Find and purchase your comedy set recordings
                    </p>
                </div>

                <div className="max-w-2xl mx-auto">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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

                <div className="mt-24 grid md:grid-cols-3 gap-8 text-center">
                    <div className="p-6">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl font-bold">1</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Search</h3>
                        <p className="text-gray-400">Find your sets by searching your name</p>
                    </div>
                    <div className="p-6">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl font-bold">2</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Preview</h3>
                        <p className="text-gray-400">Watch a preview to confirm its your set</p>
                    </div>
                    <div className="p-6">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl font-bold">3</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Download</h3>
                        <p className="text-gray-400">Purchase and download your clip instantly</p>
                    </div>
                </div>

                <footer className="mt-24 text-center text-gray-500 text-sm">
                    <p>Comedy Corner Underground</p>
                </footer>
            </div>
        </main>
    );
}
