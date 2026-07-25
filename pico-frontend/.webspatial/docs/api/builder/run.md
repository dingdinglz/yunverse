<!--
sidebar_position: 1
description: 'Launch a Packaged WebSpatial App in the simulator for local preview and debugging.'
-->

# `webspatial-builder run`

Used to preview a [Packaged WebSpatial App](../../concepts/webspatial-app.md#packaged-webspatial-app) in a simulator.
It automatically packages the app, launches the simulator, pushes the app bundle into the simulator, installs it, and starts it.

## Quick Reference

| Item | Value |
| --- | --- |
| Best for | Previewing a Packaged WebSpatial App in a simulator. |
| Requires device credentials | No. |
| Common target platform | Platforms without built-in WebSpatial Runtime, such as visionOS. |

## When to Use

- When you want to run a [WebSpatial App](../../concepts/webspatial-app.md) on a [spatial computing](../../concepts/spatial-computing.md) platform that does not include [WebSpatial Runtime](../../concepts/webspatial-app.md#webspatial-runtime), such as visionOS.
- When you only need to [preview the effect in a simulator](../../introduction/getting-started.md#preview), not on a real device.

## When Not to Use

- When you want to run on a [spatial computing](../../concepts/spatial-computing.md) platform that includes [WebSpatial Runtime](../../concepts/webspatial-app.md#webspatial-runtime) and supports running a [WebSpatial App](../../concepts/webspatial-app.md) directly by URL, such as [PICO OS 6](https://developer.picoxr.com/document/web/web-app/).
- When you need to [test on a real device](./build.md) or [distribute the app widely](./publish.md).

## Syntax

**Preview a Packaged WebSpatial App in a simulator**

```bash
webspatial-builder run \
  [--base=<base url>] \
  [--manifest=<local path>] \
  [--manifest-url=<url>] \
  [--project=<dist>]
```

## Option Overview

| Option | Required | What it controls |
| --- | --- | --- |
| `--base` | Optional | Provides or overrides the base URL used to resolve `start_url`. |
| `--manifest` | Optional | Points Builder at a local Web App Manifest file. |
| `--manifest-url` | Optional | Fetches the manifest directly from a live site URL. |
| `--project` | Optional | Points Builder at a custom website build output directory. |

## Options

### `--base`

Specifies the base URL for the start URL ([`start_url`](https://developer.mozilla.org/en-US/docs/Web/Manifest/start_url)) of the current [Web App](../../concepts/webspatial-app.md#web-app). The default value is `""`.

If WebSpatial Builder does not know the current Web App's `start_url`, the value of `--base` is used directly as `start_url`.

If the current Web App's `start_url` obtained by WebSpatial Builder is a [relative URL with no domain part](#--manifest), `--base` can provide the domain and complete the URL.

| Resolution state | Runtime behavior |
| --- | --- |
| A complete `start_url` is available | The Packaged App loads HTML/CSS/JS and other Web files from the network at runtime. |
| A complete `start_url` is missing | WebSpatial Builder packages the [website build output](../../concepts/webspatial-app.md#web-build-tool) into the native app bundle, and the app loads website files offline from local files inside the bundle at runtime. |

> [!TIP]
> **Prefer `--base` during development**
>
> During development and debugging, offline packaging means every code change requires rerunning Builder and waiting for packaging and installation to finish. It is recommended to provide `--base` whenever possible.

If WebSpatial Builder already has the complete `start_url` for the current Web App, `--base` can be used to change the base part of `start_url`.

### `--manifest`

Tells WebSpatial Builder which path in the current project contains the Web App Manifest file. By default it reads from `public/manifest.webmanifest` or `public/manifest.json`.

> [!IMPORTANT]
> **Fallback manifest during run**
>
> When running the `run` command, if the manifest cannot be found, WebSpatial Builder uses the following temporary manifest to reduce setup work in the early stage of project development:
>
> **Temporary manifest used by run**
>
> ```json5
> {
>   name: "WebSpatialTest",
>   display: "minimal-ui",
>   start_url: "/",
>   scope: "/",
> }
> ```

Fields such as `start_url` in a Web App Manifest are usually relative URLs and do not hardcode the domain or other base URL parts. That means WebSpatial Builder cannot determine how to access the current Web App by URL from the manifest file in the project repository alone. It needs [`--base` to obtain the domain and complete the URL](#--base). Otherwise, the generated Packaged App will contain all [website build output](../../concepts/webspatial-app.md#web-build-tool) and will not load the site from the network.

### `--manifest-url`

Tells WebSpatial Builder to fetch the Web App Manifest directly from the live site by URL.

Because this URL includes the domain and other base parts, even if fields such as `start_url` in the Manifest are relative URLs, WebSpatial Builder can infer and complete `start_url` automatically just like a browser. In this case, WebSpatial Builder effectively embeds the live Web App into the Packaged App by URL, so local project files and parameters such as [`--base`](#--base) are not required.

### `--project`

If WebSpatial Builder cannot determine how to access the current Web App by URL, it packages the [website build output](../../concepts/webspatial-app.md#web-build-tool) from `dist/` into the native app bundle by default.

You can use `--project` to make WebSpatial Builder read the website build output from a different path.
