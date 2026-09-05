# Tatassist survey-led guide funnel

## Customer path

`/lp/10x-deposits` -> one question per screen -> first name/email + consent -> POST `/api/booking-check` -> save subscriber and answers in Kit -> enroll in guide form -> on-page review + $49 product -> Kit confirmation email delivers PDF.

No public PDF link, download-page shortcut, or fake email-success fallback remains. The previous PDF URL and download page redirect to the survey. The PDF is removed from the current deploy, not retroactively erased from public Git history or earlier copies. Approved Drive file: `1GB6qqgCrrW25k4eGgEelUEBplYGsjd9r`. Do not replace the guide with a different draft.

## Survey

Role; main inquiry channel; unique new inquiries in the last 30 days; deposit-paying people from that same inquiry group; consistency of the booking process; follow-up; income satisfaction and optional typical monthly revenue/goal (USD); feelings about booking; biggest problem. Final capture: first name/email required, Instagram optional. Guide/review consent required; marketing consent optional and unchecked.

Zero inquiries skip the deposit question. Unknown counts remain unknown, not zero. Conversion is a self-reported rate to date, not a mature-cohort conversion benchmark. Income gap is simple arithmetic, not recoverable revenue or a product result claim. No artificial universal score. Strong-process respondents are not told they automatically need a rebuild.

## Required Kit connection (not yet configured)

1. Select or create a dedicated Kit form for this guide. Keep its confirmation/incentive email enabled and auto-confirm off.
2. Set sender to the verified `syd@tatassist.com` address with a Joker Ink / Tatassist display name. In the form's confirmation email settings, choose Download and upload the approved Drive PDF. Use a confirmation button such as "Confirm and get my guide". Keep the account's required mailing address and unsubscribe settings correct.
3. Put a Kit v4 API key in server-only `KIT_API_KEY` and the numeric form ID in `KIT_10X_FORM_ID` in the Vercel project. Do not put secrets into browser code, the repository, screenshots, or chat.
4. Run `node scripts/setup-booking-check.mjs` with `KIT_API_KEY` in the shell environment. This idempotently creates the 19 `ta_` fields. It does not email subscribers.
5. On a preview deployment, set `KIT_10X_DELIVERY_READY=true` to test a fresh address: inspect all answers and consent in Kit, receive the real confirmation email, click its button, and open the correct PDF. After that passes, set the same flag in Production and redeploy. Until then, production is explicitly a survey preview and cannot submit a live lead.

Kit free plan's form confirmation email is the delivery mechanism, not an assumed paid automation or email sequence. Return code 200 on form enrollment means an existing enrollment; the UI does not promise another email. Previously unsubscribed addresses are not silently re-enrolled.

Use `ta_marketing_consent=yes` as a mandatory filter for promotional broadcasts or later nurture automations. A guide-only request is not permission to send marketing. Survey data is saved in the individual `ta_` fields and `ta_survey_answers`, with timestamp, version, source attribution, and consent. The latest submission updates the subscriber's fields. This is not a history of every repeat response.

## Measurement and safeguards

Only anonymous event names and question IDs reach the existing analytics helper. No email, Instagram, income amounts, or answers are sent in analytics events or placed in URL parameters. Capture is counted only after Kit accepts both field storage and form enrollment. No campaign is enabled by this code.

The endpoint validates input, origin, body size, known answer values, same-cohort counts and consent. It includes a honeypot and a per-instance soft rate limit. Add durable Vercel WAF/edge rate limiting before substantial traffic. Exceptions do not log contacts, answers or credentials. Do not invent a successful delivery status on failure.

`node --test tests/booking-check.test.mjs` runs model/API tests with mocked Kit responses. Offline Chromium UI tests cover desktop/mobile/320px, required questions, invalid counts, contact gate, submission failure, success payload and no PDF bypass. Actual production navigation and real Kit email delivery still require live testing.

## Primary API references

https://developers.kit.com/api-reference/subscribers/create-a-subscriber
https://developers.kit.com/api-reference/subscribers/update-a-subscriber
https://developers.kit.com/api-reference/forms/add-subscriber-to-form
https://developers.kit.com/api-reference/custom-fields/create-a-custom-field
https://help.kit.com/en/articles/2502655-the-confirmation-email
