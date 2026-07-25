<!--
sidebar_position: 1
description: 'Learn how spatial computing differs from traditional XR, including spatial apps, runtimes, and unified rendering.'
-->

# Spatial Computing

Spatial computing is a new capability of computing devices and operating systems. It is a further evolution of traditional XR devices and XR operating systems, including [virtual reality, mixed reality, and augmented reality](https://developer.picoxr.com/document/web/introduce-xr/).

Traditional XR operating systems continuously track objects in the surrounding space and the user, obtaining their 3D positions and poses. Software interfaces and virtual digital content can use this low-level data to dynamically integrate with the surrounding space, for example by staying fixed at a location in space while always facing the user, or by following the user's wrist and always appearing beside it. But traditional XR operating systems do not define exactly how software should integrate with space. Each XR app has to use the low-level data provided by the OS and design and implement its own behavior and effects.

A spatial computing operating system (Spatial OS) implements this integration between software and space in a unified way. It performs substantial spatial computation inside the OS, exposes the resulting new capabilities, such as [spatialized UI](../introduction/getting-started.md#webspatial-api) and mixed 2D/3D coexistence, to [spatial apps](#spatial-app), and performs [unified rendering](#unified-rendering) for those apps.

[visionOS](https://developer.apple.com/visionos/) and [PICO OS 6](https://developer.picoxr.com/document/discover/pico-os-6-overview/) are both Spatial OS platforms.

## Unified Rendering

The purpose of unified rendering is to let a Spatial OS perform [spatial computing](./spatial-computing.md) for different apps in a unified way, so the 2D and 3D content of multiple [spatial apps](#spatial-app) can coexist in the same space and share the same coordinate system and lighting environment, including effects such as spatial relationships, occlusion, and shadows.

To make this possible, each spatial app cannot render its own content in isolation or implement interactions arbitrarily. Instead, apps must provide content through [OS-managed 2D/3D content containers called spatial scenes](./spatial-scenes.md), and implement that content through [APIs the operating system can understand](./3d-content-containers.md#3d-engine-api). This allows the OS to understand app content as much as possible, perform unified rendering, and give that content consistent space-aware behavior and natural interaction capabilities.

## Spatial Runtime

To continuously perform [spatial computing](./spatial-computing.md) and [unified rendering](#unified-rendering), a Spatial OS needs to run a single 3D space and a single 3D rendering engine. This is effectively a runtime responsible for all [spatial apps](#spatial-app): all spatial apps run in that 3D space and are rendered by that engine.

When multiple spatial apps coexist, this 3D space is called Shared Space. When other spatial apps are hidden and the whole space is reserved for one app, it is called Full Space.

In Shared Space, spatial apps cannot access private data such as eye tracking, hand movement, and spatial environment information by default. Apps can only access such data after the user authorizes Full Space mode and the app exclusively occupies the entire space, allowing it to perform custom spatial computation.

## Spatial App

A spatial app is an app that runs in [Shared Space or Full Space](#spatial-runtime), is [rendered in a unified way](#unified-rendering) by the operating system, and automatically gains [spatial computing](./spatial-computing.md) capabilities.

Spatial apps adopt the ["2D containing 3D"](./3d-content-containers.md#2d-containing-3d) development paradigm. Existing 2D apps, such as [Web Apps](./webspatial-app.md#web-app), can become spatial apps as long as they can use [new spatial computing APIs such as WebSpatial APIs](../introduction/getting-started.md#webspatial-api). Developers can add code where needed to let 2D content enter 3D space, add real volumetric 3D content mixed with 2D content, and make content support spatial interactions and integration with the surrounding space.

If spatial computing APIs are not used, the UI of a 2D app is not automatically spatialized or turned into 3D content, and the app does not automatically become a spatial app.

Apps built on OpenXR and low-level 3D graphics APIs, including WebXR content in webpages, are not spatial apps, because they need to render themselves independently and occupy the entire space exclusively. They cannot coexist with other apps in the same space and cannot reuse the full spatial computing capabilities of the Spatial OS.
