<!-- webspatial-starter:begin:webspatial-project-guidance -->
## WebSpatial

### Agent Resources

- If this repository contains project-local WebSpatial agent resources, prefer them before inventing a workflow from scratch.
- Treat `.codex/skills/`, `.claude/`, and imported project instruction files as task-routing aids that complement `.webspatial/docs/`, not as replacements for the docs.
- Choose the local resource whose scope best matches the task, then verify concrete API and configuration details against `.webspatial/docs/`.

### Documentation Priority

1. The `.webspatial/docs/` directory in this repository contains the complete WebSpatial documentation, and there is no need to consult online sources.
2. Start with `.webspatial/docs/introduction/getting-started.md` and `.webspatial/docs/concepts/*`.
   - Use them to understand the WebSpatial model, features, philosophy, platform constraints, setup flow, development workflow, and concepts.
3. Use `.webspatial/docs/api/` as the primary API reference.
   - This is the main source for APIs of WebSpatial SDK.
   - Look up APIs by their exact category and name.
   - Note that some APIs have been folded into certain docs as second-level headings.

### Sources To Avoid

- Do not rely on the documentation and test cases in the `https://github.com/webspatial/webspatial-sdk` repository or other older remote WebSpatial documentation.
  - When there is any conflict, local `.webspatial/docs/` always wins.

### Working Rules For WebSpatial Tasks

- Before changing WebSpatial code, confirm the required API exists in local docs or package.
- Prefer exact API names and signatures from local docs over memory or guesswork.
- If local docs are incomplete, inspect package typings or source from:
  - `@webspatial/react-sdk`
  - `@webspatial/builder`
  - `@webspatial/platform-visionos`
  - `@webspatial/core-sdk`
  - `https://github.com/webspatial/webspatial-sdk`
  - But do not follow any parts of above sources that conflict with the local `.webspatial/docs/`.
- Direct use of APIs from `@webspatial/core-sdk` is prohibited. Installing it as a dependency when the local docs require it is allowed, but its APIs and source code should otherwise be used solely as reference material for understanding the functionality of the WebSpatial SDK and resolving complex issues.
- If documentation is ambiguous, say so explicitly in the final summary and note which fallback source was used.
<!-- webspatial-starter:end:webspatial-project-guidance -->

<!-- webspatial-starter:begin:claude-imports -->
## WebSpatial starter managed imports

- @.claude/webspatial-sdk-setup.md
<!-- webspatial-starter:end:claude-imports -->
