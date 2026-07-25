<!--
sidebar_position: 1
description: 'Choose whether a new Spatial Scene behaves like a window or a volume.'
-->

# `type`

During the [initialization phase](../../../concepts/spatial-scenes.md#scene-initialization) of a [Spatial Scene](../../../concepts/spatial-scenes.md), you can set the [scene type](../../../concepts/spatial-scenes.md#scene-type).

## Availability

| Item | Value |
| --- | --- |
| Applies to | All Spatial Scenes. |
| New scenes | Set through [`initScene`](../js-api/initScene.md) before calling `window.open(...)`. |
| Start scene | Set through the [Web App Manifest](../manifest-options/main-scene.md). |
| Default value | `"window"` |

## Type Signature

`"window" | "volume"`

## Examples

### Using `initScene`

**Set the type for a new scene**

```js
import { initScene } from "@webspatial/react-sdk";

initScene("newSceneName", defaultConfig => {
  return {
    ...defaultConfig,
    type: "volume",
  };
});
window.open(newSceneUrl, "newSceneName");
```

### Using the Web App Manifest

**Set the type for the start scene**

```json
{
  "name": "example app",
  "start_url": "/",
  "xr_main_scene": {
    "type": "volume"
  }
}
```

## Default Value

`"window"`

## Accepted Values

| Value | Meaning |
| --- | --- |
| `"window"` | Primarily serves [GUI needs](../../../concepts/spatial-scenes.md#scene-type). |
| `"volume"` | Simulates a [real-world object](../../../concepts/spatial-scenes.md#scene-type). |
