<!--
sidebar_position: 2
description: 'Apply true 3D translation, rotation, and scale to spatialized HTML elements and 3D containers.'
-->

# Spatial Transform

## Summary

WebSpatial makes the existing CSS Transform in Web standards produce true 3D spatial transform effects, including translation, rotation, and scale, on [spatialized HTML elements](../../../concepts/spatialized-html-elements.md), instead of effects projected onto a 2D plane.

## Applies To

When using Spatial Transform on an HTML element through the [WebSpatial SDK](../../../introduction/getting-started.md#webspatial-sdk), the element must be [marked as a spatialized HTML element](../react-components/jsx-marker.md).

[3D container elements](../../../concepts/3d-content-containers.md), namely [`<Model>`](../react-components/Model.md) and [`<Reality>`](../react-components/Reality.md), are also [spatialized HTML elements](../../../concepts/spatialized-html-elements.md), so they can use Spatial Transform as a 2D plane as well, effectively the backplate of the 3D container.

## Mental Model

Spatial Transform preserves the existing characteristics of CSS Transform. It does not change the element's actual position in HTML/CSS layout, but only changes its visual appearance through translation, rotation, scaling, and similar transforms.

For that reason, Spatial Transform also does not change the [local coordinate system](../js-api/convertCoordinate.md) corresponding to a spatialized HTML element. The local coordinate system is determined only by the element's layout position.

## Syntax

`transform: perspective()` is no longer needed and is ignored.

In the current implementation of WebSpatial SDK, spatialized HTML elements already have [special markers](../react-components/jsx-marker.md), and CSS Transform on spatialized HTML elements can only produce spatial transform effects rather than 2D projection mode, so `transform-style` is no longer needed and is ignored.

All other Spatial Transform syntax is the same as CSS Transform. It supports the `transform` and `transform-origin` properties.

WebSpatial SDK currently supports these transform functions:

- `translateZ()` and `translate3d()`: translate along the Z axis perpendicular to the webpage plane
- `rotateX()`, `rotateY()`, `rotateZ()`, and `rotate3d()`: rotate the element's corresponding 2D plane around the X/Y axes, pushing part of the plane into 3D space
- `scaleZ()` and `scale3d()`: if the element's 2D plane has partly entered 3D space because of rotation, scaling along the Z axis changes the size of those parts in space

Spatial Transform reuses and enhances CSS Transform without adding any new API, so it does not need the [`-xr-` prefix](./back.md#syntax).

Example:

```css
.list-menu {
  position: fixed;
  top: 200px;
  left: 0;
  transform-origin: top left;
  transform: translateZ(320px) rotateY(80deg);
}
```

## Value Grammar

In the current implementation of WebSpatial SDK, translate values in Spatial Transform only support `px` as the unit, which is equivalent to the point unit used by 2D GUI. See the [unit conversion API](../js-api/useMetrics.md). Precision is allowed up to one decimal place.

## Initial Value

The initial value is effectively:

```css
transform: none;
```

or:

```
transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
```

## Inherited

Child elements do not inherit the `transform` property of their parent element.

However, like CSS Transform, if a parent spatialized HTML element uses Spatial Transform, and a child spatialized HTML element also uses Spatial Transform, the child's transform is applied relative to its own visually transformed position after following the parent's transform.

## Animatable

In the current implementation of WebSpatial SDK, Spatial Transform properties are not yet supported inside CSS animations.

> [!CAUTION]
> **Current limitation**
>
> Spatialized HTML elements as a whole do not currently support CSS animations.

Spatial Transform does support JS-based animation approaches, where JS repeatedly updates the Spatial Transform value in an element's `style`.

JSX API example:

```js
export default function Demo({ animatedOffsetZ, animatedOffsetX }) {
  return (
    <div
      style={{
        transform: `translateZ(${animatedOffsetZ}) translateX(${animatedOffsetX})`,
      }}></div>
  );
}
```

DOM API example:

```js
ref.current.style.transform = `translateZ(${animatedOffsetZ})`;
```

## Interaction with Other CSS APIs

If a spatialized HTML element [uses `back` to change its layout position on the Z axis](./back.md), the `translateZ` in Spatial Transform further shifts the element's visual position along the Z axis relative to that Z-axis layout position.

## DOM and JS Reflection

Because Spatial Transform does not change an element's layout position and does not change the [local coordinate system](../js-api/convertCoordinate.md) corresponding to a spatialized HTML element, it also does not affect the local-coordinate position information, such as `offsetX` and `offsetZ`, returned by spatial interaction events [`SpatialTapEvent`](../event-api/spatial-tap.md) and [`SpatialDragStartEvent`](../event-api/spatial-drag.md) triggered on that element, and it does not affect the results of converting between local and global coordinate systems with [`convertCoordinate`](../js-api/convertCoordinate.md).

After obtaining a ref for an element, you can directly read and write the `transform` value in `style`:

```js
const currentOffsetZ =
  ref.current.style.transform.match(/translateZ\(([^)]+)\)/)?.[1] ?? "0px";
```

## Fallback Behavior

In environments that do not support WebSpatial, Spatial Transform styles fall back to ordinary CSS Transform behavior.
