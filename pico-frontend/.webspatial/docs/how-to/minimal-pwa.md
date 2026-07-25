<!--
sidebar_position: 1
description: 'Prepare the minimum manifest, icons, and installability requirements needed for WebSpatial and packaged app workflows.'
-->

# How to meet the minimum PWA requirements

## Checklist

| Requirement | Why it matters |
| --- | --- |
| Serve the Web App over HTTPS. | Installable PWAs require a secure origin. |
| Expose a [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest) from every page in the app. | The manifest defines app-level identity and startup behavior. |
| Provide the minimum manifest fields required by WebSpatial Runtime. | The runtime needs app identity, icon assets, and start-scene settings. |

## Add the manifest link

**Add the manifest link to every HTML document**

```html
<link rel="manifest" href="/app.webmanifest" />
```

The manifest URL should return a [JSON MIME type](https://mimesniff.spec.whatwg.org/#json-mime-type) response, such as `application/manifest+json`.

> [!IMPORTANT]
> **Further reading**
>
> See [MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) and [web.dev](https://web.dev/learn/pwa/web-app-manifest/) for more detail on installable PWAs.

## Provide the minimum manifest fields

| Field | What it does | Notes |
| --- | --- | --- |
| [`name`](https://developer.mozilla.org/en-US/docs/Web/Manifest/name) or [`short_name`](https://developer.mozilla.org/en-US/docs/Web/Manifest/short_name) | Provides the app name. | At least one of these fields must be present. |
| [`icons`](https://developer.mozilla.org/en-US/docs/Web/Manifest/icons) | Provides app icons. | Include at least one `"purpose": "any"` icon and one `"purpose": "maskable"` icon that is at least `1024×1024`, has no transparent background, and has no rounded corners. |
| [`start_url`](https://developer.mozilla.org/en-US/docs/Web/Manifest/start_url) | Configures the URL for the start scene. | This determines which page loads first when the app starts. |
| [`display`](https://developer.mozilla.org/en-US/docs/Web/Manifest/display) | Configures the display mode of the webpage window. | WebSpatial Runtime currently supports only `"standalone"` and `"minimal-ui"`. |

**Minimum manifest for a WebSpatial-ready PWA**

```json
{
  "name": "My Awesome App",
  "start_url": "/",
  "display": "minimal-ui",
  "icons": [
    {
      "src": "/pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/pwa-1024x1024.png",
      "sizes": "1024x1024",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

## Recommended Icons for Web Apps

> [!TIP]
> **Sample files**
>
> [webspatial-icon-examples.zip](https://webspatial.dev/assets/guide/webspatial-icon-examples.zip) contains icon files that already satisfy the requirements below.

| Size | Purpose | Where It Appears | Transparent Background Allowed | Rounded Corners Allowed | How to Provide It |
| --- | --- | --- | --- | --- | --- |
| 48 × 48 | favicon.ico | Browser tab | Required | Allowed | [HTML `<link>`](https://github.com/joshbuchea/HEAD#icons) |
| 180 × 180 | [iOS app icon](https://developer.apple.com/design/human-interface-guidelines/app-icons#iOS-iPadOS-app-icon-sizes) | iOS "Add to Home Screen" | Not allowed | Not allowed | [HTML `<link>`](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html) |
| 192 × 192 | Standard PWA icon | Small icon on the home screen | Required | Required | Web App Manifest |
| **512 × 512** | Standard PWA icon | Various launch surfaces, app markets, and similar places | Required | Required | Web App Manifest |
| **1024 × 1024** | Spatial app icon | [visionOS](https://developer.apple.com/design/human-interface-guidelines/app-icons#visionOS-app-icon-sizes), PICO OS 6 | **Not allowed** | **Not allowed** | Web App Manifest |
