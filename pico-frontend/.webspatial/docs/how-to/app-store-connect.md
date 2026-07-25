<!--
sidebar_position: 6
description: 'Test Packaged WebSpatial Apps on visionOS devices and submit builds through App Store Connect.'
-->

# How to test on visionOS devices and submit to the App Store

## Prerequisites

| What you need | Where to get it | How it is used later |
| --- | --- | --- |
| **Team ID** | [Apple developer account dashboard](https://developer.apple.com/account) | Passed to Builder as `--teamId`. |
| **Bundle ID** | [Certificates, Identifiers & Profiles -> Identifiers](https://developer.apple.com/account/resources/identifiers/list) | Passed to Builder as `--bundle-id`. |

## Device Testing

1. Sign in to [App Store Connect](https://appstoreconnect.apple.com/) and create an app record that uses the **Bundle ID** you created earlier.
2. Connect the test device to a Mac that has **Xcode** installed and signed in to your developer account, then open **Window -> Devices and Simulators** and record the device **Identifier** (UDID).
3. Register that device in [Certificates, Identifiers & Profiles -> Devices](https://developer.apple.com/account/resources/devices/list).
4. Run the [WebSpatial Builder `build` command](../api/builder/build.md) in the Web project with both **Team ID** and **Bundle ID**:

**Build an IPA for a registered test device**

```bash
webspatial-builder build \
  --base=$PREVIEW_SERVER \
  --bundle-id=$APPLE_BUNDLE_ID \
  --teamId=$APPLE_TEAM_ID
```

5. After the build succeeds, find the IPA file in the repository's `build/` directory, open **Window -> Devices and Simulators** in Xcode again, select the test device, and add the IPA file under **Installed Apps**.

## Submission to the App Store

> [!TIP]
> **Complete App Store Connect metadata first**
>
> Before uploading, fill in the screenshots, marketing copy, review information, pricing, regulatory information, and privacy details for the app record in App Store Connect.

1. Open the app record from [App Store Connect](https://appstoreconnect.apple.com/apps).
2. Run the [WebSpatial Builder `publish` command](../api/builder/publish.md) with the version and account credentials in addition to **Team ID** and **Bundle ID**:

**Build and upload an App Store submission**

```bash
webspatial-builder publish \
  --base=$PRODUCT_SERVER \
  --bundle-id=$APPLE_BUNDLE_ID \
  --teamId=$APPLE_TEAM_ID \
  --version=$APP_VERSION \
  --u=$APPLE_DEV_NAME \
  --p=$APPLE_DEV_PASSWORD
```

3. After the upload completes, add the new build version under **Build Versions** in App Store Connect and submit it for review.
