import type { PayoutTarget } from "../core/types.js";
import type { Resolver, ResolveContext } from "./types.js";

export const INLINE_PREFIX = "inline:";

/**
 * Takes the payout address verbatim from the identity string. It does not
 * validate the address format — the format belongs to a rail, and only the
 * driver for that rail may judge it.
 *
 * Accepts `inline:<value>` and bare values. `@handle` identities are left for
 * lookup-based resolvers.
 */
export class InlineAddressResolver implements Resolver {
  readonly id = "inline-address";

  canResolve(identity: string): boolean {
    const value = strip(identity);
    return value.length > 0 && !value.startsWith("@") && !/\s/.test(value);
  }

  resolve(identity: string, ctx: ResolveContext): Promise<PayoutTarget> {
    return Promise.resolve({
      rail: ctx.rail,
      address: strip(identity),
      resolvedBy: this.id,
    });
  }
}

function strip(identity: string): string {
  const trimmed = identity.trim();
  return trimmed.startsWith(INLINE_PREFIX) ? trimmed.slice(INLINE_PREFIX.length).trim() : trimmed;
}
