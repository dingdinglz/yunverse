<!--
sidebar_position: 1
description: 'Understand what WebSpatial adds to the Web, how the SDK works, and how to integrate it into a React project.'
-->

# Getting Started

## Overview

WebSpatial is a set of [minimal extensions to HTML/CSS/DOM APIs](https://tpac2025.webspatial.dev/) plus a [polyfill](https://www.w3.org/2001/tag/doc/polyfills/)-style open-source [SDK](#webspatial-sdk). It brings [spatialized UI capabilities](#features) equivalent to [native spatial apps](../concepts/spatial-computing.md#spatial-app) and a [2D containing 3D](#philosophy) developer experience into Web standards and mainstream Web frameworks. This allows HTML content on [spatial computing](../concepts/spatial-computing.md) platforms to break free from the screen, enter real space, gain real volume, support natural spatial interactions and flexible 3D programming, while preserving the Web's original [cross-platform nature](#philosophy), mental model, and [development workflow](#preview). The goal is to let the mainstream Web ecosystem and Web developers move seamlessly into the era of [spatial computing and multimodal AI](https://tpac2025.webspatial.dev/).

## Features

### WebSpatial API

1. **Spatial scenes**: The [start page](../concepts/spatial-scenes.md#start-scene) of a Web App (PWA), and every page of the same app [opened in a new window](../concepts/spatial-scenes.md#new-scenes), becomes a [spatial scene container](../concepts/spatial-scenes.md) integrated with the surrounding space. Different [initialization settings](../concepts/spatial-scenes.md#scene-initialization) can be applied to these containers.
2. **Material backplates**: For webpages using the [window scene type](../concepts/spatial-scenes.md#scene-type), the [background panel](../api/react-sdk/css-api/background-material.md) can use a native-feeling translucent material rendered dynamically based on viewpoint and environment, or it can be made fully transparent with no visible border so that elements appear to float separately in space.
3. **Volumetric windows**: A webpage window can change its [behavior in space](../concepts/spatial-computing.md) from serving 2D GUI needs first to [simulating a real-world object, so the window behaves like a "box"](../concepts/spatial-scenes.md#scene-type) with real volume and [depth](../api/react-sdk/dom-api/innerDepth.md).
4. **Spatialized HTML elements**: HTML elements can be "lifted" into the 3D space in front of the page plane while still participating in the CSS layout system. These [spatialized](../concepts/spatialized-html-elements.md) HTML elements keep their original state and APIs [on the X and Y axes](../concepts/spatialized-html-elements.md), while also becoming 2D planes floating in a spatial scene. They can have [material backplates](../api/react-sdk/css-api/background-material.md), be [laid out and positioned](../api/react-sdk/css-api/back.md) along the Z axis with CSS, receive 3D [transformations](../api/react-sdk/css-api/transform.md) such as rotation, and expose [related state](../concepts/spatialized-html-elements.md) through DOM APIs.
5. **Material backgrounds**: The background of an HTML element can use a [real-time rendered translucent material](../api/react-sdk/css-api/background-material.md), instead of being limited to fixed colors.
6. **3D container elements**: Two new kinds of 3D HTML elements act as containers for 3D content with real volume. These 3D container elements still participate in the CSS layout system [as 2D planes](../concepts/spatialized-html-elements.md), support Z-axis [layout](../api/react-sdk/css-api/back.md) and [transforms](../api/react-sdk/css-api/transform.md), and also create a local space in front of the 2D plane based on a [3D development paradigm](../concepts/3d-content-containers.md). Real volumetric 3D content can be rendered there so it fits into the 2D layout system and the [rendering model of 2D GUI frameworks](https://react.dev/learn/thinking-in-react), enabling a [2D containing 3D development paradigm](#philosophy).
7. **Static 3D container elements**: The 3D content inside a container can be rendered from [prebuilt 3D model asset files](../api/react-sdk/react-components/Model.md). The API for this kind of 3D container element [is fully based on the Web standard model element](../api/react-sdk/react-components/Model.md).
8. **Dynamic 3D container elements**: The 3D content inside a container can be rendered dynamically through a [flexibly programmable, HTML-style 3D engine API](../concepts/3d-content-containers.md#3d-engine-api).
9. **HTML-style 3D engine APIs**: These APIs include [3D asset declarations](../concepts/3d-content-containers.md#3d-engine-api) such as models and materials, built-in capability modules, and ready-to-use [3D entities](../api/react-sdk/react-components/Reality.md) such as primitive shapes. These entities can be freely composed in a [3D coordinate system](../concepts/3d-content-containers.md#2d-containing-3d) using a tree structure and [Transform props](../api/react-sdk/react-components/Reality.md), enabling arbitrary 3D scenes and animations.
10. **2D attachment entities**: [2D HTML content can be attached to plane-shaped 3D entities](../api/react-sdk/react-components/Reality.md), so fully functional 2D content can also be embedded inside 3D content.
11. **Spatial interactions**: New [spatial interaction events](../concepts/natural-interactions.md#spatial-interactions) such as tap, drag, and rotate can be triggered on the 2D planes corresponding to spatialized HTML elements and on 3D content inside 3D container elements (on 3D mesh surfaces or bounding boxes), providing interaction information in 3D space such as positions in a 3D coordinate system.
12. **Mixed 2D + 3D content**: 2D content based on the CSS layout system and dynamic 3D container content based on the 3D engine can be combined through APIs such as [coordinate conversion and unit conversion](../concepts/3d-content-containers.md#2d-containing-3d), enabling alignment, coupling, and other integration patterns.

### WebSpatial SDK

1. **Forward-looking pre-implementation**: Together with a [native runtime implementation](../concepts/webspatial-app.md#webspatial-runtime), the proposed HTML/DOM/CSS APIs are [polyfilled (or "prollyfilled")](https://www.w3.org/2001/tag/doc/polyfills/) within the JSX, refs, and CSS of React projects. This makes the [WebSpatial API](#webspatial-api) available immediately, without waiting for browser engines on each platform to formally support these APIs.
2. **Cross-version compatibility**: The SDK shields developers from instability, changes, and platform differences while WebSpatial APIs enter Web standards (HTML/CSS/DOM). The APIs exposed by the SDK remain backward compatible, so older code keeps working.
3. **Cross-platform compatibility**: On platforms that support [spatial computing and unified rendering](../concepts/spatial-computing.md), platform differences are hidden as much as possible so apps get unified spatial app concepts and spatialized UI features. On platforms that do not support spatial computing and unified rendering, the SDK will automatically ignore WebSpatial APIs, skip loading the full SDK implementation, and avoid affecting the behavior or performance of webpages in ordinary browsers on desktop computers, phones, and other screen-based devices.
4. **Custom cross-platform logic**: The SDK provides feature detection and [runtime detection](../api/react-sdk/dom-api/userAgent.md), so developers can add custom cross-platform handling for the small number of JS API / DOM API calls that can't be ignored automatically, and enable custom enhancements and platform-specific features on spatial computing platforms.
5. **App packaging**: A PWA can be packaged as a [native app bundle with its own WebSpatial Runtime and no external dependency](../concepts/webspatial-app.md#packaged-webspatial-app), such as a visionOS app. Like a native app, it can be installed on simulators or real devices for [preview and debugging](#preview), and [submitted to app stores such as the visionOS App Store](#distribution).

## Philosophy

1. WebSpatial adopts a new ["2D containing 3D"](../concepts/3d-content-containers.md#2d-containing-3d) development paradigm. It is built on the 2D Web ecosystem and HTML/CSS APIs, continuing the 2D mental model and development style developers already know. It only adds [Z-axis APIs for 2D elements](../concepts/spatialized-html-elements.md), plus APIs that [let a local 3D space behave like a 2D element](../concepts/3d-content-containers.md). The [3D development paradigm](../concepts/3d-content-containers.md#3d-engine-api) is confined inside local 3D spaces, and those local 3D renderings are integrated into the overall 2D rendering model. Developers can use 3D capabilities only where needed, instead of rebuilding an entire app as a 3D app and disconnecting from the mainstream 2D ecosystem.
2. WebSpatial only makes minimal extensions to HTML/CSS/DOM APIs. For [X/Y-axis-related functionality](../concepts/spatialized-html-elements.md), it continues to use existing Web standard APIs, which can be combined with the newly added [Z-axis-related APIs](../api/react-sdk/css-api/back.md).
3. Inside local 3D spaces, WebSpatial avoids doing [independent rendering](https://tpac2025.webspatial.dev/#webxr-not-enough) with low-level 3D graphics APIs as WebXR does. Instead, it uses a [declarative 3D engine API that combines ECS and HTML](../concepts/3d-content-containers.md#3d-engine-api), so spatial computing platforms can understand this 3D content and [render it together](../concepts/spatial-computing.md#unified-rendering) with content from other apps in the same space.
4. WebSpatial avoids implementing all content for a [spatial app](../concepts/spatial-computing.md#spatial-app) inside a single webpage the way a [WebXR session](https://developer.picoxr.com/document/web/introduce-webxr-standards/) does. Instead, it preserves standard Web development patterns such as multi-page sites, hyperlinks, and PWAs, and uses the [Web App Manifest](../concepts/webspatial-app.md#web-app) and ["open links in a new window"](../concepts/spatial-scenes.md#new-scenes) to provide spatial app and [spatial container](../concepts/spatial-scenes.md) capabilities.
5. The [SDK](#webspatial-sdk) should keep its [simulated pre-implementation](https://www.w3.org/2001/tag/doc/polyfills/) of the proposed HTML/CSS/DOM APIs moderate, not overly complex or uncontrollable. For that reason, modifying [spatial styles/state](../concepts/spatialized-html-elements.md) and [listening to spatial events](../concepts/natural-interactions.md#spatial-interactions) is only supported in declarative code that follows the [Rules of React](https://react.dev/reference/rules), and [reading spatial styles/state (read-only)](../concepts/spatialized-html-elements.md) is only supported on objects obtained through [Hook APIs](https://react.dev/reference/react/hooks), such as [Refs](https://react.dev/learn/referencing-values-with-refs). Directly selecting DOM objects with imperative code is not supported for these operations.
6. The [SDK](#webspatial-sdk) should integrate into existing standard Web projects with as little cost as possible, in a way that is [close to one-click installation](#installation), without changing the project's [original development, build, or deployment workflow](#preview), and while ensuring that the site's existing behavior, performance, and debugging experience on desktop/mobile platforms and ordinary browsers are not affected.
7. With WebSpatial APIs and the SDK, building a new [spatial app](../concepts/spatial-computing.md#spatial-app) should feel just like building a normal website. If developers want, the app can still be distributed as a standard website, preserving the Web's original cross-platform capability and its [URL-based usage model](https://tpac2025.webspatial.dev/#instant-apps).

## Supported Web Projects

The open-source [WebSpatial SDK](#webspatial-sdk) currently provides a [React SDK](../api/react-sdk/). Any standard website project built with React should be able to enable the [WebSpatial API](#webspatial-api) by integrating this SDK.

The React SDK needs to be integrated into the [JSX Runtime](https://www.typescriptlang.org/docs/handbook/jsx.html). In React projects that use TypeScript, this requires only [one line of configuration](#set-up-your-project) (a few web build tools need [extra configuration](../how-to/rspack.md)). In JavaScript projects, you [can only configure the JSX Runtime in the web build tool](../how-to/non-ts.md).
The web build tools that have been tested and used most often so far are:

- Vite
- Next.js, Remix ([SSR is supported](../how-to/ssr.md))
- Rspack / Rsbuild / Webpack

> [!CAUTION]
> **Current limitation**
>
> The latest version of WebSpatial SDK currently has a bug that temporarily prevents support for styled-components.

## Supported Platforms

The [spatial computing](../concepts/spatial-computing.md) platforms currently supported are:

- ✅ [visionOS](https://developer.apple.com/visionos/) (for example, Vision Pro devices): with WebSpatial SDK, a website can be packaged as a [hybrid app](../concepts/webspatial-app.md#packaged-webspatial-app) that includes the full [WebSpatial Runtime](../concepts/webspatial-app.md#webspatial-runtime), submitted to the App Store, and run with native spatial behavior
- ✅ [PICO OS 6](https://developer.picoxr.com/document/discover/pico-os-6-overview/) (for example, [Project Swan](https://developer.picoxr.com/blog/pico-developer-special-event-2026/) devices): its OS-level [Web App Runtime](https://developer.picoxr.com/zh/document/web/web-app/) includes the [WebSpatial Runtime](../concepts/webspatial-app.md#webspatial-runtime), so WebSpatial APIs on websites can work directly

Spatial computing platforms currently working toward WebSpatial Runtime implementations are:

- ⏳ [JSAR Runtime](https://jsar-project.github.io/runtime/) (for example, Rokid glasses)
- ⏳ [IRIS OS](https://www.irisview.cn/)

Spatial computing platforms planned for priority support, but currently waiting for stable native APIs, are:

- ⏳ [Android XR](https://www.android.com/xr/) (for example, XREAL glasses)
- ⏳ [Meta Horizon OS](https://developers.meta.com/horizon/) (for example, Meta Quest devices)

## Installation

### Step 1: Runtime SDK

To enable the [WebSpatial API](#webspatial-api) in a React project, install the React SDK and the underlying Core SDK provided by the [WebSpatial SDK](#webspatial-sdk) project:

**npm**

```bash
npm install @webspatial/react-sdk @webspatial/core-sdk
```

**yarn**

```bash
yarn add @webspatial/react-sdk @webspatial/core-sdk
```

**pnpm**

```bash
pnpm add @webspatial/react-sdk @webspatial/core-sdk
```

### Step 2 (Optional): Builder

For spatial computing platforms that do not have a built-in [WebSpatial Runtime](../concepts/webspatial-app.md#webspatial-runtime), the website must be packaged as a [native app that includes WebSpatial Runtime](../concepts/webspatial-app.md#packaged-webspatial-app). That requires these additional installation steps:

> [!TIP]
> **PICO OS 6 does not need packaging**
>
> The [Web App Runtime](https://developer.picoxr.com/document/web/web-app/) in [PICO OS 6](https://developer.picoxr.com/document/discover/pico-os-6-overview/) already includes WebSpatial Runtime and can make the WebSpatial APIs on a website work directly, so packaging is not required and none of the extra installation steps below are needed.

1. Install the packaging tool ([WebSpatial Builder](../concepts/webspatial-app.md#webspatial-builder)) provided by the WebSpatial SDK project in the React project:

**npm**

```bash
npm install -D @webspatial/builder
```

**yarn**

```bash
yarn add -D @webspatial/builder
```

**pnpm**

```bash
pnpm add -D @webspatial/builder
```

2. The WebSpatial Runtime implementation for each platform is provided as a separate npm package and must be installed independently. For example, to support visionOS, install:

**npm**

```bash
npm install -D @webspatial/platform-visionos
```

**yarn**

```bash
yarn add -D @webspatial/platform-visionos
```

**pnpm**

```bash
pnpm add -D @webspatial/platform-visionos
```

3. To generate native app bundles, WebSpatial Builder must invoke the native development tools for the target platform. For visionOS, that means you must [install Xcode and visionOS-related components](../how-to/xcode.md).

## Set Up Your Project

### Step 1: JSX Runtime

Before using the WebSpatial API, integrate the React SDK into the current React project's [JSX Runtime](https://www.typescriptlang.org/docs/handbook/jsx.html).

For TypeScript React projects, you only need to configure the [`jsxImportSource`](https://www.typescriptlang.org/tsconfig/jsxImportSource.html) field in `tsconfig`:

**tsconfig.json**

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@webspatial/react-sdk",
// ...
```

> [!TIP]
> **Related setup guides**
>
> - For TS projects based on Rspack, you also need to [configure `swc-loader`](../how-to/rspack.md).
> - For JavaScript React projects, you need to [configure the JSX Runtime in the web build tool](../how-to/non-ts.md).
> - For projects with SSR enabled, you need to [add the Context required by the SDK](../how-to/ssr.md).

### Step 2: Minimal PWA

To provide the app information required by a spatial app and the [settings for the start window](../concepts/spatial-scenes.md#start-scene), the current site must [provide a Web App Manifest following the PWA standard](../how-to/minimal-pwa.md).

> [!TIP]
> **Sample files**
>
> [webspatial-icon-examples.zip](https://webspatial.dev/assets/guide/webspatial-icon-examples.zip) contains icon files and manifest file that already satisfy the PWA requirements.
> You just need to unzip it into a directory on your website that can be publicly accessed via URL, then embed the manifest file's URL in your HTML with `<link rel="manifest" href="/app.webmanifest" />`.

> [!TIP]
> **Already a PWA?**
>
> If the current site is already a PWA and can be installed as a PWA in Chrome, you can skip this step.

## Boilerplate

If you want to get started quickly, use the [`@webspatial/starter`](https://www.npmjs.com/package/@webspatial/starter) CLI.

To scaffold a new WebSpatial project:

```bash title="Create a new WebSpatial project"
npx @webspatial/starter create my-webspatial-app
```

To add WebSpatial AI resources to an existing web project in one command:

```bash title="Add WebSpatial AI resources to an existing project"
npx @webspatial/starter ai
```

The `ai` command generates a project-local set of WebSpatial AI resources for the current web project, including the full documentation set, project guidance, and agent skills. These resources are designed to be embedded into developers' own web projects, so an agent can use them to understand the recommended WebSpatial workflow and help with setup, integration, and follow-up development tasks.

## Preview

To preview and debug [WebSpatial effects](#webspatial-api), first run the current Web project as a website just as you would in normal website development, and get an accessible URL. For example, using the [Dev Server](https://vite.dev/guide/#command-line-interface) from Vite:

**Start the local dev server**

```bash
vite dev
# result:
# -> Local: http://localhost:5173/
```

### Website Mode

For spatial computing platforms with a [built-in WebSpatial Runtime](https://developer.picoxr.com/document/web/web-platform/) (for example, [PICO OS 6](https://developer.picoxr.com/document/discover/pico-os-6-overview/)):

Just visit the current website URL in the PICO Browser on the [official simulator](https://developer.picoxr.com/document/spatial-toolkit/learn-about-pico-emulator/) or on a real PICO OS 6 device, then click the "Run as a standalone app" button in the address bar - the website will run as a [Web App with WebSpatial enabled](https://developer.picoxr.com/document/web/install-free/), and you can see the spatialized UI effects and volumetric 3D content produced by WebSpatial.

> [!TIP]
> **PICO OS 6 simulator networking**
>
> When previewing a local URL as a Web App on the PICO OS 6 simulator, the [URL is not required to use HTTPS](https://developer.picoxr.com/document/web/manifest/), and you need to use the default IP address `10.0.2.2`. For example, `http://10.0.2.2:5173/`.
>
> To access the Vite dev server via `10.0.2.2`, you need to [set `server: { host: true }` in Vite](https://vitejs.dev/config/server-options) so it allows IPs beyond `localhost` or `127.0.0.1`.

### Packaged App Mode

For spatial computing platforms without a built-in [WebSpatial Runtime](../concepts/webspatial-app.md#webspatial-runtime) (for example, visionOS):

You cannot preview and debug directly from a website URL. You need [WebSpatial Builder](../concepts/webspatial-app.md#webspatial-builder):

Running Builder's [`run` command](../api/builder/run.md) gives you a "one-click preview" workflow. It automatically packages the current website as a [native app bundle that includes WebSpatial Runtime](../concepts/webspatial-app.md#packaged-webspatial-app), launches the official simulator (for example, the [visionOS simulator](../how-to/xcode.md)), transfers the app bundle into the simulator, installs it, and launches the app.

**Preview the app in the simulator**

```bash
webspatial-builder run --base="http://localhost:5173/"
```

> [!IMPORTANT]
> **`run` can use a temporary manifest**
>
> The `run` command allows the Web project to skip providing a Web App Manifest during the early development and debugging phase. In that case, Builder will provide temporary default [app information](../how-to/minimal-pwa.md) (`start_url` is `''`).

> [!CAUTION]
> **Offline packaging slows iteration**
>
> If [`start_url` is incomplete and missing the domain](../api/builder/run.md#--manifest), and you do not [use `--base` to fill in the base part for `start_url`](../api/builder/run.md#--base), Builder will automatically package the website output into the native app bundle. During runtime, website files are loaded offline from local files inside the app bundle.
>
> During development and debugging, this mode means every code change requires rerunning Builder and waiting for packaging and installation to finish, which is inefficient. It is recommended to always provide the `--base` parameter during development and debugging.

To preview on a personal test device, run Builder's [`build` command](../api/builder/build.md) to generate an app bundle. For visionOS devices, you need to [obtain extra parameters from App Store Connect, register the test device in Xcode, and install the app](../how-to/app-store-connect.md).

## Debug

Whether you run on a simulator or a test device, whether you access the website URL directly or package and install the website as a standalone app with WebSpatial Builder, you can remotely connect from DevTools in a browser on your local computer to the Web Runtime in the spatial computing environment for debugging.

WebSpatial apps on visionOS are implemented on top of WebView. You can use Safari Web Inspector on macOS to remotely debug the state and Web code inside each WebView instance, just as you would when debugging webpages on iOS devices.
See Apple's official documentation: [Inspecting iOS and iPadOS](https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios)

For Android-based spatial computing platforms such as PICO OS 6, you can use Chrome DevTools on a computer to remotely debug Web Apps with WebSpatial enabled.
See Google's official documentation: [Remote debug Android devices](https://developer.chrome.com/docs/devtools/remote-debugging)

## Distribution

There are two ways to distribute a Web App that includes WebSpatial:

The first is to distribute it as a cross-platform website, spread it through URLs, and get traffic that way. On spatial computing platforms with a built-in WebSpatial Runtime, it can be [accessed on demand by URL](https://tpac2025.webspatial.dev/#instant-apps), used temporarily, or [installed onto a device as a PWA](https://developer.picoxr.com/document/web/installable/).

> [!TIP]
> **Web Apps on PICO OS 6**
>
> On [PICO OS 6](https://developer.picoxr.com/document/discover/pico-os-6-overview/) devices, a Web App can also [run independently](https://developer.picoxr.com/document/web/install-free/) outside the browser without being installed, and WebSpatial effects are enabled automatically.

The second is app-store distribution, where users discover the app in an app store, install it first, and then use it.

Publishing to the visionOS App Store requires using the [`publish` command](../api/builder/publish.md) from [WebSpatial Builder](../concepts/webspatial-app.md#webspatial-builder) to generate the app bundle and upload it automatically to App Store Connect. This requires some [extra parameters and registration steps](../how-to/app-store-connect.md).

The [PICO app store](https://developer.picoxr.com/document/distribute/) supports publishing a Web App directly by submitting a URL, without packaging and uploading it through WebSpatial Builder first. However, at the current stage, the PICO developer platform does not yet provide self-service Web App submission, so Web Apps must be published to the PICO app store through PICO's business partnership channels.
