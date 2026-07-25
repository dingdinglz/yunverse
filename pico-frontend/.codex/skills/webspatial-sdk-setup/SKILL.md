---
name: "webspatial-sdk-setup"
description: "Set up WebSpatial in an existing web project so the WebSpatial API is ready to use locally. Use when a user asks to install or integrate `@webspatial/react-sdk`, enable the WebSpatial API, wire the JSX runtime, satisfy the minimum PWA requirements, or add the optional Builder workflow for packaged-app targets."
---

# WebSpatial SDK Setup

Use the local docs under `../../../.webspatial/docs/` as the source of truth. Do not restate them from memory when the docs already cover the answer. Inspect the project first, then read only the matching docs and sections.

## Read This First

- Main onboarding flow: [../../../.webspatial/docs/introduction/getting-started.md](../../../.webspatial/docs/introduction/getting-started.md)
- Runtime packages: [Installation -> Step 1: Runtime SDK](../../../.webspatial/docs/introduction/getting-started.md#step-1-runtime-sdk)
- Optional packaged-app tooling: [Installation -> Step 2 (Optional): Builder](../../../.webspatial/docs/introduction/getting-started.md#step-2-optional-builder)
- JSX runtime integration: [Set Up Your Project -> Step 1: JSX Runtime](../../../.webspatial/docs/introduction/getting-started.md#step-1-jsx-runtime)
- Minimum PWA requirements: [Set Up Your Project -> Step 2: Minimal PWA](../../../.webspatial/docs/introduction/getting-started.md#step-2-minimal-pwa) and [../../../.webspatial/docs/how-to/minimal-pwa.md](../../../.webspatial/docs/how-to/minimal-pwa.md)

## Variant Docs

Read these only when the project shape requires them:

- JavaScript React without TypeScript: [../../../.webspatial/docs/how-to/non-ts.md](../../../.webspatial/docs/how-to/non-ts.md)
- Rspack or Rsbuild: [../../../.webspatial/docs/how-to/rspack.md](../../../.webspatial/docs/how-to/rspack.md)
- SSR-enabled React projects: [../../../.webspatial/docs/how-to/ssr.md](../../../.webspatial/docs/how-to/ssr.md)
- visionOS simulator or packaged-app workflow: [../../../.webspatial/docs/how-to/xcode.md](../../../.webspatial/docs/how-to/xcode.md), [../../../.webspatial/docs/api/builder/run.md](../../../.webspatial/docs/api/builder/run.md), [../../../.webspatial/docs/api/builder/build.md](../../../.webspatial/docs/api/builder/build.md), [../../../.webspatial/docs/api/builder/publish.md](../../../.webspatial/docs/api/builder/publish.md)
- visionOS device testing or App Store submission: [../../../.webspatial/docs/how-to/app-store-connect.md](../../../.webspatial/docs/how-to/app-store-connect.md)

## Required Workflow

1. Inspect the project before editing:
   - package manager
   - React entrypoints
   - TypeScript vs JavaScript
   - build tool
   - SSR vs client-only
   - whether a Web App Manifest already exists
2. Read the matching sections from the local docs.
3. Apply the integration with the smallest set of edits that makes the documented requirements true.
4. Validate the result with the project's existing checks when practical.

## Strict Rules

- Treat the local docs as canonical for package names, required config keys, and required manifest fields.
- Always install both `@webspatial/react-sdk` and `@webspatial/core-sdk` when enabling the runtime SDK.
- Installing `@webspatial/core-sdk` as a dependency is allowed when the local docs require it, but do not import WebSpatial APIs from it directly unless the local docs explicitly tell you to.
- Do not add Builder packages or platform runtime packages unless the user explicitly needs packaged-app workflows or a platform without a built-in WebSpatial Runtime.
- Do not invent alternate WebSpatial package names, JSX runtime settings, or manifest keys.
- Do not add demo UI, example scenes, or WebSpatial feature code unless the user asks for an example.
- If the project already has a manifest, patch the missing requirements instead of replacing existing branding, icons, or app metadata.

## Adaptation Guidance

- Preserve the project's existing framework and config style. Keep the documented semantics, but adapt them to the actual file names and config format already in use.
- If the project is TypeScript and not on Rspack/Rsbuild, start from the `jsxImportSource` setup in Getting Started.
- If the project is JavaScript-only, use the non-TypeScript guide. If that guide does not cover the active build tool, infer the equivalent JSX runtime hook from the tool's existing JSX transform configuration.
- If the project uses Rspack or Rsbuild, follow the Rspack guide instead of forcing a `tsconfig`-only solution.
- If the project uses SSR, add `SSRProvider` at the client hydration boundary shown by the local framework, not necessarily the exact file names from the docs.
- If there are multiple possible config files, edit the one the current scripts and imports actually use.
- If a safe equivalent integration point does not exist, stop and report the exact blocker instead of fabricating an unsupported configuration.

## Validation

- Confirm the dependency declarations are present.
- Confirm the JSX runtime wiring is present in the active config path.
- Confirm the manifest link exists and the manifest has the minimum required fields.
- Run the project's smallest relevant verification command when available, preferably typecheck or build.
- In the final summary, cite the local doc files you followed so the user can audit the changes quickly.
