<!--
sidebar_position: 4
description: 'Learn how ordinary HTML elements become spatialized surfaces with Z-axis layout, transforms, and spatial state.'
-->

# Spatialized HTML Elements

Spatialized HTML elements are HTML elements that are not limited to the page plane and can enter the space in front of the webpage.

Most existing 2D HTML elements in Web standards can be [marked as spatialized HTML elements](../api/react-sdk/react-components/jsx-marker.md#enable-xr) through the [WebSpatial SDK](../introduction/getting-started.md#webspatial-sdk).

The [3D content container elements](./3d-content-containers.md) provided by WebSpatial SDK as React components are also spatialized HTML elements. The element itself is treated as a 2D plane and has the same characteristics and behavior as a spatialized 2D HTML element, while additionally rendering 3D content in the space in front of that 2D plane.

All spatialized HTML elements are effectively 2D planes floating in the space of a [Spatial Scene](./spatial-scenes.md). Even after leaving the webpage plane, they still participate in the overall HTML/CSS layout system of the page and keep their original place in the page plane. The width and height of these 2D planes, and their positions on the X and Y axes, are entirely determined by the existing HTML/CSS layout system. In effect, they stay synchronized with the place they occupy in the webpage plane.

> [!NOTE]
> **Transform does not change layout bounds**
>
> [CSS Transform](../api/react-sdk/css-api/transform.md) changes how spatialized HTML elements appear in position and size, but does not change their actual position and size in the layout system.

WebSpatial API only adds Z-axis-related CSS capabilities and DOM APIs for these spatialized HTML elements, allowing these 2D planes to be [laid out and positioned](../api/react-sdk/css-api/back.md) and [transformed](../api/react-sdk/css-api/transform.md) along the Z axis, and allowing their current related state to be [read](../api/react-sdk/dom-api/offsetBack.md).

> [!CAUTION]
> **Current limitation**
>
> For spatialized HTML elements whose 2D planes rotate or otherwise change in space because of [CSS Transform](../api/react-sdk/css-api/transform.md), WebSpatial SDK does not currently support using [`getBoundingClientRect()`](https://developer.mozilla.org/docs/Web/API/Element/getBoundingClientRect) to obtain their projected bounds, and also does not yet support using `getBoundingClientCube()`, newly added in WebSpatial API, to obtain their 3D bounding-box range in space.

These new Z-axis CSS/DOM APIs can be combined with existing X/Y-axis CSS/DOM APIs from Web standards.

Existing Web standard APIs such as `opacity`, `display: none`, and `visibility: hidden` continue to work on spatialized HTML elements.

Like a `window` Spatial Scene, a spatialized 2D HTML element can give itself a [real-time rendered translucent material backplate](../api/react-sdk/css-api/background-material.md), which can be combined with `border-radius`, or keep the default fully transparent state with no backplate, effectively `background: none`.

Because spatialized HTML elements are independent 2D planes in space, they are no longer affected by `z-index`. They will not be occluded by ordinary HTML elements, and can only be occluded by other spatialized HTML elements depending on parent-child nesting relationships and Z-axis positions.

Inside a spatialized 2D HTML element, other 2D elements or 3D container elements [marked as spatialized HTML elements](../api/react-sdk/react-components/jsx-marker.md#enable-xr) can be used as children. Unless the child element is set to `position: fixed`, the child's Z-axis position is [relative to the nearest spatialized HTML element in the parent chain](../api/react-sdk/css-api/back.md).
The rest of the content inside a spatialized 2D HTML element is still ordinary 2D HTML/CSS content, all located on the 2D plane corresponding to the nearest spatialized HTML element in the parent chain.

All spatialized HTML elements support the new [spatial interaction events](./natural-interactions.md#spatial-interactions). The [local coordinate system](./3d-content-containers.md#2d-containing-3d) used in event results is the coordinate system of the 2D plane corresponding to the spatialized HTML element, with the origin at the top-left corner and the same point unit (`px`) used by the 2D layout system.

For performance and complexity reasons, WebSpatial SDK only supports CSS updates in declarative code that follows the [Rules of React](https://react.dev/reference/rules), such as changing `className` or `style` in JSX. If you want to query the current state through DOM APIs, you need to use React's `useRef` to obtain the DOM object for the spatialized HTML element. Direct DOM queries through non-React approaches such as `querySelector` are not supported.

WebSpatial SDK does not currently support adding CSS properties of spatialized HTML elements into CSS animations. Only JS-based animation approaches are supported.
