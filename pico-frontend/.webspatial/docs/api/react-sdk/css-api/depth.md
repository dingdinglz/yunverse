<!--
sidebar_position: 4
description: 'Set the depth of 3D container elements so they render with real thickness in space.'
-->

# `depth`

## Summary

`depth` is a new CSS property added by WebSpatial on top of existing Web standards. It lets [3D container elements](../../../concepts/3d-content-containers.md) control not only width and height in CSS, but also "thickness/depth".

## Applies To

Only the static 3D container element [`<Model>`](../react-components/Model.md) and the dynamic 3D container element [`<Reality>`](../react-components/Reality.md) support this property.

## Mental Model

3D content container elements are also [spatialized HTML elements](../../../concepts/spatialized-html-elements.md). They still participate in HTML/CSS layout as 2D planes. The container's content is effectively a box-like local 3D space in front of the 2D plane. That local 3D space always uses the 2D plane as its "backplate", so its width and height are determined by the size of that backplate, while its depth defaults to the depth of the current [Spatial Scene](../../../concepts/spatial-scenes.md).

`width` and `height` in CSS affect the size of this backplate, the 2D plane, and therefore affect the width and height of the space inside the container.

The new `depth` property directly determines the depth of the local 3D space in front of the backplate.

Changing the depth of a 3D content container element also changes [the origin position of the internal 3D coordinate system, whose origin is the center point of the local 3D space corresponding to the container](../react-components/Reality.md#3d-entity).

## Syntax

> [!CAUTION]
> **Temporary prefixed CSS name**
>
> Before standardization is complete, CSS properties in the WebSpatial API need the `-xr-` prefix.
> In the current implementation of WebSpatial SDK, for performance reasons, new CSS APIs are implemented through CSS custom properties, so the property name for `depth` must be written as `--xr-depth` both in CSS styles and in the `style` attribute.

Examples:

```css
.product-preview {
  width: 100px;
  height: 100px;
  --xr-depth: 100px;
}
```

```js
export default function ProductPreview() {
  return (
    <Model
      style={{
        width: "100px",
        height: "100px",
        "--xr-depth": "100px",
      }}
      src="/assets/product.usdz"
    />
  );
}
```

```js
export default function ProductPreview() {
  return (
    <Reality
      style={{
        width: "1360px",
        height: "1360px",
        "--xr-depth": "1360px",
      }}>
      <World>
        <Box width="0.5" height="0.5" depth="0.5" />
      </World>
    </Reality>
  );
}
```

## Value Grammar

In the current implementation of WebSpatial SDK, `depth` only supports `px` as the unit, which is equivalent to the point unit used by 2D GUI. See the [unit conversion API](../js-api/useMetrics.md).

For numeric values, precision is allowed up to one decimal place.

## Initial Value

The initial value is effectively:

```css
--xr-depth: 0;
```

## Inherited

3D content container elements cannot use other 3D content container elements as children, so `depth` has no parent-child inheritance or interaction.

## Animatable

In the current implementation of WebSpatial SDK, `depth` is not yet supported inside CSS animations.

> [!CAUTION]
> **Current limitation**
>
> Spatialized HTML elements as a whole do not currently support CSS animations.

`depth` does support JS-based animation approaches, where JS repeatedly updates the `--xr-depth` value in an element's `style`.

JSX API example:

```js
export default function ProductPreview({ animatedWidth, animatedDepth }) {
  return (
    <Reality
      style={{
        width: animatedWidth,
        "--xr-depth": animatedDepth,
      }}>
      <World>
        <Box width="0.5" height="0.5" depth="0.5" />
      </World>
    </Reality>
  );
}
```

DOM API example:

```js
ref.current.style["--xr-depth"] = animatedDepth;
```

## Interaction with Other CSS APIs

`depth` can be combined with `width` and `height` to change the dimensions of the local 3D space corresponding to a 3D container element.

## DOM and JS Reflection

The new DOM API [clientDepth](../dom-api/clientDepth.md) can be used to obtain the current depth of a 3D container element.

After [`<Reality>`](../react-components/Reality.md) changes depth through `depth`, the origin of its [local coordinate system](../js-api/convertCoordinate.md) moves accordingly along the Z axis in the global coordinate system. For example, if depth increases by 10px, the origin moves forward by 5px.
Therefore, `depth` affects the results of converting between the local and global coordinate systems with [`convertCoordinate`](../js-api/convertCoordinate.md), and also affects the rendering of 3D content inside `<Reality>`.

## Fallback Behavior

In environments that do not support WebSpatial, `depth` is ignored automatically.
