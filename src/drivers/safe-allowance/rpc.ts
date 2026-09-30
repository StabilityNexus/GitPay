/**
 * Per request. `fetch` has no timeout of its own, so a stalled endpoint would
 * otherwise hold the job until CI kills it.
 */
const RPC_TIMEOUT_MS = 30_000;

/** Minimal JSON-RPC over fetch. No dependency, because one call shape is all this needs. */
export class JsonRpc {
  constructor(private readonly url: string) {}

  async call<T>(method: string, params: readonly unknown[]): Promise<T> {
    const response = await fetch(this.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`RPC ${method} failed: HTTP ${response.status}`);
    }

    const body = (await response.json()) as { result?: T; error?: { message?: string } };
    if (body.error) {
      throw new Error(`RPC ${method} failed: ${body.error.message ?? "unknown error"}`);
    }
    return body.result as T;
  }

  hex(method: string, params: readonly unknown[]): Promise<string> {
    return this.call<string>(method, params);
  }
}

export function fromHex(value: string): bigint {
  return BigInt(value);
}

export function toHex(value: bigint): string {
  return `0x${value.toString(16)}`;
}
