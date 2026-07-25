<!--
sidebar_position: 3
description: 'Understand Spatial Scene containers, scene types, initialization, and how WebSpatial apps open multiple scenes.'
-->

# Spatial Scenes

A Spatial Scene, also called a Spatial Container, is the most basic container that a spatial computing operating system provides for [spatial apps](./spatial-computing.md#spatial-app). It is used to enable [unified rendering](./spatial-computing.md#unified-rendering) and provide the [basic capabilities that integrate software with space](./spatial-computing.md). All content in a spatial app must be provided through this kind of container, just as app content in desktop operating systems is provided through windows.

For a [WebSpatial App](./webspatial-app.md), each Spatial Scene is effectively a webpage loaded and run by URL inside an independent "window".
A WebSpatial App is composed entirely of these "windows", and all content comes from the HTML/CSS/JS code running inside them.

This kind of "window" does not include browser tabs, an address bar, or similar browser UI. The space is left to the webpage itself. It only provides a [minimal menu similar to a PWA window](https://web.dev/learn/pwa/app-design#standalone_experience), floating above the webpage content and collapsed by default, with essential Web App functions such as "copy current URL" and "open in browser". By default, it also includes navigation buttons such as "Back". If the `display` mode in the Web App Manifest is [set to `standalone`](https://developer.mozilla.org/docs/Web/Progressive_web_apps/Manifest/Reference/display), the navigation buttons are hidden and navigation relies entirely on UI inside the webpage.

## Scene Type

Spatial Scenes currently have three types:

The default is the `window` type. Its main content is a 2D plane floating in space. Users can drag to resize its width and height, subject to [initialization constraints](../api/react-sdk/scene-options/resizability.md), and can drag it to move it in space, subject to the spatial computing logic in the [Spatial Runtime](./spatial-computing.md#spatial-runtime). During movement, it will also always [keep a constant size relative to the user's field of view](../api/react-sdk/scene-options/worldScaling.md), because this type of Spatial Scene primarily serves GUI needs and needs to keep content and text clear and readable.

By default, webpage content is located on this 2D plane. The viewport size and window size exposed through existing Web APIs, such as `window.innerHeight`, are equal to the size of this plane. The height returned by `window.outerHeight` additionally includes the height of the PWA menu.

The backplate of this 2D plane can be set to [fully transparent with no border](../api/react-sdk/css-api/background-material.md), making webpage content look as if it were floating separately in the air. It can also use a native-feeling translucent material, such as a frosted-glass effect on visionOS, rendered dynamically in real time based on viewpoint and environment.

[Spatialized HTML elements](./spatialized-html-elements.md) can be "lifted" from this 2D plane into the 3D space in front of it, toward the user, and can receive Z-axis [layout](../api/react-sdk/css-api/back.md) and [transforms](../api/react-sdk/css-api/transform.md).
If the webpage adds [3D content container elements](./3d-content-containers.md), volumetric 3D content is also rendered in the space in front of this 2D plane.
So a `window` Spatial Scene is not just a flat plane and is not limited to pure 2D content. It can also contain spatialized UI and volumetric 3D content.

Spatial Scenes can also be set to the `volume` type. This type no longer prioritizes GUI needs and is instead used to simulate real-world objects.

Accordingly, this kind of Spatial Scene has an additional depth dimension besides width and height. Depth can be set through [`defaultSize`](../api/react-sdk/scene-options/defaultSize.md) and read through [`innerDepth`](../api/react-sdk/dom-api/innerDepth.md). When users drag it to move it in space, its behavior is still constrained by the Spatial Runtime's spatial computing logic, but unlike the `window` type, it shows a distance-based scaling effect by default unless the [`worldScaling` property](../api/react-sdk/scene-options/worldScaling.md) is changed during initialization. Another default behavior is that it always faces the user, unless the [`worldAlignment` property](../api/react-sdk/scene-options/worldAlignment.md) is changed during initialization to make it behave more like a real object.

Webpage content is still located on the back face of the `volume` by default, and the webpage size is equal to the size of that back face. Spatialized 2D HTML elements and volumetric content inside 3D container elements can all appear in the space in front of that back face, with the same capabilities and behavior as the `window` type.

Both of these Spatial Scene types are effectively bounded local spaces inside the [entire 3D space (Shared Space or Full Space)](./spatial-computing.md#spatial-runtime) run by the Spatial Runtime. A WebSpatial App can only show webpage content inside the bounds of these local spaces. Anything beyond them is clipped.

The third Spatial Scene type is `stage`, which has no bounds and can only be created in [Full Space](./spatial-computing.md#spatial-runtime) mode. WebSpatial SDK does not support this type yet.

## Scene Initialization

Browser windows in desktop operating systems can use Web APIs to set size and even position in webpage code, and these properties can continue to be controlled and modified.

The integration between a Spatial Scene and the surrounding space, and the associated spatial computing behavior, are managed uniformly by the operating system. So once these containers are created, their own properties, such as size and position, are not allowed to be modified by spatial app code. However, during the initialization phase before a container is created, spatial app code can provide custom initialization properties, such as the [`defaultSize`](../api/react-sdk/scene-options/defaultSize.md), [`resizability`](../api/react-sdk/scene-options/resizability.md), and [`worldScaling`](../api/react-sdk/scene-options/worldScaling.md) mentioned above, to influence the initial state of the Spatial Scene and its subsequent spatial computing behavior.

In a WebSpatial App, the Spatial Scene type is also configured through custom initialization properties, using the [`type` property](../api/react-sdk/scene-options/type.md).

## Start Scene

When a WebSpatial App starts, the first Spatial Scene is created automatically. This is called the Start Scene. The webpage URL loaded into it is determined by the [`start_url` field](../how-to/minimal-pwa.md) in the [Web App Manifest](./webspatial-app.md#web-app) by default.

Before the Start Scene is created, no webpage code can run. So if you want to provide custom initialization properties for the Start Scene, they can only be [configured through the Web App Manifest](../api/react-sdk/manifest-options/main-scene.md).

## New Scenes

A WebSpatial App can create more Spatial Scenes through the existing Web standard capability to open links in a new window, allowing more content to coexist and making fuller use of the surrounding space. For example:

- `<a href={newSceneUrl} target="_blank">`
- `<a href={newSceneUrl} target="newSceneName">`
- `window.open(newSceneUrl);`
- `window.open(newSceneUrl, "newSceneName");`

The URLs of these links must belong to the current Web App, meaning they match the [`scope` in the Web App Manifest](https://developer.mozilla.org/docs/Web/Progressive_web_apps/Manifest/Reference/scope). Otherwise they are opened in a browser window as third-party URLs.

Before these links are opened and the new Spatial Scene is created, the WebSpatial SDK can use the [`initScene` API to provide custom initialization properties for the new Spatial Scene, as long as the new scene has a `name`](../api/react-sdk/js-api/initScene.md).
