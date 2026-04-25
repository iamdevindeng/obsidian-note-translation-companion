function splitPathSegments(path: string): string[] {
	return path.split("/").filter(Boolean);
}

export function getTranslationPath(sourcePath: string): string {
	const base = sourcePath.replace(/\.md$/i, "");
	return `_translations/${base}.zh-Hans.md`;
}

export function collectMissingFolders(
	existingFolders: ReadonlySet<string>,
	targetFolder: string
): string[] {
	const missingFolders: string[] = [];
	let currentPath = "";

	for (const segment of splitPathSegments(targetFolder)) {
		currentPath = currentPath ? `${currentPath}/${segment}` : segment;
		if (!existingFolders.has(currentPath)) {
			missingFolders.push(currentPath);
		}
	}

	return missingFolders;
}
