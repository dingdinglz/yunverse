<!--
sidebar_position: 2
description: 'Set the initial width, height, and depth a Spatial Scene requests when it is created.'
-->

# `defaultSize`

One of the [initialization properties](../../../concepts/spatial-scenes.md#scene-initialization) of a [Spatial Scene](../../../concepts/spatial-scenes.md), `defaultSize` affects the size of a Spatial Scene immediately after it is created. It does not necessarily match the values in `defaultSize` exactly, because the operating system's [spatial computing](../../../concepts/spatial-computing.md) logic still takes priority.

## Availability

| Item | Value |
| --- | --- |
| Applies to | `window` scenes support `width` and `height`; `volume` scenes also support `depth`. |
| New scenes | Set through [`initScene`](../js-api/initScene.md). |
| Start scene | Set through the [Web App Manifest](../manifest-options/main-scene.md). |
| Default value | None. |

## Type Signature

**defaultSize type**

```ts
{
  width?: number | string
  height?: number | string
  depth?: number | string
}
```

## Examples

### Using `initScene`

**Set defaultSize for a new scene**

```js
import { initScene } from "@webspatial/react-sdk";

initScene("newSceneName", defaultConfig => {
  return {
    ...defaultConfig,
    type: "volume",
    defaultSize: {
      width: 500,
      height: "1000px",
      depth: "1m",
    },
  };
});
window.open(newSceneUrl, "newSceneName");
```

### Using the Web App Manifest

> [!CAUTION]
> **Manifest key naming**
>
> In a Web App Manifest, convert camelCase keys such as `defaultSize` to lowercase snake_case such as `default_size`.

**Set default_size for the start scene**

```json
{
  "name": "example app",
  "start_url": "/",
  "xr_main_scene": {
    "default_size": {
      "width": 500,
      "height": "1000px"
    }
  }
}
```

## Default Value

None.

## Accepted Values

| Field | Accepted value |
| --- | --- |
| `width` | A number with `px` as the default unit, or a string with a unit suffix such as `"100px"` or `"2m"`. |
| `height` | A number with `px` as the default unit, or a string with a unit suffix such as `"100px"` or `"2m"`. |
| `depth` | A number with `px` as the default unit, or a string with a unit suffix such as `"100px"` or `"2m"`. |
