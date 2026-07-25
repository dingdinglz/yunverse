<!--
sidebar_position: 2
description: 'Render a static 3D model inside a spatialized container using the Web-standard-inspired `<model>` API.'
-->

# `<Model>`

The `<Model>` component implements the [static 3D content container element](../../../concepts/3d-content-containers.md) in the WebSpatial API. This element is compatible with the API of the `<model>` element in Web standards, while also enhancing the standard capability so that the 2D plane corresponding to the element gains the capabilities of a [spatialized HTML element](../../../concepts/spatialized-html-elements.md), and the 3D model can render truly volumetric 3D content in the space in front of that 2D plane.

> [!IMPORTANT]
> **Behavior of the standard model element**
>
> In Web standards, the model element can only render a 3D model inside the element's own "canvas". That canvas looks like an opening, and the 3D content appears "inside" or "behind" that opening. See the [WebKit documentation](https://webkit.org/blog/17118/a-step-into-the-spatial-web-the-html-model-element-in-apple-vision-pro/) and [demo](https://webkit.org/demos/model-demos/index.html).

To enable this enhancement, add the [spatialized HTML element marker (`enable-xr`)](./jsx-marker.md#enable-xr) on `<Model>`:

```jsx
import { Model } from "@webspatial/react-sdk";

function Example() {
  return (
    <Model
      enable-xr
      src="/modelasset/vehicle.usdz"
      style={{ height: "200px", "--xr-depth": "100px" }}
    />
  );
}
```

## Fallback

If the `enable-xr` marker is not added, or if the current runtime environment does not have [WebSpatial Runtime](../../../concepts/webspatial-app.md#webspatial-runtime), the `<Model>` component automatically falls back to the `<model>` element from Web standards and is rendered by the browser engine. The browser engine on the current platform may not support this new standard yet. You can use `typeof HTMLModelElement !== "undefined"` for feature detection.

In the current version of WebSpatial SDK, `<Model>` supports the following model element APIs:

## Attributes

`src`

The URL of the 3D model to embed.

## Lifecycle Events

`onLoad`

Triggered when the 3D model has loaded successfully and is ready to display.

`onError`

Triggered when the model fails to load.

## JavaScript API

`currentSrc`

A read-only string that returns the URL of the currently loaded resource.

`ready`

This Promise resolves when the model source file has finished loading and processing.
If the source file cannot be fetched, or the file cannot be parsed as a valid 3D model resource, this Promise rejects.

`entityTransform`

A readable and writable `DOMMatrixReadOnly` representing the [relationship between the 3D model and the internal space of the 3D content container](https://github.com/immersive-web/model-element/blob/main/explainer.md#visual-presentation-control).

By default, the 3D model fills as much of `<Model>`'s width or height as possible while preserving its original proportions, so you can control the size of the 3D model by controlling the size of the 2D plane corresponding to `<Model>`.
