export interface SingleFlightRun<T> {
	started: boolean;
	promise: Promise<T>;
}

export class SingleFlightByKey<T> {
	private readonly inFlight = new Map<string, Promise<T>>();

	run(key: string, task: () => Promise<T>): SingleFlightRun<T> {
		const existing = this.inFlight.get(key);
		if (existing) {
			return {
				started: false,
				promise: existing,
			};
		}

		const promise = task().finally(() => {
			if (this.inFlight.get(key) === promise) {
				this.inFlight.delete(key);
			}
		});

		this.inFlight.set(key, promise);

		return {
			started: true,
			promise,
		};
	}

	has(key: string): boolean {
		return this.inFlight.has(key);
	}
}
