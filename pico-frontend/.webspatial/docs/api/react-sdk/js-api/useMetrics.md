<!--
sidebar_position: 2
description: 'Convert between 2D pixel units and real-world meter units inside WebSpatial layouts.'
-->

# `useMetrics`

## Summary

Performs [unit conversion](../../../concepts/3d-content-containers.md#2d-containing-3d) between the point unit (`px`) used by 2D GUI and the physical world unit (`m`) used by 3D space.

On visionOS, the default mapping is roughly `1360px ≈ 1 meter`, but this conversion is not always fixed:

If the [Spatial Scene container](../../../concepts/spatial-scenes.md) is of type `window`, or if the scene type is `volume` and [`worldScaling` in the initialization properties is set to `dynamic`](../scene-options/worldScaling.md), then the conversion between these two units is not fixed. See [`worldScalingCompensation`](#return-shape).

The conversion ratio also differs across spatial computing platforms, so this API should be used consistently for unit conversion.

## Signature

```js
import { useMetrics } from "@webspatial/react-sdk";

function UnitConvertTest() {
  const { pointToPhysical, physicalToPoint } = useMetrics();

  return (
    <>
      <pre>
        Scaled conversion
        {"\n"}
        physicalToPoint(1): {physicalToPoint(1)}
        {"\n"}
        pointToPhysical(1): {pointToPhysical(1)}
      </pre>

      <pre>
        Unscaled conversion
        {"\n"}
        physicalToPoint(1):{" "}
        {physicalToPoint(1, { worldScalingCompensation: "unscaled" })}
        {"\n"}
        pointToPhysical(1):{" "}
        {pointToPhysical(1, { worldScalingCompensation: "unscaled" })}
      </pre>
    </>
  );
}
```

## Parameters

None.

## Return Shape

```ts
type WorldScalingCompensation = "scaled" | "unscaled";

type MetricConvertOptions = {
  worldScalingCompensation?: WorldScalingCompensation;
};

type UseMetricsReturn = {
  pointToPhysical: (value: number, options?: MetricConvertOptions) => number;
  physicalToPoint: (value: number, options?: MetricConvertOptions) => number;
};
```

`worldScalingCompensation` determines whether the current Spatial Scene container's `worldScaling` should be compensated during the conversion.

- `scaled`: the conversion result matches the size perceived by the user after automatic scaling from `worldScaling`
- `unscaled`: returns a stable physical-world value that does not change with `worldScaling`

### pointToPhysical

```ts
pointToPhysical(value: number, options?: MetricConvertOptions): number
```

### physicalToPoint

```ts
physicalToPoint(value: number, options?: MetricConvertOptions): number
```
