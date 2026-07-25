<!--
sidebar_position: 1
description: 'Handle completed tap interactions on spatialized elements and 3D content.'
-->

# Spatial Tap

## Summary

Represents a completed one-handed "select and activate" action on a target in space, whether the interaction is [performed through indirect "gaze + pinch" or direct touch](../../../concepts/natural-interactions.md).

## Trigger Conditions

| Target | Triggered when |
| --- | --- |
| [Spatialized 2D HTML element](../../../concepts/spatialized-html-elements.md) | After the 3D spatial position occupied by its own content is tapped. |
| [3D container element](../../../concepts/3d-content-containers.md) | After the 3D spatial position occupied by its own interactive content is tapped. |

## Mental Model

Spatial Tap can be understood as a `click` event in 3D space.

## Event Type Signature

| Stage | DOM event |
| --- | --- |
| Completed tap | `spatialtap` |

## React Usage

| Stage | JSX prop |
| --- | --- |
| Completed tap | `onSpatialTap` |

## Native DOM Usage

> [!IMPORTANT]
> **Current limitation**
>
> At the current stage, the [WebSpatial SDK](../../../introduction/getting-started.md#webspatial-sdk) does not allow listening to spatial events directly on DOM elements, including those obtained from refs.

## Event Lifecycle

No event is triggered during the "selection" phase. Pinch and release immediately, and `spatialtap` is triggered.

## SpatialTapEvent Payload

| Fields | Unit | Meaning | Coordinate system |
| --- | --- | --- | --- |
| `offsetX`, `offsetY`, `offsetZ` | `px` | The X, Y, and Z coordinates of the tapped position. | The [local coordinate system](../js-api/convertCoordinate.md) of the [spatialized 2D HTML element](../../../concepts/spatialized-html-elements.md) that triggered the event, including 3D container elements. It uses a left-handed coordinate system with the origin at the top-left corner of the element's 2D plane, Y pointing downward, and Z pointing toward the user. |
| `clientX`, `clientY`, `clientZ` | `px` | The X, Y, and Z coordinates of the tapped position. | The [global coordinate system](../js-api/convertCoordinate.md) of the current [Spatial Scene container](../../../concepts/spatial-scenes.md). It uses a left-handed coordinate system with the origin at the top-left corner of the Spatial Scene's backplate, Y pointing downward, and Z pointing toward the user. |
