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

const normalizeEmail = (value: string | undefined) => {
  const candidate = value?.trim();
  return candidate && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)
    ? candidate
    : 'support@tatassist.com';
};

export const artistSystemsConfig = {
  reservationUrl: normalizeExternalUrl(import.meta.env.PUBLIC_ARTIST_SYSTEMS_RESERVATION_URL),
  waitlistUrl: normalizeExternalUrl(import.meta.env.PUBLIC_ARTIST_SYSTEMS_WAITLIST_URL),
  supportEmail: normalizeEmail(import.meta.env.PUBLIC_TATASSIST_SUPPORT_EMAIL),
  businessName: import.meta.env.PUBLIC_TATASSIST_BUSINESS_NAME?.trim() || 'Tatassist',
  postalAddress: import.meta.env.PUBLIC_TATASSIST_POSTAL_ADDRESS?.trim() || '',
  foundingPrice: 19,
  foundingCapacity: 15,
  foundingAccessDate: 'September 1, 2026',
} as const;

export const artistSystemsHasExternalDestination = Boolean(
  artistSystemsConfig.reservationUrl || artistSystemsConfig.waitlistUrl,
);
