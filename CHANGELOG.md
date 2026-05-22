# Changelog

## 0.3.1 (2026-05-22)

- Open-source release preparation
- Added LICENSE, CONTRIBUTING.md, SECURITY.md, CHANGELOG.md
- Added GitHub CI and npm publish workflows
- Added issue templates and PR template
- Repository metadata updated

## 0.3.0 (2026-05-22)

- Streaming support for chat completions, responses, messages, and Gemini
- Gemini `streamGenerateContent` support
- ESM + CJS dual package with `.d.ts` / `.d.mts` types
- `HypersHubInsufficientBalanceError` error type
- Improved `tsup` build with sourcemaps and tree-shaking

## 0.2.0

- Responses API resource
- Chat completions resource with streaming
- Models list / retrieve
- Error classes (`HypersHubError`, `HypersHubAuthError`, `HypersHubRateLimitError`)

## 0.1.0

- Initial release
- Anthropic Messages API
- Basic request client with auth
