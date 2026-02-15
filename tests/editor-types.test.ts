import assert from "node:assert";
import { describe, it } from "node:test";
import { GitHubApiError } from "../src/lib/editor/types";

describe("GitHubApiError", () => {
  describe("constructor", () => {
    it("creates error with status and message", () => {
      const error = new GitHubApiError(404, "Not found");
      assert.strictEqual(error.status, 404);
      assert.strictEqual(error.message, "Not found");
      assert.strictEqual(error.name, "GitHubApiError");
    });

    it("creates error with documentation URL", () => {
      const error = new GitHubApiError(403, "Forbidden", "https://docs.github.com");
      assert.strictEqual(error.documentationUrl, "https://docs.github.com");
    });
  });

  describe("isConflict", () => {
    it("returns true for 409 status", () => {
      const error = new GitHubApiError(409, "Conflict");
      assert.strictEqual(GitHubApiError.isConflict(error), true);
    });

    it("returns false for other status", () => {
      const error = new GitHubApiError(404, "Not found");
      assert.strictEqual(GitHubApiError.isConflict(error), false);
    });

    it("returns false for non-GitHubApiError", () => {
      const error = new Error("Generic error");
      assert.strictEqual(GitHubApiError.isConflict(error), false);
    });
  });

  describe("isUnprocessable", () => {
    it("returns true for 422 status", () => {
      const error = new GitHubApiError(422, "Unprocessable");
      assert.strictEqual(GitHubApiError.isUnprocessable(error), true);
    });

    it("returns false for other status", () => {
      const error = new GitHubApiError(400, "Bad request");
      assert.strictEqual(GitHubApiError.isUnprocessable(error), false);
    });
  });

  describe("isAuthError", () => {
    it("returns true for 401 status", () => {
      const error = new GitHubApiError(401, "Unauthorized");
      assert.strictEqual(GitHubApiError.isAuthError(error), true);
    });

    it("returns true for 403 status", () => {
      const error = new GitHubApiError(403, "Forbidden");
      assert.strictEqual(GitHubApiError.isAuthError(error), true);
    });

    it("returns false for other status", () => {
      const error = new GitHubApiError(404, "Not found");
      assert.strictEqual(GitHubApiError.isAuthError(error), false);
    });
  });

  describe("isNotFound", () => {
    it("returns true for 404 status", () => {
      const error = new GitHubApiError(404, "Not found");
      assert.strictEqual(GitHubApiError.isNotFound(error), true);
    });

    it("returns false for other status", () => {
      const error = new GitHubApiError(500, "Server error");
      assert.strictEqual(GitHubApiError.isNotFound(error), false);
    });
  });
});
