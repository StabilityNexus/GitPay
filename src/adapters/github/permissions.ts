import { isMaintainer } from "./trigger.js";

/**
 * Who may spend, asked of GitHub rather than read off the comment.
 *
 * `author_association` says how someone relates to the repository's *owner*,
 * not what they can do in the repository. `MEMBER` is any member of the owning
 * organization, with or without access here, and `COLLABORATOR` includes people
 * granted only read or triage. Neither can edit a workflow, so neither is the
 * write-access boundary the rest of the design assumes. The collaborator
 * permission endpoint is.
 */

export interface PermissionRef {
  /** `owner/repo`. */
  repo: string;
  login: string;
  token: string;
  apiBase?: string;
}

/**
 * The organization's or account's owner. GitHub gives an owner admin on every
 * repository it owns, so no lookup can say otherwise.
 */
const IMPLIES_WRITE = "OWNER";

/** `permission` already folds `maintain` into `write` and `triage` into `read`. */
const WRITE_PERMISSIONS = new Set(["admin", "write"]);

/**
 * Whether `login` can push to `repo`. Throws when GitHub cannot answer, so a
 * caller deciding about money refuses rather than guesses.
 */
export async function hasWriteAccess(ref: PermissionRef, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  if (!ref.token) {
    throw new Error(`Checking that ${ref.login} can push to ${ref.repo} needs the "github_token" input`);
  }
  const api = ref.apiBase ?? "https://api.github.com";
  const url = `${api}/repos/${ref.repo}/collaborators/${encodeURIComponent(ref.login)}/permission`;
  const response = await fetchImpl(url, {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${ref.token}`,
      "x-github-api-version": "2022-11-28",
      "user-agent": "gitpay",
    },
  });

  // Not a collaborator at all — an org member with no access here, for one.
  if (response.status === 404) return false;
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} checking ${ref.login}'s permission on ${ref.repo}`);
  }

  const { permission } = (await response.json()) as { permission?: string };
  return WRITE_PERMISSIONS.has(permission ?? "");
}

/**
 * The spend check for a comment author: on the allowlist, AND able to push.
 * The second half only narrows the first, so an adopter's allowlist keeps
 * meaning what it said; it just cannot grant more than write access does.
 */
export async function maySpend(
  association: string | undefined,
  allowed: readonly string[],
  ref: PermissionRef,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  if (!isMaintainer(association, allowed)) return false;
  if (associationImpliesWrite(association?.trim())) return true;
  return hasWriteAccess(ref, fetchImpl);
}

/** For a receipt author who passed the association check: OWNER needs no lookup. */
export function associationImpliesWrite(association: string | null | undefined): boolean {
  return (association ?? "").toUpperCase() === IMPLIES_WRITE;
}
