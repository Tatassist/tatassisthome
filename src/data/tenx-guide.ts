// The approved guide is also stored in Drive as file 1GB6qqgCrrW25k4eGgEelUEBplYGsjd9r.
// Serve the same PDF here so downloading never requires a Google sign-in.
const getKitFormUrl = (value: string | undefined): string => {
  if (!value?.trim()) return '';
  try {
    const url = new URL(value.trim());
    const allowedHost = /(^|\.)(kit\.com|convertkit\.com|ck\.page)$/.test(url.hostname);
    return url.protocol === 'https:' && !url.username && !url.password && allowedHost ? url.href : '';
  } catch {
    return '';
  }
};

const kitFormUrl = getKitFormUrl(import.meta.env.PUBLIC_KIT_10X_FORM_URL);
export const tenxGuide = {
  title: "How I 10x'd My Deposits in One Month",
  landingPath: '/lp/10x-deposits',
  deliveryPath: '/lp/10x-deposits/download',
  pdfPath: '/lead-magnet/how-i-10xd-my-deposits.pdf',
  coverPath: '/lead-magnet/10x-guide-cover.svg',
  productPath: '/lp/booked-artist-system',
  // Until a real Kit form is supplied, provide the guide directly. Never fake an opt-in.
  accessUrl: kitFormUrl || '/lp/10x-deposits/download',
  emailCaptureConfigured: Boolean(kitFormUrl),
} as const;
