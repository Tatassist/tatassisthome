# Analytics Setup

Tatassist now supports a lightweight, environment-driven analytics layer through the shared layout.

## Environment variables

Create a local `.env` file with one of the following:

```bash
PUBLIC_GTM_ID=GTM-XXXXXXX
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Notes:

- If `PUBLIC_GTM_ID` is present, the site loads Google Tag Manager and pushes tracking events into `dataLayer`.
- If `PUBLIC_GTM_ID` is not set and `PUBLIC_GA_MEASUREMENT_ID` is set, the site falls back to direct `gtag` page and click tracking.
- If both are set, GTM takes priority and the direct `gtag` bootstrap is skipped to reduce duplicate reporting.

## Tracked event names

The site currently emits these click events:

- `tatassist_cta_click`
- `tatassist_nav_click`
- `tatassist_related_article_click`

## Event payload fields

Each tracked event includes:

- `page_title`
- `page_path`
- `page_type`
- `cta_label`
- `cta_location`
- `cta_type`
- `cta_destination`

## Recommended GTM conversion mapping

Useful starter conversions for Tatassist:

1. Calculator interest
   Trigger: `tatassist_cta_click`
   Filter: `cta_destination` contains `/calculator`

2. Toolkit interest
   Trigger: `tatassist_cta_click`
   Filter: `cta_destination` contains `/toolkit`

3. Coverup ebook interest
   Trigger: `tatassist_cta_click`
   Filter: `cta_destination` contains `/coverup-ebook`

4. Resource-to-offer movement
   Trigger: `tatassist_cta_click`
   Filter: `page_type` equals `resource_article`

5. Landing-page primary CTA clicks
   Trigger: `tatassist_cta_click`
   Filter: `cta_location` contains `landing_page`

## Current high-value tracked surfaces

- Header and mobile nav
- Footer nav
- Shared CTA blocks
- Offer cards
- Solution pillar links
- Resource article CTAs and related-resource clicks

You can expand this later to include forms, outbound channel links, scroll depth, and video engagement once those surfaces are added.
