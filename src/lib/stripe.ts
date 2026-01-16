import Stripe from 'stripe';

// Server-side Stripe client - lazy initialization to avoid build errors
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
    if (!_stripe) {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY is not configured');
        }
        _stripe = new Stripe(secretKey, {
            apiVersion: '2025-12-15.clover',
        });
    }
    return _stripe;
}

export const CLIP_PRICE_CENTS = parseInt(process.env.CLIP_PRICE_CENTS || '500', 10);

export function formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}
