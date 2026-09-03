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

const normalizeEmail = (value: string | undefined) => {
  const candidate = value?.trim();
  return candidate && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)
    ? candidate
    : 'support@tatassist.com';
};

const liveFoundingCheckoutUrl = 'https://buy.stripe.com/00weVfc8laWR6168C473G00';

export const bookedArtistSystemConfig = {
  checkoutUrl:
    normalizeHttpsUrl(import.meta.env.PUBLIC_BOOKED_ARTIST_SYSTEM_CHECKOUT_URL) ||
    liveFoundingCheckoutUrl,
  supportEmail: normalizeEmail(import.meta.env.PUBLIC_TATASSIST_SUPPORT_EMAIL),
  price: 49,
  nextPrice: 79,
  guaranteeDays: 30,
} as const;

export const bookedArtistSystemPurchaseUrl =
  bookedArtistSystemConfig.checkoutUrl ||
  `mailto:${bookedArtistSystemConfig.supportEmail}?subject=${encodeURIComponent(
    'The Booked Artist System — founding access',
  )}`;
