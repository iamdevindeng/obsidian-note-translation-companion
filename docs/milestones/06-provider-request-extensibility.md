# Milestone 6: Provider Request Extensibility

## Context

The plugin already supports OpenAI-compatible providers through `baseURL`, `apiKey`, `model`, `temperature`, and optional `extraHeaders`.

That is enough for basic providers, but newer OpenAI-compatible APIs expose request-body options that are not HTTP headers. Examples include DeepSeek thinking mode, reasoning strength, and OpenRouter provider routing options.

The product should stay a translation companion, not become a generic AI chat client. Provider extensibility should therefore be small, explicit, and easy to review.

## Decision

Add a provider request-body escape hatch:

- `extraHeaders` remains HTTP headers only.
- `extraBody` adds provider-specific JSON fields to the `/chat/completions` request body.
- `extraBody` must be a JSON object and may contain nested values.
- `extraBody` must not override plugin-owned fields such as `model`, `messages`, `temperature`, or `stream`.

This follows the split used by provider-agnostic translation tools: headers configure transport/provider attribution, while body parameters configure model behavior.

## Reference Patterns

- DeepSeek thinking mode uses request-body fields such as `thinking` and `reasoning_effort`.
- OpenRouter uses headers like `HTTP-Referer` and `X-Title`, and also supports body-level provider options.
- OpenAI-compatible SDKs and wrappers commonly expose an `extra_body` style field for provider-specific JSON payloads.
- Immersive Translate distinguishes header configs from body configs in advanced provider configuration.

## Cache Rule

Translation cache validity must include provider behavior inputs, not just source content and model identity.

Milestone 6 adds `ntc_request_hash`, derived from:

- `temperature`
- normalized `extraBody`

If the user changes thinking mode, reasoning effort, or other body-level model behavior, the cached translation must be considered stale.

Legacy cache metadata without `ntc_request_hash` remains valid only when the current request hash is the default empty-provider-body configuration, so existing translations are not invalidated unnecessarily.

## Acceptance Criteria

- Users can configure DeepSeek thinking mode with `Extra Body (JSON)`.
- Users can keep OpenRouter attribution in `Extra Headers (JSON)`.
- Invalid `extraBody` JSON fails before the network call with a clear error.
- Changing `extraBody` or `temperature` invalidates the translation cache.
- Existing translations generated without `extraBody` continue to work under default settings.
- README documents when to use headers vs body parameters.
