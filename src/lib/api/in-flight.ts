const inFlight = new Set<string>();

export class InFlightError extends Error {
  constructor() {
    super("Request already in progress");
    this.name = "InFlightError";
  }
}

export async function withInFlight<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (inFlight.has(key)) throw new InFlightError();
  inFlight.add(key);
  try {
    return await fn();
  } finally {
    inFlight.delete(key);
  }
}
