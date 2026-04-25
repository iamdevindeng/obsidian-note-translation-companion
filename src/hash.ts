export async function sha256Hex(input: string): Promise<string> {
	try {
		const encoder = new TextEncoder();
		const data = encoder.encode(input);
		const hashBuffer = await crypto.subtle.digest("SHA-256", data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
	} catch (err) {
		console.error("[Note Translation Companion] sha256Hex failed:", err);
		throw new Error(`Failed to compute content hash: ${err instanceof Error ? err.message : String(err)}`);
	}
}
