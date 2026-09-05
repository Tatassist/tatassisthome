# 10x deposits free-guide funnel

- Landing page: `/lp/10x-deposits`
- Delivery and $49 product bridge: `/lp/10x-deposits/download`
- Same-origin PDF: `/lead-magnet/how-i-10xd-my-deposits.pdf`
- Original approved PDF in Drive: `1GB6qqgCrrW25k4eGgEelUEBplYGsjd9r`
- The paid product page, Stripe checkout, and existing homepage are unchanged.

## Email capture status

No Kit form URL or embed was available when this page was published. The default is a working direct-download journey, not a simulated signup. It does not collect or store emails, send delivery emails, or report a download click as a lead or purchase.

To activate the user's real Kit form, set `PUBLIC_KIT_10X_FORM_URL` to its public HTTPS URL on kit.com, convertkit.com, or ck.page and redeploy. Configure that Kit form to deliver the PDF and send its successful submissions to `https://tatassist.com/lp/10x-deposits/download`. Test subscriber creation, email receipt, consent/unsubscribe settings, and the redirect before starting a lead-acquisition campaign. This public form URL is not an API key.

## Tracking

The pages use the existing BaseLayout and its configured analytics. Click events are `tatassist_guide_access_clicked`, `tatassist_guide_download_clicked`, `tatassist_guide_opened`, and `tatassist_product_offer_clicked`. The data layer can be connected to the ad platform separately. These are click events, not confirmed lead or purchase events.

Only the five UTM parameters and `ref` are forwarded between guide and product pages. No email addresses are copied into links or tracking.
