# Tatassist — PROJECT_CONTEXT.md

## What This Is

Tatassist website — hub-and-spoke GTM site for a tattoo business education brand. Content-driven authority site with 3 product offerings.

**Domain:** tatassist.com
**Deploy:** Vercel
**Stack:** Astro + Tailwind CSS + Markdown/MDX content collections
**Calculator:** iOS app (link TBD — use placeholder `#calculator` for now)

## Brand

- **Voice:** Tattoo-native, anti-guru, practical, direct, sharp but not preachy
- **Tagline:** "By Artists, For Artists, est 2008"
- **Founders:** Khan + Linda, 18+ years each
- **Logo:** Traditional tattoo style — barbed wire, skulls, roses, red/blue/cream palette
- **Content rule:** Sell the necessity of the system, never give away the system itself

## Products

| Product | Type | Status | CTA Target |
|---------|------|--------|------------|
| Tattoo Pricing Calculator | iOS App (SaaS) | Built | `#calculator` (placeholder) |
| Ink Hustler's Toolkit | Digital product | TBD | `#toolkit` (placeholder) |
| Coverup Ebook | Digital product | TBD | `#ebook` (placeholder) |

## Site Architecture

```
tatassist.com/
├── / (Homepage)
├── /about
├── /calculator (product page)
├── /toolkit (product page)
├── /coverup-ebook (product page)
├── /youtube (YT hub)
├── /resources/ (resource hub)
│   ├── /resources/pricing/
│   ├── /resources/deposits/
│   ├── /resources/client-qualification/
│   ├── /resources/professional-systems/
│   └── /resources/coverups/
└── /lp/ (landing pages for paid ads)
    ├── /lp/stop-guessing-quotes
    ├── /lp/stronger-deposits
    ├── /lp/undercharging
    ├── /lp/quote-authority
    └── /lp/bad-fit-clients
```

## Implementation Order

1. Scaffolding (Astro project, Tailwind, folder structure, config)
2. Shared components (nav, footer, CTA blocks, offer cards, hero patterns)
3. Homepage
4. About/Proof page
5. Product pages (Calculator, Toolkit, Ebook)
6. Resource center (hub + 5 category pages + article template)
7. YouTube hub page
8. Landing page templates
9. SEO/GEO optimization (meta, structured data, sitemap, robots.txt)

## CTA Routing

| Topic Area | Primary CTA | Secondary CTA |
|------------|-------------|---------------|
| Pricing/estimates/undercharging | Calculator | Toolkit |
| Deposits/policies/boundaries | Toolkit | Calculator |
| Client qualification/no-shows | Toolkit | Calculator |
| Professionalism/premium experience | Toolkit | Calculator |
| Coverups/specialty work | Ebook | Calculator |
| Founder story | Depends on lesson | Any |

## Design Direction

- Traditional tattoo aesthetic inspired by logo
- Dark backgrounds with cream/off-white text areas
- Red and blue accent colors from logo
- Strong typography, no-nonsense layout
- Mobile-first responsive
- Fast — minimal JS, static where possible

## Status

- [x] GTM strategy document complete
- [x] Memory files created
- [x] Tech stack decided (Astro + Tailwind + Vercel)
- [ ] Site scaffolding
- [ ] Components
- [ ] Pages
- [ ] Content
- [ ] SEO
- [ ] Deploy
