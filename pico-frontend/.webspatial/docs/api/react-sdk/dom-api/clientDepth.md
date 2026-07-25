<!--
sidebar_position: 3
description: 'Read the current rendered depth of a 3D container element in pixels.'
-->

# `clientDepth`

## Summary

Reads the current depth of a [3D container element](../../../concepts/3d-content-containers.md).

## Exposed On

In the current implementation of the [WebSpatial SDK](../../../introduction/getting-started.md#webspatial-sdk), this property is only available on `ref.current` for 3D container elements.

## Mental Model

Like `Element.clientWidth`: read-only and unaffected by [CSS Transform](../css-api/transform.md).

## Syntax

> [!CAUTION]
> **Temporary prefixed DOM name**
>
> Before standardization is complete, DOM properties in the WebSpatial API need the `xr` prefix and the original first letter becomes uppercase, so `clientDepth` must be written as `xrClientDepth`.

## Read / Write Semantics

Read-only.

Example:

```js
const currentDepth = ref.current.xrClientDepth;
```

## Fallback Behavior

In environments that do not support WebSpatial, `clientDepth` does not exist.
