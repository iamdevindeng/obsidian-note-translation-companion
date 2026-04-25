---
title: Manual Test Markdown Structure
category: fixture
aliases:
  - Structure Fixture
---

# Markdown Structure Note

This fixture checks whether translation preserves Markdown syntax while translating ordinary prose.

The inline command `npm run build` should remain unchanged, and the link target in [the project website](https://example.com/project) should stay the same.

The wiki link target [[Manual Test Target]] should remain stable, and the tag #manual-test should not be translated.

Inline math such as $E = mc^2$ should remain readable.

$$
\int_0^1 x^2 dx = \frac{1}{3}
$$

```ts
const apiBase = "https://provider.example/v1";

function describeFixture(name: string): string {
	return `Fixture: ${name}`;
}
```

| Area | Expected behavior |
| --- | --- |
| Heading | Translate visible heading text. |
| Link | Preserve the URL. |
| Code | Keep the code block unchanged. |

> [!note] Translation check
> Preserve the callout marker and translate only the visible prose.

Final paragraph: the generated companion note should still be valid Markdown after the provider returns translated text.
