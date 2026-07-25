<!--
sidebar_position: 6
description: 'Understand gaze, pinch, touch, and the spatial events WebSpatial exposes for natural interaction.'
-->

# Natural Interactions

Natural interactions mean that when users interact with software interfaces and virtual content in space, the interaction feels like manipulating real objects in the physical world. No control device such as an XR controller is used. Interaction relies only on hands and eyes in an intuitive and efficient way.

There are two modes of natural interaction:

1. Direct interaction: the most intuitive mode, where one or both hands directly touch virtual content elements.
2. Indirect interaction: a more efficient mode that does not require raising a hand to touch. The user first "selects" a virtual content element by looking at it, then pinches fingers together to "confirm". Keeping the pinch held can continue into gestures such as drag, rotate, or magnify.

## 2D Content Interactions

For 2D content, these two natural interaction modes are equivalent in effect. They are both equivalent to touch interaction on traditional screen devices. Performing direct interaction on an HTML element, where a finger directly touches it, or indirect interaction, where the user first looks at it and then pinches fingers together, both trigger Touch Events and Pointer Events. To remain compatible with older webpage code, Mouse Events and `click` are also triggered. The behavior of these Web APIs is completely equivalent to touch interaction on webpages on traditional screen devices.

Taking indirect interaction as an example:

1. Before the fingers pinch together, moving the gaze position does not trigger any JS events or CSS hover state. This is equivalent to the state in touch interaction before a finger touches the screen, where webpage code has no knowledge of what the user is doing.
2. When the fingers pinch and then immediately release, the following JS events are triggered in order:
   1. At the moment of pinch, the "contact" event (`pointerover`), the "enter" event (`pointerenter`), and the "down" event (`pointerdown`) are triggered at the same time. Only at the moment of pinch can the webpage obtain the interaction target and interaction position from these events, meaning it only then learns where the user is looking.
   2. Next, the "touch start" event (`touchstart`) is triggered.
   3. At the moment the fingers release, the "out" event (`pointerout`), the "leave" event (`pointerleave`), and the "up" event (`pointerup`) are triggered at the same time.
   4. Next, the "touch end" event (`touchend`) is triggered.
   5. To remain compatible with older webpage code, a series of mouse events is then simulated, including the "contact" event (`mouseover`), the "enter" event (`mouseenter`), the "move" event (`mousemove`), the "down" event (`mousedown`), and the "up" event (`mouseup`). CSS hover state is also triggered. Because this state is simulated, it is only cleared after interacting with another element.
   6. Finally, the "click" event (`click`) is triggered.
3. If the fingers pinch and are not released, movement while the pinch is held continuously triggers the following events after `touchstart`, until the fingers are released:
   1. The "move" event (`pointermove`), where finger movement corresponds to movement relative to the initial interaction position
   2. The "touch move" event (`touchmove`)

## Hover Effect

In indirect interaction mode, before the fingers pinch, the webpage does not know where the user is looking, so it cannot trigger any JS events or change any CSS state. That means a hover effect cannot be implemented in webpage code. Instead, the [Spatial Runtime](./spatial-computing.md#spatial-runtime) must take unified responsibility for automatically rendering hover effects on the HTML element being looked at.

To do this, the [Spatial Runtime](./spatial-computing.md#spatial-runtime) needs to know which "Interactive Regions" are currently visible in the webpage.

Any HTML element that would make the mouse pointer change to the pointer cursor in a desktop browser is automatically recognized as an Interactive Region, including:

1. Link elements (`<a>`)
2. Interactive form elements (`<button>`, `<input>`, `<select>`, etc.)
3. Elements made semantically equivalent to the elements above through Web standard accessibility APIs (ARIA), such as `<div role="button">`
4. HTML elements that explicitly set the mouse pointer to the pointer cursor through the CSS style `cursor: pointer`

## Spatial Interactions

Unlike flat 2D content, all [spatialized HTML elements](./spatialized-html-elements.md) are treated as 2D planes floating in space. They can be [positioned and moved](../api/react-sdk/css-api/back.md) along the X, Y, and Z axes in 3D space, can [rotate](../api/react-sdk/css-api/transform.md) in space, and their interactive hit targets are no longer points on a plane but points on 2D planes and [3D meshes](./3d-content-containers.md) in space.

Existing JS interaction events in Web standards can only hit the point where these spatial objects or 3D content project onto a 2D plane, and can only provide X/Y positions. They cannot support interaction within a 3D spatial range.

For that reason, the [Spatial Runtime](./spatial-computing.md#spatial-runtime) defines and implements new spatial gestures in a unified way. The [WebSpatial SDK](../introduction/getting-started.md#webspatial-sdk) currently supports four spatial gestures: tap, drag, rotate, and magnify:

| Type                                                             | Event Name                                              | React API                                                     | Event Results                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [Spatial Tap](../api/react-sdk/event-api/spatial-tap.md)         | `spatialtap`                                            | `onSpatialTap`                                                | `SpatialTapEvent`                                                      |
| [Spatial Drag](../api/react-sdk/event-api/spatial-drag.md)       | `spatialdragstart`<br />`spatialdrag`<br />`spatialdragend` | `onSpatialDragStart`<br />`onSpatialDrag`<br />`onSpatialDragEnd` | `SpatialDragStartEvent`<br />`SpatialDragEvent`<br />`SpatialDragEndEvent` |
| [Spatial Rotate](../api/react-sdk/event-api/spatial-rotate.md)   | `spatialrotate`<br />`spatialrotateend`                   | `onSpatialRotate`<br />`onSpatialRotateEnd`                     | `SpatialRotateEvent`<br />`SpatialRotateEndEvent`                        |
| [Spatial Magnify](../api/react-sdk/event-api/spatial-magnify.md) | `spatialmagnify`<br />`spatialmagnifyend`                 | `onSpatialMagnify`<br />`onSpatialMagnifyEnd`                   | `SpatialMagnifyEvent`<br />`SpatialMagnifyEndEvent`                      |
