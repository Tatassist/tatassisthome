import { tatassistOffer } from './tatassist-offer';

const normalizeHttpsUrl = (value: string | undefined) => {
  const candidate = value?.trim();
  if (!candidate) return '';

  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
};

const liveFoundingCheckoutUrl = 'https://buy.stripe.com/00weVfc8laWR6168C473G00';

export const bookedArtistSystemConfig = {
  checkoutUrl:
    normalizeHttpsUrl(import.meta.env.PUBLIC_BOOKED_ARTIST_SYSTEM_CHECKOUT_URL) ||
    liveFoundingCheckoutUrl,
  // Use the confirmed address, not a stale deployment environment fallback.
  supportEmail: tatassistOffer.supportEmail,
  price: tatassistOffer.launchPrice,
  nextPrice: 79,
  guaranteeDays: 30,
} as const;

export const bookedArtistSystemPurchaseUrl =
  bookedArtistSystemConfig.checkoutUrl ||
  `mailto:${bookedArtistSystemConfig.supportEmail}?subject=${encodeURIComponent(
    'Tatassist — launch access',
  )}`;
