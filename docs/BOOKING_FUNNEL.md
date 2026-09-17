# Before You Quote booking funnel

Selected design: Costly inbox, the paired cream quiz and dark personalized sales board selected by the user on September 15, 2026.

## Routes and behavior

- `/lp/before-you-quote`: five questions, one at a time, then first name, last name and email. Marketing tips/offers checkbox is optional and unchecked.
- `/api/offer-quiz`: server validates all five answers, contact details and origin, saves fields in Kit, then enrolls in the selected guide form. It returns success only after these requests succeed.
- `/lp/booked-artist`: the selected edition is shown prominently. A result from the same browser tab supplies the matching explanation and free-guide link. Direct visitors see Working System by default. `?edition=essentials`, `working`, or `complete` selects an edition without claiming a quiz result. This is also the link format for email CTAs.
- These are independent new routes. Existing home, qualification, and sales pages retain their current behavior.
- The existing 10x guide route, survey and delivery API remain independent.

The five topics are client goal, monthly tattoo-revenue goal, typical total project value, monthly inquiry volume, and bottleneck. Revenue includes a skip answer. Working System is the default. Recommend Complete only when typical projects exceed $3,000, monthly inquiries exceed 30, and the bottleneck is estimates, pauses, or a scattered process. Income goals alone never trigger a premium recommendation. Goals and bottlenecks personalize the explanation. Essentials and Complete remain manually selectable alternatives. No separate tool-coverage question is asked.

Every edition is cumulative and covers one artist. A multi-artist studio needs a separate licensing discussion. The quiz does not calculate lost revenue or promise financial results.

## Kit activation

No Kit credentials were available in this workspace. No contacts were created and no email was sent during this build.

1. Set server-only `KIT_API_KEY` in Vercel and in the shell used for setup. Run `node scripts/setup-offer-quiz.mjs` to prepare the 17 `bas_` custom fields. Never expose this key in a public variable.
2. Configure two dedicated Kit forms using the same approved Before You Quote PDF and confirmation/incentive email. Form A is guide only, with no promotional automation. Form B is guide plus requested tips/offers. Save their IDs as `KIT_BOOKING_FORM_ID` and `KIT_BOOKING_NURTURE_FORM_ID`.
3. Use verified sender Joker Ink / Tatassist at `syd@tatassist.com`. Keep confirmation enabled; new subscribers remain inactive until they confirm. The confirmation button delivers `/lead-magnet/before-you-quote.pdf`. This is the seven-page Before You Quote guide with the current Working System bridge, separate from the 10x guide.
4. On confirmation of Form B, enter the seven-email sequence in `docs/BOOKING_FUNNEL_COPY.md`. Its delays are 1 hour, 1 day, 1 day, 1 day, 1 day, 2 days, and 2 days. Gate entry on `bas_marketing_consent=yes`. Filter out all purchasers of Essentials, Working and Complete. On each purchase, remove the buyer from the acquisition sequence. Before each email, check that the subscriber is active, still has `bas_marketing_consent=yes`, and has no buyer status/tag for any tier. Test these conditions in the actual Kit plan/account before enabling the flow.
5. Current email copy is static and uses general recommendations with populated links; it does not require merge fields. Preserve the stored edition fields for future tested personalization. Change the offer text and CTA together if introducing matched variants. Repeat submissions update fields; they do not create a historical response log or force re-entry to an already completed sequence.
6. Test a fresh guide-only address and a fresh marketing-opt-in address. Confirm the correct PDF arrives, all answers and names save, the correct form is chosen, confirmation is honored, and sequence delays and suppression work. Test a buyer and an unsubscribed address too.
7. Set `KIT_BOOKING_DELIVERY_READY=true` only after those checks. Missing setup returns an error, keeps the user's answers, and never reports an email sent.

A 200 response on form enrollment means already enrolled. The API labels it `previous_request` and does not claim another email. The result page supplies the guide directly after a successful capture. It says the guide is ready, not that mail delivery is confirmed.

## Data and events

The server stores first name, last name, email, five answer codes, recommended edition, consent choice, version, timestamp and whitelisted campaign attribution. No names, emails, income answers or quiz answers appear in analytics or URLs. The tab stores only the five answer codes and a two-hour result timestamp. Contact details stay in memory until navigation. No localStorage is used.

Events: `tatassist_booking_quiz_started`, `tatassist_booking_quiz_step` (question ID only), `tatassist_booking_lead_captured` after success, and `booked_artist_edition_viewed`. Checkout is never reported as a purchase. Rate protection is per server instance; production WAF can impose a durable endpoint limit.

## Release status

This branch adds two independent landing pages to the existing Astro project. It includes the five-question quiz, matching, server integration, product artwork, free guide, and tier terms. No preview-only simulation is included. Existing routes and the existing 10x guide/API retain their current behavior.

Kit requires the dedicated forms, credentials, and automation above. Checkout flags remain disabled until the package downloads are accessible. The browser previously rejected local/private preview URLs, so browser acceptance remains unverified. The source builds and automated tests can be reviewed in the pull request.

## API references

- https://developers.kit.com/api-reference/subscribers/create-a-subscriber
- https://developers.kit.com/api-reference/subscribers/update-a-subscriber
- https://developers.kit.com/api-reference/forms/add-subscriber-to-form
