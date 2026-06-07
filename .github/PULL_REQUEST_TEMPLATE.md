<!--
Thanks for the PR! A few quick checks before merge — feel free to delete
sections that don't apply.
-->

## Summary

<!-- One or two sentences on what this PR does and why. -->

## Type of change

- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change (existing behavior changes)
- [ ] Refactor / internal-only
- [ ] Docs / tooling

## Testing

<!--
For UI changes, drop in a before/after GIF or screenshot.
For backend changes, mention which fixtures you re-ran and what you watched.
-->

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] `npm run test:run` passes
- [ ] `npm run verify` passes (or N/A — explain)
- [ ] Manually exercised the change in `npm run tauri:dev`

## Checklist

- [ ] My commit messages follow [Conventional Commits](https://www.conventionalcommits.org/).
- [ ] I've added or updated an entry in `CHANGELOG.md` under `[Unreleased]`.
- [ ] If I added a supported format, I updated `src/constants/formats.ts`, added a fixture, and updated `scripts/verify-conversions.sh`.
- [ ] If this affects the release pipeline, I tested `npm run release:local`.

## Related issues

<!-- Closes #123, refs #456 -->
