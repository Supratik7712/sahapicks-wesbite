# SahaPicks

Simple affiliate storefront with a static frontend and Firebase for shared product data.

## What you need

- A Firebase project
- Firestore enabled
- A Formspree form for newsletter signups
- Netlify for hosting the site

## Setup

1. Create a Firebase project.
2. Enable **Cloud Firestore**.
3. Copy your Firebase config into [js/firebase.js](/Users/supratiksaha/Desktop/sahapicks%20website/js/firebase.js).
4. Create a Formspree form and use its endpoint in the newsletter form.
5. Deploy this repo to Netlify.

## How it works

- The public storefront reads products from Firestore.
- The admin panel adds, edits, and deletes products from the same Firestore collection.
- Product images are stored as image URLs in Firestore.
- The newsletter form sends emails through Formspree.
- Everyone visiting your live site sees the same products.

## Local preview

- If Firebase config is not filled in, the site falls back to localStorage.
- That fallback is only for testing on your own browser.

## Admin flow

- Open the site.
- Click **Admin**.
- Add product details and an affiliate link.
- Upload an image.
- Save the product.

## Newsletter setup

1. Create a Formspree form.
2. Copy the form endpoint URL.
3. Paste it into the newsletter form `action` in [index.html](/Users/supratiksaha/Desktop/sahapicks%20website/index.html) and `window.NEWSLETTER_CONFIG.webhookUrl` in [js/app.js](/Users/supratiksaha/Desktop/sahapicks%20website/js/app.js).
4. Make sure the newsletter input has `name="email"`.

## Data model

The product records use a small set of fields:

- `title`
- `description`
- `price`
- `originalPrice`
- `image`
- `affiliateUrl`
- `tags`
- `createdAt`
- `clickCount`

## Notes

- The old `server/` folder is legacy and not needed for the Firebase-first deployment.
- The old backend files were removed to keep the project simple.
- Admin login is still a prototype password gate. Replace it with Firebase Auth if you want proper security later.
