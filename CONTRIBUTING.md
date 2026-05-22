# Contributing

Thanks for contributing to `@hypershub/sdk`.

## Development

Requirements:

- Node.js 18+
- npm

Setup:

```bash
git clone git@github.com:simonguo/typescript-sdk.git
cd typescript-sdk
npm install
```

Run checks locally:

```bash
npm run typecheck
npm test
npm run build
```

## Release checklist

1. Update `package.json` version.
2. Update `CHANGELOG.md`.
3. Run `npm run typecheck && npm test && npm run build`.
4. Commit and tag the release.
5. Create a GitHub Release for the tag, or manually run the `Publish` workflow.
6. Verify with `npm view @hypershub/sdk version`.

Publishing uses npm Trusted Publisher with GitHub Actions OIDC. Do not add `NPM_TOKEN` unless you intentionally switch back to token-based publishing.
