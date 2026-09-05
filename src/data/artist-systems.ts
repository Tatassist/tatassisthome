import { tatassistOffer } from './tatassist-offer';

const normalizeExternalUrl = (value: string | undefined) => {
  const candidate = value?.trim();
  if (!candidate) return '';
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
};

// Compatibility for existing imports. Current purchase pages use booked-artist-system.ts.
export const artistSystemsConfig = {
  reservationUrl: normalizeExternalUrl(import.meta.env.PUBLIC_ARTIST_SYSTEMS_RESERVATION_URL),
  waitlistUrl: normalizeExternalUrl(import.meta.env.PUBLIC_ARTIST_SYSTEMS_WAITLIST_URL),
  supportEmail: tatassistOffer.supportEmail,
  businessName: import.meta.env.PUBLIC_TATASSIST_BUSINESS_NAME?.trim() || 'Tatassist',
  postalAddress: import.meta.env.PUBLIC_TATASSIST_POSTAL_ADDRESS?.trim() || '',
  foundingPrice: tatassistOffer.launchPrice,
  foundingCapacity: 15,
  foundingAccessDate: 'September 1, 2026',
} as const;

export const artistSystemsHasExternalDestination = Boolean(
  artistSystemsConfig.reservationUrl || artistSystemsConfig.waitlistUrl,
);
