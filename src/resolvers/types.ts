import type { PayoutTarget } from "../core/types.js";

export interface ResolveContext {
  /** CAIP-2 network or a non-chain rail id. Opaque to the resolver. */
  rail: string;
}

/**
 * Identity (string) → PayoutTarget. ENS, `.well-known` lookup and ERC-8004
 * agent ids are all just resolvers behind this interface.
 */
export interface Resolver {
  readonly id: string;
  canResolve(identity: string): boolean;
  resolve(identity: string, ctx: ResolveContext): Promise<PayoutTarget>;
}
