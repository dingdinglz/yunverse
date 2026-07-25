<!--
sidebar_position: 1
description: 'Lift an HTML element along the Z axis and position it in front of the page plane.'
-->

# `back`

## Summary

`back` is a new CSS property added by WebSpatial on top of existing Web standards. It provides the most basic layout capability in 3D space, allowing an HTML element to be "lifted" as a 2D plane into the space in front of the webpage plane.

## Applies To

When using `back` on an HTML element through the [WebSpatial SDK](../../../introduction/getting-started.md#webspatial-sdk), the element must be [marked as a spatialized HTML element](../react-components/jsx-marker.md).

[3D container elements](../../../concepts/3d-content-containers.md), namely [`<Model>`](../react-components/Model.md) and [`<Reality>`](../react-components/Reality.md), are also [spatialized HTML elements](../../../concepts/spatialized-html-elements.md), so they can use this property as a 2D plane as well, effectively the backplate of the 3D container.

It only applies to [positioned elements](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position) with `position: relative`, `position: absolute`, or `position: fixed`.

## Mental Model

Like `top`, `left`, `bottom`, and `right`, it is an [inset property](https://developer.mozilla.org/en-US/docs/Glossary/Inset_properties), but instead of affecting the HTML element's position on the X and Y axes, it affects the element's position on the Z axis. In effect, it positions the element along the Z axis that is perpendicular to the webpage plane, so the element floats as a 2D plane in the 3D space in front of the webpage plane.

After this 2D plane is "lifted", its X/Y position in space is still determined by the webpage's HTML/CSS layout system.

`back` represents the distance between this 2D plane and what lies "behind" it. Which 2D plane counts as "behind" depends on the value of `position`:

When `back` is used with `position: absolute`, it can be understood as positioning the current element relative to the 2D plane corresponding to the nearest [spatialized HTML element](../../../concepts/spatialized-html-elements.md) in the parent hierarchy. If there is no spatialized HTML element in the parent hierarchy, it is positioned relative to the 2D plane corresponding to the current webpage.
This is equivalent to positioning the current element relative to the 2D plane where the element originally existed.

> [!IMPORTANT]
> **Why this still matches existing Web standards**
>
> In Web standards, when inset properties are used with `position: absolute` or `position: fixed`, the element is positioned relative to the nearest [containing block](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/Containing_block#identifying_the_containing_block) in the parent hierarchy, which can be understood as the nearest element whose `position` is not `static`.
>
> Once an HTML element is marked as a spatialized HTML element, it automatically becomes a containing block, effectively as if it had `position: relative`.
>
> If there are other parent elements with `position: relative` between the current element and the nearest spatialized HTML element, those parent elements cannot "float" because they are not spatialized HTML elements, so they must remain on the 2D plane of the nearest spatialized HTML element. As a result, the final effect of `back` is still positioning relative to that 2D plane.

When `back` is used with `position: fixed`, the current element is always positioned relative to the [initial containing block](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/Containing_block#identifying_the_containing_block), which is the `<html>` element and effectively the 2D plane corresponding to the current webpage, and it does not move with page scrolling.

When `back` is used with `position: relative`, it can be understood as positioning the current element relative to the 2D plane where the element originally existed.

## Syntax

> [!CAUTION]
> **Temporary prefixed CSS name**
>
> Before standardization is complete, CSS properties in the WebSpatial API need the `-xr-` prefix.
> In the current implementation of WebSpatial SDK, for performance reasons, new CSS APIs are implemented through CSS custom properties, so the property name for `back` must be written as `--xr-back` both in CSS styles and in the `style` attribute.

Examples:

```css
p {
  position: absolute;
  left: 0;
  right: 0;
  --xr-back: 20px;
}
```

```css
.product-detail-info {
  border-radius: 50px;
  padding: 50px;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  --xr-back: 20px;
  margin: auto;
  width: 400px;
}
```

```css
.link-card {
  position: relative;
  --xr-back: 50px;
}
```

```js
export default function Demo() {
  return (
    <div
      style={{
        "--xr-back": "50px",
        left: "0",
      }}></div>
  );
}
```

## Value Grammar

In the current implementation of WebSpatial SDK, `back` only supports `px` as the unit, which is equivalent to the point unit used by 2D GUI. See the [unit conversion API](../js-api/useMetrics.md).

All of the following are `px` values:

```css
--xr-back: 20px;
--xr-back: 20;
```

For numeric values, precision is allowed up to one decimal place:

```css
--xr-back: 1px;
--xr-back: 0.5px;
```

## Initial Value

The initial value is effectively:

```css
--xr-back: 0;
```

## Inherited

Child elements do not inherit the `back` property of their parent element.

However, when used with `position: relative` or `position: absolute`, if a spatialized HTML element in the parent has been displaced along the Z axis because of `back`, child elements, including spatialized HTML elements, are displaced accordingly because they are positioned relative to the parent.

## Animatable

In the current implementation of WebSpatial SDK, `back` is not yet supported inside CSS animations.

> [!CAUTION]
> **Current limitation**
>
> Spatialized HTML elements as a whole do not currently support CSS animations.

`back` does support JS-based animation approaches, where JS repeatedly updates the `--xr-back` value in an element's `style`.

JSX API example:

```js
export default function Demo({ animatedOffsetZ, animatedOffsetX }) {
  return (
    <div
      style={{
        "--xr-back": animatedOffsetZ,
        left: animatedOffsetX,
      }}></div>
  );
}
```

DOM API example:

```js
ref.current.style["--xr-back"] = animatedOffsetZ;
```

## Interaction with Other CSS APIs

`back` is a layout property. Using `back` to "lift" an element means changing its layout position on the Z axis. [CSS Transform](./transform.md) further changes the rendered appearance of the element relative to that layout position without affecting its actual layout position.

`back` can be combined with `top`, `left`, `bottom`, and `right` to change the X, Y, and Z layout positions of the element's 2D plane in 3D space.

## DOM and JS Reflection

After an element is "lifted" with `back`, the new DOM API property [`offsetBack`](../dom-api/offsetBack.md) can be used to read the distance that the element has been lifted relative to the 2D plane where it originally existed.

The interaction position information relative to the global coordinate system (`clientZ`) returned by spatial interaction events [`SpatialTapEvent`](../event-api/spatial-tap.md) and [`SpatialDragStartEvent`](../event-api/spatial-drag.md) triggered on a 2D HTML element is also determined by `back`.

After obtaining a ref for an element, you can also directly read and write the `back` value in `style`:

```js
const currentOffsetZ = ref.current.style["--xr-back"];
```

## Fallback Behavior

In environments that do not support WebSpatial, `back` is ignored automatically.
