<!--
sidebar_position: 1
description: 'Configure the Start Scene from the Web App Manifest before any page code runs.'
-->

# `main_scene`

In the [Web App Manifest](../../../concepts/webspatial-app.md#web-app) of a [WebSpatial App](../../../concepts/webspatial-app.md), this new field can be used to configure the [initialization properties](../../../concepts/spatial-scenes.md#scene-initialization) of the [Start Scene](../../../concepts/spatial-scenes.md#start-scene).

> [!CAUTION]
> **Temporary prefixed manifest key**
>
> Because this is a new property added by WebSpatial API to the Web App Manifest standard, it needs the `xr_` prefix before standardization is complete, so `main_scene` must be written as `xr_main_scene`.

The following initialization properties are supported:

- [`type`](../scene-options/type.md)
- [`default_size`](../scene-options/defaultSize.md)
- [`resizability`](../scene-options/resizability.md)
- [`world_scaling`](../scene-options/worldScaling.md)
- [`world_alignment`](../scene-options/worldAlignment.md)
- [`baseplate_visibility`](../scene-options/baseplateVisibility.md)

## Schema

```ts
{
  type?: "volume" | "window"
  default_size?: {
    width?: number | string
    height?: number | string
    depth?: number | string
  }
  resizability?: {
    min_width?: number | string
    max_width?: number | string
    min_height?: number | string
    max_height?: number | string
  }
  world_scaling?: "automatic" | "dynamic"
  world_alignment?: "automatic" | "gravityAligned"
  baseplate_visibility?: "automatic" | "hidden"
}
```

Example:

```json
{
  "name": "example app",
  "start_url": "/",
  "xr_main_scene": {
    "type": "volume",
    "default_size": {
      "width": 100,
      "height": 100,
      "depth": "1m"
    },
    "resizability": {
      "min_width": 50,
      "max_width": 500,
      "min_height": 50,
      "max_height": 500
    },
    "world_scaling": "dynamic",
    "world_alignment": "gravityAligned",
    "baseplate_visibility": "hidden"
  }
}
```
