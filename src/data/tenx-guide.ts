// The approved PDF remains in Drive. Deliver it through Kit's confirmation email.
// Never fall back to an ungated download when email is not configured.
export const tenxGuide = {
  title: "How I 10x'd My Deposits in One Month",
  landingPath: '/lp/10x-deposits',
  coverPath: '/lead-magnet/10x-guide-cover.svg',
  productPath: '/lp/booked-artist-system',
  accessUrl: '/lp/10x-deposits',
  deliveryMode: 'kit_confirmation_email',
} as const;
