## Summary

- **Base branch:** `master`
- **What changed and why:**
  - Scoped the ZEGA AI integration guide (`docs/book/src/integrations/zega-ai.md`) to the inspectable external runtime bridge prototype package (`@zega/zeroclaw-bridge`).
  - Standardized YAML frontmatter to standard FND-002 taxonomy (`type: reference`, `status: proposed`) to align with published documentation metadata rules.
  - Detailed the gateway URL default port mismatch (`http://127.0.0.1:4242` vs default canonical `http://127.0.0.1:42617`).
  - Clarified pairing error fallback boundary: non-rate-limit enhanced route failures can fall back to legacy `POST /pair`, while `RateLimitError` is re-thrown immediately without attempting legacy fallback.
  - Pinned the external reference repository link to reviewed commit [`f99104367a6b06815cf478120b247d042fa7b1a5`](https://github.com/siabang35/zega.ai/tree/f99104367a6b06815cf478120b247d042fa7b1a5/packages/zeroclaw-bridge) instead of floating repository root.
- **Scope boundary:** Does not alter upstream Rust gateway codebase or attempt live integration tests against a running daemon.
- **Blast radius:** `docs/book/src/integrations/zega-ai.md` and `docs/book/src/SUMMARY.md`.
- **Linked issue(s):** None
- **Labels:** `type:docs`, `risk:low`, `size:S`, `docs`

## Testing (required)

### How you can test (when useful)

- **Reviewer testing requested?** `N/A` (Documentation-only change)

### How I tested

- **CI checks relied on and why they cover this change:** `Docs Style` covers Markdown and prose style validation across modified documentation pages.
- **Known CI coverage gap, if any:** Optional HTTP link validation via `lychee` was skipped because `lychee` is not installed in the local environment.
- **Commands run and tail output:**

```sh
$ bash scripts/ci/docs_quality_gate.sh && bash scripts/ci/docs_links_gate.sh
No prose em-dashes in changed docs files.
Linting docs files: docs/book/src/SUMMARY.md docs/book/src/integrations/zega-ai.md
markdownlint-cli2 v0.20.0 (markdownlint v0.40.0)
Finding: docs/book/src/SUMMARY.md docs/book/src/integrations/zega-ai.md !target/** !docs/book/src/SUMMARY.md
Linting: 1 file(s)
Summary: 0 error(s)
Collected 4 added link(s) from 2 docs file(s).
Checked 1 local docs link target(s).
Added HTTP(S) links detected, but lychee is not installed; skipping optional HTTP(S) validation.
Install via: cargo install lychee
```

- **Beyond CI, what did you manually verify?** Verified mdBook structural alignment, relative path resolutions under `docs/book/src/integrations/zega-ai.md`, and frontmatter adherence to FND-002 taxonomy.
- **If any command was intentionally skipped, why:** `lychee` optional HTTP link validation was skipped because the binary was unavailable.

## Security & Privacy Impact (required)

- New permissions, capabilities, or file system access scope? (`No`)
- New external network calls? (`No`)
- Secrets / tokens / credentials handling changed? (`No`)
- PII, real identities, or personal data in diff, tests, fixtures, or docs? (`No`)
- Prompt injection or untrusted model-visible text introduced/changed? (`No`)

## Compatibility (required)

- Backward compatible? (`Yes`)
- Config / env / CLI surface changed? (`No`)
- Rust/MSRV/toolchain floor changed? (`No`)

## Rollback (required for medium/high-risk PRs)

Low-risk PR: `git revert <sha>`
