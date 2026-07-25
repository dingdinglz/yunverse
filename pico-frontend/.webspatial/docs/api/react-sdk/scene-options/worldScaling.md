<!--
sidebar_position: 4
description: 'Control whether a Spatial Scene keeps a constant apparent size or scales with distance.'
-->

# `worldScaling`

One of the [initialization properties](../../../concepts/spatial-scenes.md#scene-initialization) of a [Spatial Scene](../../../concepts/spatial-scenes.md), `worldScaling` affects how a Spatial Scene behaves when the user drags it horizontally after creation.
Only Spatial Scenes of type `volume` support `worldScaling`.

## Availability

| Item | Value |
| --- | --- |
| Applies to | Only `volume` Spatial Scenes. |
| New scenes | Set through [`initScene`](../js-api/initScene.md). |
| Start scene | Set through the [Web App Manifest](../manifest-options/main-scene.md). |
| Default value | `"automatic"` |

## Type Signature

`"automatic" | "dynamic"`

## Examples

### Using `initScene`

**Set worldScaling for a new scene**

```js
import { initScene } from "@webspatial/react-sdk";

initScene("newSceneName", defaultConfig => {
  return {
    ...defaultConfig,
    type: "volume",
    worldScaling: "dynamic",
  };
});
window.open(newSceneUrl, "newSceneName");
```

### Using the Web App Manifest

> [!CAUTION]
> **Manifest key naming**
>
> In a Web App Manifest, convert camelCase keys such as `worldScaling` to lowercase snake_case such as `world_scaling`.

**Set world_scaling for the start scene**

```json
{
  "name": "example app",
  "start_url": "/",
  "xr_main_scene": {
    "type": "volume",
    "world_scaling": "dynamic"
  }
}
```

## Default Value

`"automatic"`

## Accepted Values

| Value | Meaning |
| --- | --- |
| `"automatic"` | Shows a distance-based scaling effect during movement, like a real-world object. |
| `"dynamic"` | Keeps a constant size relative to the user's field of view during movement, just like the default behavior of a `window` Spatial Scene. |
