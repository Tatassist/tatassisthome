export const resourceCategories = [
  {
    slug: 'pricing',
    label: 'Pricing',
    description:
      'Why artists undercharge, how to quote consistently, and what changes when pricing feels structured instead of random.',
    offer: 'Pricing Calculator',
    offerHref: '/calculator',
    offerSummary:
      'Turn vague price conversations into structured tattoo estimates you can explain and defend.',
  },
  {
    slug: 'deposits',
    label: 'Deposits',
    description:
      'Why bigger deposits depend on clearer numbers, and how better process creates stronger client commitment.',
    offer: 'Pricing Calculator',
    offerHref: '/calculator',
    offerSummary:
      'Use clearer tattoo estimates to support meaningful deposits and cleaner booking conversations.',
  },
  {
    slug: 'client-qualification',
    label: 'Client Qualification',
    description:
      'How stronger structure improves client quality, reduces wasted time, and stops bad-fit situations before they start.',
    offer: 'Tatassist Artist Systems',
    offerHref: '/toolkit',
    offerSummary:
      'Install a cleaner intake, qualification, and communication system before difficult clients drain your energy.',
  },
  {
    slug: 'professional-systems',
    label: 'Professional Systems',
    description:
      'Why professional structure creates premium pricing power, better clients, and less chaos.',
    offer: 'Tatassist Artist Systems',
    offerHref: '/toolkit',
    offerSummary:
      'Build the client-flow systems that make your boundaries and booking experience feel deliberate.',
  },
  {
    slug: 'coverups',
    label: 'Coverups & Premium Work',
    description:
      'Why complex, high-skill work deserves stronger positioning, better pricing discipline, and a more advanced approach.',
    offer: 'Coverup Ebook',
    offerHref: '/coverup-ebook',
    offerSummary:
      'Position difficult, high-skill work like a premium service instead of letting it get flattened into generic pricing.',
  },
] as const;

export const articleCTAs = {
  calculator: { label: 'See the Calculator', href: '/calculator' },
  toolkit: { label: 'Check Artist Systems', href: '/toolkit' },
  ebook: { label: 'Read about the Ebook', href: '/coverup-ebook' },
} as const;

export const homepageProducts = [
  {
    title: 'Pricing Calculator',
    description:
      'Structured tattoo estimates that feel professional and are easier to stand behind. Turns pricing from a gut-feel guess into a system.',
    ctaLabel: 'See the Calculator',
    ctaHref: '/calculator',
    accent: 'red',
  },
  {
    title: 'Tatassist Artist Systems',
    description:
      'Tattoo-specific intake tools, client messages, booking decisions, and a ready-to-run monthly campaign.',
    ctaLabel: 'Check Founding Fit',
    ctaHref: '/toolkit',
    accent: 'blue',
  },
  {
    title: 'Coverup Ebook',
    description:
      'Premium coverup thinking for artists whose complex, high-skill work deserves stronger positioning and pricing discipline.',
    ctaLabel: 'Read about the Ebook',
    ctaHref: '/coverup-ebook',
    accent: 'gold',
  },
] as const;

export const youtubeHighlights = [
  {
    title: "Why tattoo artists stay broke (it's not talent)",
    description:
      'A channel-level breakdown of where good artists lose money when pricing is still based on instinct.',
  },
  {
    title: 'How we changed our deposit game overnight',
    description:
      'The shift from token deposits to proportional commitment, and why better estimates made it possible.',
  },
  {
    title: 'Stop giving away free consultations',
    description:
      'Why weak intake and vague process create unpaid labor long before the needle touches skin.',
  },
] as const;

export const founderStats = [
  { value: '18+', label: 'Years each in tattooing' },
  { value: '10x', label: 'Deposit growth after fixing the process' },
  { value: '2008', label: 'The first downturn we had to survive' },
  { value: 'Real', label: 'Tattoo-shop-tested systems' },
] as const;
