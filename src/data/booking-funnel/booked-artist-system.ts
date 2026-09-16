import { tatassistOffer } from './tatassist-offer';
// Per-tier checkout links are populated after catalog and package verification.
import checkoutLinks from './checkout-links.json';
export const bookedArtistSystemTiers = tatassistOffer.tiers.map((tier) => ({
  ...tier,
  checkoutUrl: checkoutLinks[tier.id as keyof typeof checkoutLinks]?.enabled ? checkoutLinks[tier.id as keyof typeof checkoutLinks].url : '',
}));
export const bookedArtistSystemConfig = {
  supportEmail: tatassistOffer.supportEmail,
  price: 47,
  guaranteeDays: tatassistOffer.guaranteeDays,
  tiers: bookedArtistSystemTiers,
} as const;
export const bookedArtistSystemPurchaseUrl = '/lp/booked-artist#buy';
