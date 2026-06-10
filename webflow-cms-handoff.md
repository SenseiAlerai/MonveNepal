# Webflow CMS Handoff Plan

This site should be built as a Webflow CMS catalog, not an ecommerce store. The client only needs to show collections, add/remove bags, change photos, and receive inquiries.

## CMS Collections

### Bags

Use this as the main collection your client edits most often.

- Name: plain text
- Slug: auto-generated
- Main Image: image
- Gallery Images: multi-image
- Category: reference to Bag Categories
- Color / Finish: plain text
- Material: plain text
- Short Description: plain text
- Full Description: rich text
- New Arrival: switch
- Featured: switch
- Sort Order: number
- Inquiry Note: plain text, optional
- Hidden from Site: switch

Do not include price fields unless the client later changes their mind.

### Bag Categories

- Name: plain text, for example Signature Denim Bags, Clutch Bags, Crossbody Bags, Top Handles Bag
- Slug: auto-generated
- Category Image: image
- Short Description: plain text
- Sort Order: number

### Homepage Settings

Use one single CMS item named Homepage.

- Hero Image: image
- Hero Eyebrow: plain text
- Hero Title: plain text
- Hero Description: plain text
- Primary Button Text: plain text
- Featured Category: reference to Bag Categories
- Story Image: image
- Story Title: plain text
- Story Text: rich text
- Inquiry CTA Text: plain text

## Pages

- Home: hero, category strip, new arrivals, featured bags, story, inquiry CTA
- Catalog: all visible bags, filters by category, search if using Webflow custom code or a filtering plugin
- Category Template: bags from one category
- Bag Template: large gallery, description, category, material, color, inquiry button
- About: editable static page
- Contact: inquiry form and WhatsApp link

## Client Editing Workflow

1. Open Webflow Editor.
2. Go to CMS > Bags.
3. Click New Bag.
4. Add name, images, category, color, material, and description.
5. Turn on New Arrival or Featured if needed.
6. Publish.

To remove a bag without deleting it, turn on Hidden from Site.

## Recommended Inquiry Setup

Use a visible button on every bag detail page:

- WhatsApp: `https://wa.me/9779840559803?text=Hi, I am interested in BAG_NAME`
- Instagram: `https://www.instagram.com/monve.np/`
- Email fallback: `monvenepal@gmail.com`
- Location: Durbarmall, Ground Floor, Shop No: 412, Durbar Marg
- Map link: `https://www.google.com/maps/search/?api=1&query=Durbarmall%20Ground%20Floor%20Shop%20No%20412%20Durbar%20Marg`

## Build Notes

- Keep CMS item cards simple and image-led.
- Hide price, cart, checkout, inventory, and payment wording everywhere.
- Train the client only on Bags, Bag Categories, and Homepage Settings.
- Before handoff, create 6-10 sample bag items so the client can duplicate an existing entry instead of starting from zero.
