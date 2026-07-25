<!--
sidebar_position: 3
description: 'Handle two-handed magnify gestures and read the scale factor produced by the interaction.'
-->

# Spatial Magnify

## Summary

Represents a completed two-handed "select, activate, and hold" action on a target in space that produces scaling, whether the interaction is [performed through indirect "gaze + pinch" or direct touch](../../../concepts/natural-interactions.md).

## Trigger Conditions

| Target | Triggered when |
| --- | --- |
| [Spatialized 2D HTML element](../../../concepts/spatialized-html-elements.md) | After the 3D spatial position occupied by its own content is pinched and held. |
| [3D container element](../../../concepts/3d-content-containers.md) | After the 3D spatial position occupied by its own interactive content is pinched and held. |

## Mental Model

The line between the two hands, effectively like a real object, can be stretched in 3D space.

## Event Type Signature

| Stage | DOM event |
| --- | --- |
| Magnifying | `spatialmagnify` |
| Magnify end | `spatialmagnifyend` |

## React Usage

| Stage | JSX prop |
| --- | --- |
| Magnifying | `onSpatialMagnify` |
| Magnify end | `onSpatialMagnifyEnd` |

## Native DOM Usage

> [!IMPORTANT]
> **Current limitation**
>
> At the current stage, the [WebSpatial SDK](../../../introduction/getting-started.md#webspatial-sdk) does not allow listening to spatial events directly on DOM elements, including those obtained from refs.

## Event Lifecycle

No event is triggered during the "selection" phase. After pinch-and-hold activates, `spatialmagnify` is triggered continuously while the hold continues. Releasing ends the action and triggers `spatialmagnifyend`.

## SpatialMagnifyEvent Payload

| Field | Value | Meaning |
| --- | --- | --- |
| `magnification` | A percentage-like number such as `1` (100%) or `1.5` (150%). | The amount of scaling relative to the initial state. |

## SpatialMagnifyEndEvent Payload

> [!IMPORTANT]
> **No extra payload**
>
> The `SpatialMagnifyEndEvent` object passed to the `spatialmagnifyend` callback has no extra properties.
