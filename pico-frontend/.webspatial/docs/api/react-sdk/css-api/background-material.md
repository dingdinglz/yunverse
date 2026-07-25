<!--
sidebar_position: 3
description: 'Give scene and element backplates a transparent or real-time translucent material background.'
-->

# `background-material`

## Summary

`background-material` is a new CSS property added by WebSpatial on top of existing Web standards. It allows both [webpage windows floating in space](../../../concepts/spatial-scenes.md) and [spatialized HTML elements](../../../concepts/spatialized-html-elements.md) to be fully transparent or to use a real-time rendered translucent material as their background, instead of being limited to fixed opaque colors.

## Applies To

The current WebSpatial SDK only supports `background-material` on the HTML element that represents the webpage window itself, and on 2D HTML elements [marked as spatialized HTML elements](../react-components/jsx-marker.md), excluding [3D container elements](../../../concepts/3d-content-containers.md).

## Mental Model

When the value of `background-material` is `none`:

The webpage window keeps its default opaque fixed-color backplate.

Spatialized HTML elements keep their default state with no backplate.

When the value of `background-material` is `transparent`:

For the webpage window, this removes the original opaque fixed-color backplate and makes it fully transparent with no border, so the elements inside the webpage appear to float separately in space.

For spatialized HTML elements, this is equivalent to keeping the default no-backplate state.

When the value of `background-material` is a translucent material such as `translucent`:

For the webpage window, this replaces the original opaque fixed-color backplate with a translucent material backplate rendered dynamically in real time according to the viewpoint and environment.

For spatialized HTML elements, this adds such a translucent material backplate.

## Syntax

> [!CAUTION]
> **Temporary prefixed CSS name**
>
> Before standardization is complete, CSS properties in the WebSpatial API need the `-xr-` prefix.
> In the current implementation of WebSpatial SDK, for performance reasons, new CSS APIs are implemented through CSS custom properties, so the property name for `background-material` must be written as `--xr-background-material` both in CSS styles and in the `style` attribute.

Example for the webpage window:

```css
html {
  --xr-background-material: transparent;
}
```

Example for a spatialized HTML element:

```css
div {
  position: absolute;
  --xr-back: 100px;
  --xr-background-material: translucent;
}
```

## Value Grammar

`background-material` takes an enum value:

- `translucent`
- `transparent`
- `none`

## Initial Value

The initial value is effectively:

```css
--xr-background-material: none;
```

## Inherited

Child elements do not inherit the `background-material` property of their parent element.

## Fallback Behavior

In environments that do not support WebSpatial, `background-material` is ignored automatically.
