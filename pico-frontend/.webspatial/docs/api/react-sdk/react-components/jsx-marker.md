<!--
sidebar_position: 1
description: 'Mark JSX elements so the WebSpatial SDK can turn them into spatialized HTML elements.'
-->

# JSX Markers

The [WebSpatial SDK](../../../introduction/getting-started.md#webspatial-sdk) can turn most ordinary HTML elements into [spatialized HTML elements](../../../concepts/spatialized-html-elements.md), but for performance, compatibility with the open-source ecosystem, and similar reasons, developers currently need to add special markers to these HTML elements in JSX code.

## `enable-xr`

This special marker turns an HTML element into a spatialized HTML element.

To remain compatible with third-party open-source libraries, the SDK supports three marking styles:

1. Pass the `enable-xr` attribute as an HTML attribute on the element:

```html
<div className="card" enable-xr></div>
```

2. Add `__enableXr__` to the element's `className`:

```html
<div className="card __enableXr__"></div>
```

3. Add `enableXr: true` in the element's inline style:

```js
<div className="card" style={{ enableXr: true, marginTop: "10px" }}></div>
```

> [!IMPORTANT]
> **What this enables on `<Model>`**
>
> Using this marker on [`<Model>`](./Model.md) upgrades the element from the Web standard model element, which can only render a 3D model inside a flat canvas, into a [static 3D container element](../../../concepts/3d-content-containers.md) that can render a 3D model in space.

## `enable-xr-monitor`

Adding this special marker to a parent element of a [spatialized HTML element](../../../concepts/spatialized-html-elements.md) allows WebSpatial SDK to monitor changes to the content inside that parent. If those changes affect the [size or X/Y layout position](../../../concepts/spatialized-html-elements.md) of the spatialized HTML element, the SDK can synchronize the updates to the spatialized HTML element in time.

```js
function CardList() {
  const [showFirstCard, setShowFirstCard] = useState(true);

  const onClick = () => {
    setShowFirstCard(prevState => !prevState);
  };

  return (
    <div enable-xr-monitor>
      {showFirstCard && <div>first card</div>}
      <div enable-xr>second card</div>
      <button onClick={onClick}>toggle</button>
    </div>
  );
}
```
