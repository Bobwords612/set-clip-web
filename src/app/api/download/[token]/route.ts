import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params;
    const url = new URL(request.url);
    const fileType = url.searchParams.get('type') || 'social_subtitled';

    const supabase = createServerClient();

    // Find purchase by download token
    const { data: purchase, error } = await supabase
        .from('purchases')
        .select(`
            *,
            clip:clips (*)
        `)
        .eq('download_token', token)
        .single();

    if (error || !purchase) {
        return NextResponse.json({ error: 'Invalid download link' }, { status: 404 });
    }

    // Check if download link has expired
    if (new Date(purchase.download_expires_at) < new Date()) {
        return NextResponse.json({ error: 'Download link has expired' }, { status: 410 });
    }

    // Check download count
    if (purchase.download_count >= purchase.max_downloads) {
        return NextResponse.json({ error: 'Maximum downloads reached' }, { status: 403 });
    }

    const clip = purchase.clip;
    if (!clip) {
        return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    // Get the appropriate file path
    let filePath: string | null = null;
    switch (fileType) {
        case 'original':
            filePath = clip.original_path;
            break;
        case 'social':
            filePath = clip.social_path;
            break;
        case 'social_subtitled':
            filePath = clip.social_subtitled_path;
            break;
        case 'srt':
            filePath = clip.srt_path;
            break;
        default:
            filePath = clip.social_subtitled_path;
    }

    if (!filePath) {
        return NextResponse.json({ error: 'File not available' }, { status: 404 });
    }

    // Increment download count
    await supabase
        .from('purchases')
        .update({ download_count: purchase.download_count + 1 })
        .eq('id', purchase.id);

    // Log the download
    await supabase.from('download_logs').insert({
        purchase_id: purchase.id,
        clip_id: clip.id,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        file_type: fileType,
    });

    // TODO: Generate signed URL from Synology/storage
    // For now, return the file path - you'll need to implement
    // actual file serving based on your storage setup
    return NextResponse.json({
        message: 'Download ready',
        filePath,
        downloadsRemaining: purchase.max_downloads - purchase.download_count - 1,
        expiresAt: purchase.download_expires_at,
    });
}
