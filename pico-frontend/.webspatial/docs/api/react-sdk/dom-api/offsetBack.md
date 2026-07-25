<!--
sidebar_position: 2
description: 'Read how far a spatialized HTML element has moved forward from its original 2D position.'
-->

# `offsetBack`

## Summary

Reads how far a [spatialized HTML element](../../../concepts/spatialized-html-elements.md) has been "lifted" along the Z axis relative to its pre-spatialized position.

## Exposed On

In the current implementation of the [WebSpatial SDK](../../../introduction/getting-started.md#webspatial-sdk), this property is only available on `ref.current` for spatialized HTML elements.

## Mental Model

`offsetBack` is effectively the Z-axis distance between the current spatialized HTML element and the 2D plane corresponding to the nearest spatialized HTML element in the parent hierarchy, or the webpage itself if there is none. Before becoming spatialized, a spatialized HTML element necessarily sits on that 2D plane.

Like `HTMLElement.offsetHeight`: read-only and unaffected by [CSS Transform](../css-api/transform.md).

## Syntax

> [!CAUTION]
> **Temporary prefixed DOM name**
>
> Before standardization is complete, DOM properties in the WebSpatial API need the `xr` prefix and the original first letter becomes uppercase, so `offsetBack` must be written as `xrOffsetBack`.

## Read / Write Semantics

Read-only.

Example:

```js
const currentOffsetZ = ref.current.xrOffsetBack;
```

## Fallback Behavior

In environments that do not support WebSpatial, `offsetBack` does not exist.
