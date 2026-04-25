const LEADING_FRONTMATTER_PATTERN = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/;

export function getLeadingFrontmatter(text: string): string | null {
	const match = text.match(LEADING_FRONTMATTER_PATTERN);
	return match ? match[0] : null;
}

export function stripLeadingFrontmatter(text: string): string {
	const frontmatter = getLeadingFrontmatter(text);
	return frontmatter ? text.slice(frontmatter.length) : text;
}
