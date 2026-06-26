# Contributing to RankForge

Thanks for your interest in contributing! RankForge is an open-source competitive-programming platform and contributions are welcome.

## Getting started

1. Fork and clone the repo.
2. Follow the **Local Development** steps in the [README](README.md#local-development).
3. Create a branch: `git checkout -b feat/your-feature` or `fix/the-bug`.
4. Make your changes and run the checks below.
5. Open a pull request describing what you changed and why.

## Before you open a PR

```bash
pnpm build      # everything compiles
pnpm test       # unit tests pass (segment-tree + shared)
```

- Keep PRs focused — one logical change per PR.
- Match the existing code style (TypeScript, Tailwind, no new dependencies unless necessary).
- Update the README if you change setup, scripts, or env vars.

## Good first issues

Check the [Issues](../../issues) tab and look for the `good first issue` and `help wanted` labels. These are scoped to be approachable without deep knowledge of the whole codebase.

## Reporting bugs / requesting features

Open an issue using the provided templates. Include reproduction steps for bugs, and the use case / motivation for features.

## Code of conduct

Be respectful and constructive. Harassment or abuse of any kind is not tolerated.
