import { GitHubApiError } from "@/lib/editor";

export function extractErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function isAuthError(error: unknown): boolean {
  return error instanceof GitHubApiError && (error.status === 401 || error.status === 403);
}

export function isConflictError(error: unknown): boolean {
  return error instanceof GitHubApiError && 
    (GitHubApiError.isConflict(error) || GitHubApiError.isUnprocessable(error));
}
