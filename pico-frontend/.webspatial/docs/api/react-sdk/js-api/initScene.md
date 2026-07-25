<!--
sidebar_position: 1
description: 'Configure initialization options for a new Spatial Scene before it opens.'
-->

# `initScene`

## Summary

Applies custom configuration to the [initialization properties](../../../concepts/spatial-scenes.md#scene-initialization) of a Spatial Scene [before a new Spatial Scene is created](../../../concepts/spatial-scenes.md#new-scenes).

## Signature

```js
import { initScene } from "@webspatial/react-sdk";

initScene("newSceneName", defaultConfig => {
  return {
    ...defaultConfig,
    type: "volume",
    defaultSize: {
      width: "1m",
      height: "100px",
      depth: "100px",
    },
  };
});
window.open(newSceneUrl, "newSceneName");
```

## Parameters

### sceneName

The name of the Spatial Scene to initialize, equivalent to the `name` of the new window opened by the link.

If `initScene` is called while the Spatial Scene for that `name` is already open, it only affects the initialization properties the next time a new Spatial Scene is created with the same `name` after the current one is closed.

If `initScene` is called multiple times for the same `name`, the custom initialization properties for that `name` are updated repeatedly.

### configure

A callback function. Its parameter, `defaultConfig`, is the latest state of the custom initialization properties for that `name`, and the callback returns the new custom initialization properties.

If this is the first time `initScene` is called for that `name`, the parameter `defaultConfig` contains the default initialization properties.

## Return Shape

No return value.
