import test = require("node:test");
import assert = require("node:assert/strict");
import { SingleFlightByKey } from "../src/single-flight";

test("SingleFlightByKey deduplicates in-flight work for the same key", async () => {
	const singleFlight = new SingleFlightByKey<void>();
	let taskCalls = 0;
	let releaseTask!: () => void;

	const blocker = new Promise<void>((resolve) => {
		releaseTask = resolve;
	});

	const first = singleFlight.run("note-a", async () => {
		taskCalls += 1;
		await blocker;
	});
	const second = singleFlight.run("note-a", async () => {
		taskCalls += 1;
	});

	assert.equal(first.started, true);
	assert.equal(second.started, false);
	assert.equal(taskCalls, 1);
	assert.equal(first.promise, second.promise);
	assert.equal(singleFlight.has("note-a"), true);

	releaseTask();
	await first.promise;

	assert.equal(singleFlight.has("note-a"), false);
});

test("SingleFlightByKey allows different keys to run independently", async () => {
	const singleFlight = new SingleFlightByKey<string>();
	const events: string[] = [];

	const first = singleFlight.run("note-a", async () => {
		events.push("a");
		return "a";
	});
	const second = singleFlight.run("note-b", async () => {
		events.push("b");
		return "b";
	});

	assert.equal(first.started, true);
	assert.equal(second.started, true);
	assert.deepEqual(await Promise.all([first.promise, second.promise]), ["a", "b"]);
	assert.deepEqual(events.sort(), ["a", "b"]);
});
