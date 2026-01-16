import Stripe from 'stripe';

// Server-side Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
});

export const CLIP_PRICE_CENTS = parseInt(process.env.CLIP_PRICE_CENTS || '500', 10);

export function formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}
