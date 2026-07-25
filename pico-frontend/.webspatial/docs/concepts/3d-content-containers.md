<!--
sidebar_position: 5
description: 'Explore the 2D containing 3D model, static and dynamic 3D containers, and the local 3D spaces they create.'
-->

# 3D Content Containers

Existing HTML elements can only display content in 2D planes. Even the WebGL-based `<canvas>` element and the new `<model>` element can only render 3D content inside a flat canvas. From the perspective of [spatial computing](./spatial-computing.md), they are still part of 2D content.

Although the WebXR API can render volumetric 3D content in 3D space with WebGL, that content [can only be displayed inside a WebXR session](./webspatial-app.md) and cannot participate in the HTML/CSS system as a 3D HTML element or be displayed directly in a Web App.

The [WebSpatial API](../introduction/getting-started.md#webspatial-api) adds two real 3D HTML elements on top of existing HTML standards. These elements are both [spatialized HTML elements](./spatialized-html-elements.md). They are used as floating 2D planes in space, continue to participate in the HTML/CSS layout system, and have the same capabilities and usage patterns as spatialized 2D HTML elements. In addition, they can render truly volumetric 3D content in the local space in front of their 2D plane using a [3D development paradigm](#3d-engine-api), support [unified rendering](./spatial-computing.md#unified-rendering), and let 3D content [coexist and integrate with 2D content](#2d-containing-3d).

In addition to using existing Web standards to determine the width and height of the 2D plane, 3D container elements can also use the new WebSpatial CSS property [`depth`](../api/react-sdk/css-api/depth.md) to set the depth of the local 3D space in front of the 2D plane, and can use the new DOM API [`clientDepth`](../api/react-sdk/dom-api/clientDepth.md) to query the current depth.

The [WebSpatial SDK](../introduction/getting-started.md#webspatial-sdk) provides these two 3D container elements as React components.

## Static 3D Containers

The first kind of 3D container element is [`<Model>`](../api/react-sdk/react-components/Model.md). It renders static 3D content from prebuilt 3D model files in the local space in front of the 2D plane. "Static" means that while APIs can control playback of animations embedded in the model file and adjust how the model file is rendered inside this local space, application code cannot dynamically render arbitrary 3D content at runtime.

## Dynamic 3D Containers

The second kind of 3D container element is [`<Reality>`](../api/react-sdk/react-components/Reality.md). It can dynamically render arbitrary 3D content in the local space in front of the 2D plane using a [3D Engine API](#3d-engine-api) that supports unified rendering.

## 3D Engine API

For the [spatial computing](./spatial-computing.md) operating system and the [Spatial Runtime](./spatial-computing.md#spatial-runtime) to understand the 3D content inside a dynamic 3D container and perform [unified rendering](./spatial-computing.md#unified-rendering) together with other 2D and 3D content in space, arbitrary Web 3D engines built directly on WebGL/WebGPU or other low-level 3D graphics APIs cannot be used directly inside the dynamic 3D container's content.

WebSpatial API includes a built-in declarative 3D engine API that combines ECS style and HTML style and supports unified rendering.

This API provides a variety of ready-to-use [3D Entities](../api/react-sdk/react-components/Reality.md#3d-entity) in the form of HTML elements. Their underlying implementations include different built-in Component capabilities based on an ECS architecture, where "Component" refers to the ECS concept rather than a UI component. These capabilities are configured through HTML attributes, such as referencing [predeclared 3D assets](../api/react-sdk/react-components/Reality.md#3d-assets) or setting dimensions for [primitive entities](../api/react-sdk/react-components/Reality.md#primitive-entities).

These HTML elements can only be used inside [`<World>` as the Scene Graph root node](../api/react-sdk/react-components/Reality.md#scene-graph) in a dynamic 3D container. They do not support CSS or the 2D layout system. Instead, they use [Transform props](../api/react-sdk/react-components/Reality.md#3d-entity) from the 3D engine system to render inside a 3D coordinate system.

These 3D Entities can not only be integrated into the 2D layout system and HTML/CSS content through dynamic 3D containers, but can also [attach HTML/CSS content onto the entity itself](../api/react-sdk/react-components/Reality.md#attachment-entity), letting 2D content enter the 3D rendering system as well.

These [HTML elements used inside `<Reality>`](../api/react-sdk/react-components/Reality.md) are also provided as React components in the [WebSpatial SDK](../introduction/getting-started.md#webspatial-sdk).

## 2D containing 3D

3D container elements act like a bridge between the CSS-based 2D layout system outside the container and the 3D rendering system based on a 3D engine inside the container, creating the new "2D containing 3D" paradigm:
The entire WebSpatial App can be developed as a 2D Web App by default, using mainstream 2D Web frameworks such as React and mainstream Web APIs based on HTML/CSS. Only the local regions that truly need 3D content use the 3D-engine development paradigm on demand. The rendering performed by the 3D engine can also be integrated into the 2D rendering system, because the HTML-style 3D engine APIs provided by WebSpatial SDK can initialize and update 3D content through React's rendering model.

The [Spatial Scene](./spatial-scenes.md), [spatialized HTML elements](./spatialized-html-elements.md) in a WebSpatial App, including the results of [spatial events](./natural-interactions.md#spatial-interactions) triggered on those elements, and HTML/CSS-based 2D content all belong to the 2D development paradigm. They use a left-handed coordinate system, with the origin at the top-left corner of the 2D plane, Y pointing downward, Z pointing toward the user, and lengths expressed by default in the GUI-oriented point unit (`px`).

The 3D content inside a 3D container element uses the 3D development paradigm. It uses a right-handed coordinate system, with the origin at the center of the local 3D space corresponding to the container, Y pointing upward, Z pointing toward the user, and lengths expressed by default in physical world units (`m`) oriented toward real-world objects.

Because all of this content is [rendered in a unified way](./spatial-computing.md#unified-rendering) by the [Spatial Runtime](./spatial-computing.md#spatial-runtime), these coordinate systems and units can be converted freely, allowing 2D-paradigm content and 3D-paradigm content to work together, for example by aligning in space, following automatically, or interacting with each other.

WebSpatial SDK provides this capability through the [unit conversion](../api/react-sdk/js-api/useMetrics.md) and [coordinate conversion](../api/react-sdk/js-api/convertCoordinate.md) APIs exported by its npm package.
