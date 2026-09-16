import manifest from './offer-manifest.json';
export const tatassistOffer = {
  productName: manifest.product,
  tiers: manifest.tiers,
  assets: manifest.assets,
  launchPrice: 47,
  currency: 'USD',
  priceLabel: 'From $27',
  priceDescription: 'Essentials $27 / Working System $47 / Complete System $77. One payment.',
  supportEmail: manifest.supportEmail,
  guaranteeDays: manifest.guaranteeDays,
} as const;
