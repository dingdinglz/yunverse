<!--
sidebar_position: 5
description: 'Control whether a Spatial Scene stays upright, faces the user, or behaves more like a real object.'
-->

# `worldAlignment`

One of the [initialization properties](../../../concepts/spatial-scenes.md#scene-initialization) of a [Spatial Scene](../../../concepts/spatial-scenes.md), `worldAlignment` affects how a Spatial Scene behaves when the user drags it vertically after creation.
Only Spatial Scenes of type `volume` support `worldAlignment`.

## Availability

| Item | Value |
| --- | --- |
| Applies to | Only `volume` Spatial Scenes. |
| New scenes | Set through [`initScene`](../js-api/initScene.md). |
| Start scene | Set through the [Web App Manifest](../manifest-options/main-scene.md). |
| Default value | `"automatic"` |

## Type Signature

`"automatic" | "gravityAligned"`

## Examples

### Using `initScene`

**Set worldAlignment for a new scene**

```js
import { initScene } from "@webspatial/react-sdk";

initScene("newSceneName", defaultConfig => {
  return {
    ...defaultConfig,
    type: "volume",
    worldAlignment: "gravityAligned",
  };
});
window.open(newSceneUrl, "newSceneName");
```

### Using the Web App Manifest

> [!CAUTION]
> **Manifest key naming**
>
> In a Web App Manifest, convert camelCase keys such as `worldAlignment` to lowercase snake_case such as `world_alignment`.

**Set world_alignment for the start scene**

```json
{
  "name": "example app",
  "start_url": "/",
  "xr_main_scene": {
    "type": "volume",
    "world_alignment": "gravityAligned"
  }
}
```

## Default Value

`"automatic"`

## Accepted Values

| Value | Meaning |
| --- | --- |
| `"automatic"` | Tilts automatically during vertical movement so it always faces the user. |
| `"gravityAligned"` | Does not tilt automatically during vertical movement and always stays aligned with gravity like a real-world object. |
