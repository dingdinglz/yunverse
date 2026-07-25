<!--
sidebar_position: 3
description: 'Render dynamic 3D content inside a spatialized container with the unified-rendering engine API.'
-->

# `<Reality>`

## Overview

Like [`<Model>`](./Model.md), which is also a [3D content container element](../../../concepts/3d-content-containers.md), `<Reality>` has the capabilities of a [spatialized HTML element](../../../concepts/spatialized-html-elements.md). It is used as a 2D plane floating in space and participates in HTML/CSS layout. The difference is that `<Reality>` is a [dynamic 3D content container](../../../concepts/3d-content-containers.md#dynamic-3d-containers). Its 3D content is not implemented with prebuilt static 3D model files. Instead, arbitrary 3D content can be rendered dynamically in the local space in front of the 2D plane through a [3D Engine API](../../../concepts/3d-content-containers.md#3d-engine-api) that supports unified rendering.

These 3D engine APIs are provided by WebSpatial SDK as React components:

```js
import {
  Reality,
  Material,
  ModelAsset,
  AttachmentAsset,
  World,
  Entity,
  Box,
  Sphere,
  Plane,
  Cone,
  Cylinder,
  ModelEntity,
  AttachmentEntity,
} from "@webspatial/react-sdk";
```

```js
<Reality style={{ width: "500px", height: "500px", "--xr-depth": 100 }}>
  <Material type="unlit" id="red" color="#ff0000" />
  <ModelAsset id="teapot" src="https://example.com/model.usdz" />
  <World>
    <Box materials={["red"]} width={0.2} height={0.2} depth={0.2} />
  </World>
</Reality>
```

## Scene Graph

These 3D engine APIs include two categories:

The first is [3D Entity](#3d-entity). These React components can only be used inside `<World>`, which can also be written as `<SceneGraph>`. `<World>` is the root node of all 3D content inside a dynamic 3D container.

The second is [3D asset declarations](#3d-assets), such as `<Material>`. These React components can only be used as top-level children of `<Reality>`, outside `<World>`, and only affect actual rendering when referenced by a 3D Entity.

## 3D Assets

The following 3D asset declarations can appear among the top-level children of `<Reality>`:

1. Predeclared materials can be referenced.

```js
<Reality>
  <Material type="unlit" id="solid" color="#00ff00" />
  <Material type="unlit" id="glass" color="#0000ff" transparent opacity={0.5} />
  <World>
```

2. 3D model files can be declared.

```js
<Reality>
  <ModelAsset
    id="ship-blueprint"
    src="https://example.com/fighter.usdz"
    onLoad={() => {}}
    onError={() => {}} />
  <World>
```

3. 2D HTML/CSS content to be attached onto an Entity can be declared.

```js
<Reality>
  <AttachmentAsset name="info">
    <div style={{ width: '100%' }}>
      <p>Some text</p>
    </div>
  </AttachmentAsset>
  <World>
```

## 3D Entity

3D Entity components do not participate in HTML layout. They are rendered only inside the `<Reality>` container according to the 3D engine system. They do not support CSS styles. Instead, they use "Transform props" from the 3D engine system:

```js
<Entity
  // Position: x (left/right), y (down/up), z (away/toward)
  position={{ x: 0.1, y: -0.2, z: 0.3 }}

  // Rotation: radians (Math.PI = 180°)
  rotation={{ x: 0, y: Math.PI / 2, z: 0 }}  // 90° on Y-axis

  // Scale: 1 = normal, 2 = double, 0.5 = half
  scale={{ x: 1, y: 2, z: 1 }}  // stretched vertically
  >
```

Transform props use the coordinate system of the local 3D space in front of the 2D plane corresponding to `<Reality>` by default, with the origin at the center point of that space. It uses a right-handed coordinate system, with Y pointing upward, Z pointing toward the user, and lengths expressed by default in the physical world unit (`m`) oriented toward real-world objects.

> [!TIP]
> **Related APIs**
>
> The depth of this space can be set with [`depth`](../css-api/depth.md) and the current depth can be queried with [`clientDepth`](../dom-api/clientDepth.md).

For Entity nodes directly under `<World>`, the `position` value in Transform props is relative to the coordinate-system origin. For other Entity nodes used as children, the `position` value in Transform props is relative to the parent Entity's `position`.

The ready-to-use [Entities](../../../concepts/3d-content-containers.md#3d-engine-api) currently provided by WebSpatial SDK fall into the following categories:

### Base Entity

`<Entity>` is invisible and is used as a parent component and group container for other Entities. You can use it to include multiple Entities in one group.

```js
<Reality>
  <World>
    <Entity position={{ x: 1, y: 0, z: 0 }}>
      <Box />
      <Box />
    </Entity>
    <Box position={{ x: 2, y: 0, z: 0 }} />
  </World>
```

### Primitive Entities

Primitive entities include the following geometric shapes, each with its own additional props:

- `<Box>`
  - props: `width`, `height`, `depth`, `cornerRadius`
- `<Plane>`
  - props: `width`, `height`, `cornerRadius`
- `<Sphere>`
  - props: `radius`
- `<Cone>`
  - props: `height`, `radius`
- `<Cylinder>`
  - props: `height`, `radius`

Example:

```js
<Box
  width={0.2}
  height={0.2}
  depth={0.2} // meters (0.1 = 10cm)
  cornerRadius={0.01} // rounded edges
/>
```

All of these primitive entities support the `materials` prop, which can reference [predeclared materials](#3d-assets).

```js
<Reality>
  <Material type="unlit" id="solid" color="#00ff00" />
  <Material type="unlit" id="glass" color="#0000ff" transparent opacity={0.5} />
  <World>
    <Box
      width={0.2}
      height={0.2}
      depth={0.2} // meters (0.1 = 10cm)
      materials={["glass"]}
      cornerRadius={0.01} // rounded edges
    />
  </World>
</Reality>
```

### Model Entity

`<ModelEntity>` is an Entity that renders content from a prebuilt 3D model file.

Using a "spaceship fleet" as an example: download and load the spaceship model into memory once, then reference it to create three separate Model Entities and render three spaceships:

```js
import { Reality, World, ModelAsset, ModelEntity } from "@webspatial/react-sdk";

function SpaceshipFleet() {
  return (
    <Reality style={{ width: "100%", height: "500px" }}>
      {/* --- 1. THE RESOURCE --- */}
      {/* This downloads the file once. It is INVISIBLE right now. */}
      <ModelAsset
        id="ship-blueprint"
        src="https://example.com/fighter-jet.usdz"
      />

      {/* --- 2. THE SCENE --- */}
      <World>
        {/* Leader Ship: Center, Normal Size */}
        <ModelEntity
          model="ship-blueprint" // Points to the ID above
          position={{ x: 0, y: 0, z: 0 }}
          scale={{ x: 1, y: 1, z: 1 }}
        />

        {/* Left Wingman: Moved left, slightly smaller */}
        <ModelEntity
          model="ship-blueprint" // Reuses the same loaded file!
          position={{ x: -0.5, y: -0.2, z: 0.3 }}
          scale={{ x: 0.8, y: 0.8, z: 0.8 }}
        />

        {/* Right Wingman: Moved right, slightly smaller */}
        <ModelEntity
          model="ship-blueprint" // Reuses the same loaded file
          position={{ x: 0.5, y: -0.2, z: 0.3 }}
          scale={{ x: 0.8, y: 0.8, z: 0.8 }}
        />
      </World>
    </Reality>
  );
}
```

For animation requirements, you can implement them by polling and updating Transform props with JS.
Example:

```js
const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });

useEffect(() => {
  let id;
  function animate() {
    setRotation(prev => ({ ...prev, y: prev.y + 0.02 }));
    id = requestAnimationFrame(animate);
  }
  animate();
  return () => cancelAnimationFrame(id);
}, []);

<Box rotation={rotation} />;
```

## Attachment Entity

`<AttachmentEntity>` is an Entity similar to `<Plane>`. It can reference [predeclared 2D HTML/CSS content](#3d-assets) and attach that content onto its own surface.

> [!CAUTION]
> **Current limitation**
>
> In a later version of WebSpatial SDK, `<AttachmentEntity>` will support `width` and `height` like `<Plane>` does, which it does not currently support, and full [Transform props](#3d-entity), whereas the current version only supports `position`. For now, you need to use the `size` prop to set the size, with the same `px` unit used by 2D content.

```js
<Reality>
  <AttachmentAsset name="info">
    <div style={{ width: "100%" }}>
      <p>Some text</p>
    </div>
  </AttachmentAsset>
  <World>
    <Box position={{ x: 0.5, y: -0.2, z: 0.3 }} />
    <Entity position={{ x: -0.5, y: -0.2, z: 0.3 }}>
      <AttachmentEntity
        attachment="info"
        position={{ x: 0, y: 0, z: 0 }}
        size={{ width: 100, height: 100 }}
      />
    </Entity>
  </World>
</Reality>
```
