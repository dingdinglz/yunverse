<!--
sidebar_position: 4
description: 'Enable WebSpatial in SSR projects by wrapping the app with SSRProvider and preserving the client-runtime split.'
-->

# How to enable WebSpatial in SSR-enabled projects

In a React project with SSR enabled, there is one extra step when [integrating WebSpatial SDK](../introduction/getting-started.md#set-up-your-project): add the `SSRProvider` from the SDK.

> [!IMPORTANT]
> **Why this wrapper exists**
>
> `SSRProvider` gives the SDK the extra context it needs to bridge server rendering and client hydration correctly.

## Generic React

**client-entry.js**

```js
import { hydrateRoot } from "react-dom/client";
import { SSRProvider } from "@webspatial/react-sdk";

hydrateRoot(
  document.getElementById("root"),
  <SSRProvider>
    <App />
  </SSRProvider>,
);
```

## Hydrogen

**entry.client.jsx**

```js
import { HydratedRouter } from "react-router/dom";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { NonceProvider } from "@shopify/hydrogen";
import { SSRProvider } from "@webspatial/react-sdk";

if (!window.location.origin.includes("webcache.googleusercontent.com")) {
  startTransition(() => {
    const existingNonce = document.querySelector("script[nonce]")?.nonce;

    hydrateRoot(
      document,
      <StrictMode>
        <NonceProvider value={existingNonce}>
          <SSRProvider>
            <HydratedRouter />
          </SSRProvider>
        </NonceProvider>
      </StrictMode>,
    );
  });
}
```
