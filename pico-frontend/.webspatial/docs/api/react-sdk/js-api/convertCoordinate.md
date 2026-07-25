<!--
sidebar_position: 3
description: 'Convert points between the local and global coordinate systems used by scenes and spatial content.'
-->

# `convertCoordinate`

## Summary

Converts coordinates between [different coordinate systems](../../../concepts/3d-content-containers.md#2d-containing-3d), including:

- The global coordinate system of a [Spatial Scene container](../../../concepts/spatial-scenes.md): based on the 2D layout system, using a left-handed coordinate system, with the origin at the top-left corner of the backplate, Y pointing downward, Z pointing toward the user, and lengths expressed by default in the GUI-oriented point unit (`px`)
- The local coordinate system of a [spatialized HTML element](../../../concepts/spatialized-html-elements.md): based on the 2D layout system, using a left-handed coordinate system, with the origin at the top-left corner of the 2D plane, Y pointing downward, Z pointing toward the user, and lengths expressed by default in the GUI-oriented point unit (`px`)
- The local coordinate system of a [3D entity](../react-components/Reality.md#3d-entity): based on the 3D engine system, using a right-handed coordinate system, with the origin at the center point of the local 3D space corresponding to the 3D content container, Y pointing upward, Z pointing toward the user, and lengths expressed by default in the physical world unit (`m`) oriented toward real-world objects

## Signature

```js
import { convertCoordinate } from "@webspatial/react-sdk";

const e2e = await convertCoordinate(position, {
  from: elementOrEntity,
  to: elementOrEntity,
});
const e2w = await convertCoordinate(position, {
  from: elementOrEntity,
  to: window,
});
const w2e = await convertCoordinate(position, {
  from: window,
  to: elementOrEntity,
});
```

## Parameters

### position

```ts
type CoordinateLike = { x: number; y: number; z: number };
```

The position point to convert.
This position must use the coordinate values and default unit of the coordinate system specified by `options.from`.

### options

- `options.from`: source coordinate system
- `options.to`: target coordinate system

## Return Shape

```ts
Promise<CoordinateLike>;
```

Returns a Promise that resolves to the converted coordinate point.
