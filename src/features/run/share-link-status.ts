export type RunShareLinkView = {
  id: string;
  token: string;
  createdAt: string;
  expiresAt: string | null;
};

export function isShareLinkActive(expiresAt: string | null, now = new Date()): boolean {
  if (!expiresAt) {
    return true;
  }

  return new Date(expiresAt).getTime() > now.getTime();
}
