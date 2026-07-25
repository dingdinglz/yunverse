<!--
sidebar_position: 6
description: 'Show or hide the baseplate under a volume Spatial Scene.'
-->

# `baseplateVisibility`

One of the [initialization properties](../../../concepts/spatial-scenes.md#scene-initialization) of a [Spatial Scene](../../../concepts/spatial-scenes.md). Only Spatial Scenes of type `volume` support `baseplateVisibility`, and it affects the visibility of the baseplate under the Volume.

## Availability

| Item | Value |
| --- | --- |
| Applies to | Only `volume` Spatial Scenes. |
| New scenes | Set through [`initScene`](../js-api/initScene.md). |
| Start scene | Set through the [Web App Manifest](../manifest-options/main-scene.md). |
| Default value | `"automatic"` |

## Type Signature

`"automatic" | "hidden"`

## Examples

### Using `initScene`

**Set baseplateVisibility for a new scene**

```js
import { initScene } from "@webspatial/react-sdk";

initScene("newSceneName", defaultConfig => {
  return {
    ...defaultConfig,
    type: "volume",
    baseplateVisibility: "hidden",
  };
});
window.open(newSceneUrl, "newSceneName");
```

### Using the Web App Manifest

> [!CAUTION]
> **Manifest key naming**
>
> In a Web App Manifest, convert camelCase keys such as `baseplateVisibility` to lowercase snake_case such as `baseplate_visibility`.

**Set baseplate_visibility for the start scene**

```json
{
  "name": "example app",
  "start_url": "/",
  "xr_main_scene": {
    "type": "volume",
    "baseplate_visibility": "hidden"
  }
}
```

## Default Value

`"automatic"`

## Accepted Values

| Value | Meaning |
| --- | --- |
| `"automatic"` | The baseplate is shown when needed. |
| `"hidden"` | The baseplate is always hidden. |
