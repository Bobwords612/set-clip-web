import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerClient } from '@/lib/supabase';
import { randomBytes } from 'crypto';
import Stripe from 'stripe';

export async function POST(request: Request) {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = createServerClient();

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const clipId = session.metadata?.clip_id;

            if (!clipId) {
                console.error('No clip_id in session metadata');
                break;
            }

            // Generate download token and expiry (48 hours from now)
            const downloadToken = randomBytes(32).toString('hex');
            const downloadExpires = new Date();
            downloadExpires.setHours(downloadExpires.getHours() + 48);

            // Update purchase record
            const { error: updateError } = await supabase
                .from('purchases')
                .update({
                    status: 'completed',
                    buyer_email: session.customer_details?.email || '',
                    buyer_name: session.customer_details?.name || '',
                    stripe_payment_intent_id: session.payment_intent as string,
                    download_token: downloadToken,
                    download_expires_at: downloadExpires.toISOString(),
                    completed_at: new Date().toISOString(),
                })
                .eq('stripe_checkout_session_id', session.id);

            if (updateError) {
                console.error('Error updating purchase:', updateError);
            }

            console.log(`Purchase completed for clip ${clipId}, token: ${downloadToken}`);
            break;
        }

        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;

            const { error } = await supabase
                .from('purchases')
                .update({ status: 'failed' })
                .eq('stripe_payment_intent_id', paymentIntent.id);

            if (error) {
                console.error('Error updating failed payment:', error);
            }
            break;
        }
    }

    return NextResponse.json({ received: true });
}
