import { NextResponse } from 'next/server';
import { getStripe, CLIP_PRICE_CENTS } from '@/lib/stripe';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { clipId } = await request.json();

        if (!clipId) {
            return NextResponse.json({ error: 'Clip ID required' }, { status: 400 });
        }

        // Get clip details from database
        const supabase = createServerClient();
        const { data: clip, error: clipError } = await supabase
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

        if (clipError || !clip) {
            return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
        }

        if (!clip.is_available) {
            return NextResponse.json({ error: 'Clip not available for purchase' }, { status: 400 });
        }

        const price = clip.price_cents || CLIP_PRICE_CENTS;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Create Stripe Checkout Session
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Comedy Set - ${clip.performer_name}`,
                            description: `${clip.show.venue.name} - ${clip.show.show_date}`,
                        },
                        unit_amount: price,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/clip/${clipId}`,
            metadata: {
                clip_id: clipId,
            },
        });

        // Create pending purchase record
        const { error: purchaseError } = await supabase
            .from('purchases')
            .insert({
                clip_id: clipId,
                stripe_checkout_session_id: session.id,
                buyer_email: '', // Will be filled by webhook
                amount_cents: price,
                status: 'pending',
            });

        if (purchaseError) {
            console.error('Error creating purchase record:', purchaseError);
        }

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }
}
