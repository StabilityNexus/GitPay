import { XOpsError } from "../core/errors.js";
import type { PayoutTarget } from "../core/types.js";
import type { Resolver, ResolveContext } from "./types.js";

export type { Resolver, ResolveContext } from "./types.js";
export { INLINE_PREFIX, InlineAddressResolver } from "./inline-address.js";

export class ResolverChain {
  private readonly resolvers: Resolver[];

  constructor(resolvers: Resolver[] = []) {
    this.resolvers = resolvers;
  }

  use(resolver: Resolver): this {
    this.resolvers.push(resolver);
    return this;
  }

  async resolve(identity: string, ctx: ResolveContext): Promise<PayoutTarget> {
    for (const resolver of this.resolvers) {
      if (resolver.canResolve(identity)) {
        return resolver.resolve(identity, ctx);
      }
    }
    throw new XOpsError("IDENTITY_UNRESOLVED", `No resolver matched "${identity}"`, {
      identity,
      tried: this.resolvers.map((r) => r.id),
    });
  }
}
