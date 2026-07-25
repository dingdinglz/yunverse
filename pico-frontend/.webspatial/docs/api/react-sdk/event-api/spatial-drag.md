<!--
sidebar_position: 2
description: 'Handle spatial drag gestures, including their phases and position payload.'
-->

# Spatial Drag

## Summary

Represents a completed one-handed "select, activate, and hold" action on a target in space, whether the interaction [is performed through indirect "gaze + pinch" or direct touch](../../../concepts/natural-interactions.md).

## Trigger Conditions

| Target | Triggered when |
| --- | --- |
| [Spatialized 2D HTML element](../../../concepts/spatialized-html-elements.md) | After the 3D spatial position occupied by its own content is pinched and held. |
| [3D container element](../../../concepts/3d-content-containers.md) | After the 3D spatial position occupied by its own interactive content is pinched and held. |

## Mental Model

You can drag in any direction in 3D space and place the target at any location in space.

## Event Type Signature

| Stage | DOM event |
| --- | --- |
| Drag start | `spatialdragstart` |
| Dragging | `spatialdrag` |
| Drag end | `spatialdragend` |

## React Usage

| Stage | JSX prop |
| --- | --- |
| Drag start | `onSpatialDragStart` |
| Dragging | `onSpatialDrag` |
| Drag end | `onSpatialDragEnd` |

## Native DOM Usage

> [!IMPORTANT]
> **Current limitation**
>
> At the current stage, the [WebSpatial SDK](../../../introduction/getting-started.md#webspatial-sdk) does not allow listening to spatial events directly on DOM elements, including those obtained from refs.

## Event Lifecycle

No event is triggered during the "selection" phase. When pinch-and-hold begins, `spatialdragstart` is triggered. After activation, holding continues to trigger `spatialdrag`. Releasing ends the action and triggers `spatialdragend`.

## SpatialDragStartEvent Payload

| Fields | Unit | Meaning | Coordinate system |
| --- | --- | --- | --- |
| `offsetX`, `offsetY`, `offsetZ` | `px` | The X, Y, and Z coordinates of the activation position. | The [local coordinate system](../js-api/convertCoordinate.md) of the [spatialized 2D HTML element](../../../concepts/spatialized-html-elements.md) that triggered the event, including 3D container elements. It uses a left-handed coordinate system with the origin at the top-left corner of the element's 2D plane, Y pointing downward, and Z pointing toward the user. |
| `clientX`, `clientY`, `clientZ` | `px` | The X, Y, and Z coordinates of the activation position. | The [global coordinate system](../js-api/convertCoordinate.md) of the current [Spatial Scene container](../../../concepts/spatial-scenes.md). It uses a left-handed coordinate system with the origin at the top-left corner of the Spatial Scene's backplate, Y pointing downward, and Z pointing toward the user. |

## SpatialDragEvent Payload

| Fields | Unit | Meaning |
| --- | --- | --- |
| `translationX`, `translationY`, `translationZ` | `px` | The offset relative to the drag start position. |

## SpatialDragEndEvent Payload

> [!IMPORTANT]
> **No extra payload**
>
> The `SpatialDragEndEvent` object passed to the `spatialdragend` callback has no extra properties.
