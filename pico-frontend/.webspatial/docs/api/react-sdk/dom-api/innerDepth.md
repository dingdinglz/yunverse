<!--
sidebar_position: 4
description: 'Read the current depth of a volume Spatial Scene through the DOM interface.'
-->

# `innerDepth`

## Summary

Reads the depth/thickness of a [Spatial Scene container of type Volume](../../../concepts/spatial-scenes.md).

## Exposed On

This property is available on the `window` object.

## Mental Model

Like `window.innerHeight`: read-only and does not include the height of native window UI outside the webpage.

## Syntax

> [!CAUTION]
> **Temporary prefixed DOM name**
>
> Before standardization is complete, DOM properties in the WebSpatial API need the `xr` prefix and the original first letter becomes uppercase, so `innerDepth` must be written as `xrInnerDepth`.

## Read / Write Semantics

Read-only.

Example:

```js
const currentVolumeDepth = window.xrInnerDepth;
```

## Fallback Behavior

In environments that do not support WebSpatial, `innerDepth` does not exist.
