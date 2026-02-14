import assert from "node:assert";
import { describe, it, beforeEach, afterEach } from "node:test";
import { createCachedFetcher } from "../src/lib/cache/create-cached-fetcher";

describe("createCachedFetcher", () => {
  let originalFetch: typeof global.fetch;
  let fetchCalls: string[];

  beforeEach(() => {
    originalFetch = global.fetch;
    fetchCalls = [];
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function mockFetch(responseData: unknown, status = 200): typeof fetch {
    return (async (url: string) => {
      fetchCalls.push(url);
      return new Response(JSON.stringify(responseData), { status });
    }) as typeof fetch;
  }

  function mockFetchError(error: Error): typeof fetch {
    return (async (url: string) => {
      fetchCalls.push(url);
      throw error;
    }) as typeof fetch;
  }

  function mockFetchInvalidJson(): typeof fetch {
    return (async (url: string) => {
      fetchCalls.push(url);
      return new Response("not valid json {");
    }) as typeof fetch;
  }

  describe("core behavior", () => {
    it("fetches and returns data", async () => {
      global.fetch = mockFetch({ foo: "bar" });
      const fetcher = createCachedFetcher<{ foo: string }>("/test/url");

      const result = await fetcher();

      assert.deepStrictEqual(result, { foo: "bar" });
      assert.deepStrictEqual(fetchCalls, ["/test/url"]);
    });

    it("caches result", async () => {
      global.fetch = mockFetch({ data: 1 });
      const fetcher = createCachedFetcher<{ data: number }>("/test/url");

      await fetcher();
      await fetcher();
      await fetcher();

      assert.strictEqual(fetchCalls.length, 1);
    });

    it("deduplicates concurrent calls", async () => {
      let resolveFetch: (value: Response) => void;
      global.fetch = (async (url: string) => {
        fetchCalls.push(url);
        return new Promise((resolve) => {
          resolveFetch = resolve;
        });
      }) as typeof fetch;

      const fetcher = createCachedFetcher<{ value: number }>("/test/url");

      const promise1 = fetcher();
      const promise2 = fetcher();
      const promise3 = fetcher();

      resolveFetch!(new Response(JSON.stringify({ value: 42 })));

      const [result1, result2, result3] = await Promise.all([
        promise1,
        promise2,
        promise3,
      ]);

      assert.deepStrictEqual(result1, { value: 42 });
      assert.deepStrictEqual(result2, { value: 42 });
      assert.deepStrictEqual(result3, { value: 42 });
      assert.strictEqual(fetchCalls.length, 1);
    });

    it("returns same promise for concurrent calls", async () => {
      global.fetch = mockFetch({ data: 1 });
      const fetcher = createCachedFetcher("/test/url");

      const promise1 = fetcher();
      const promise2 = fetcher();

      assert.strictEqual(promise1, promise2);
    });
  });

  describe("error handling", () => {
    it("rejects on fetch error", async () => {
      global.fetch = mockFetchError(new Error("Network error"));
      const fetcher = createCachedFetcher("/test/url");

      await assert.rejects(fetcher, {
        message: "Network error",
      });
    });

    it("rejects on invalid JSON", async () => {
      global.fetch = mockFetchInvalidJson();
      const fetcher = createCachedFetcher("/test/url");

      await assert.rejects(fetcher);
    });

    it("does not cache errors (retries after failure)", async () => {
      let callCount = 0;
      global.fetch = (async (url: string) => {
        fetchCalls.push(url);
        callCount++;
        if (callCount === 1) {
          throw new Error("First call failed");
        }
        return new Response(JSON.stringify({ success: true }));
      }) as typeof fetch;

      const fetcher = createCachedFetcher("/test/url");

      await assert.rejects(fetcher);
      const result = await fetcher();

      assert.deepStrictEqual(result, { success: true });
      assert.strictEqual(fetchCalls.length, 2);
    });
  });

  describe("edge cases", () => {
    it("works with string type", async () => {
      global.fetch = mockFetch("hello world");
      const fetcher = createCachedFetcher<string>("/test/url");

      const result = await fetcher();

      assert.strictEqual(result, "hello world");
    });

    it("works with array type", async () => {
      global.fetch = mockFetch([1, 2, 3]);
      const fetcher = createCachedFetcher<number[]>("/test/url");

      const result = await fetcher();

      assert.deepStrictEqual(result, [1, 2, 3]);
    });

    it("works with nested object type", async () => {
      global.fetch = mockFetch({
        nested: { deep: { value: 42 } },
        items: [{ id: 1, name: "a" }],
      });
      const fetcher = createCachedFetcher<{
        nested: { deep: { value: number } };
        items: Array<{ id: number; name: string }>;
      }>("/test/url");

      const result = await fetcher();

      assert.strictEqual(result.nested.deep.value, 42);
      assert.strictEqual(result.items.length, 1);
    });

    it("handles null response", async () => {
      global.fetch = mockFetch(null);
      const fetcher = createCachedFetcher<null>("/test/url");

      const result = await fetcher();

      assert.strictEqual(result, null);
    });

    it("handles large response", async () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        value: `item-${i}`,
      }));
      global.fetch = mockFetch(largeArray);
      const fetcher = createCachedFetcher<Array<{ id: number; value: string }>>(
        "/test/url"
      );

      const result = await fetcher();

      assert.strictEqual(result.length, 10000);
      assert.strictEqual(result[0].id, 0);
      assert.strictEqual(result[9999].id, 9999);
    });

    it("handles unicode in response", async () => {
      global.fetch = mockFetch({ text: "日本語テスト", emoji: "🎉" });
      const fetcher = createCachedFetcher<{ text: string; emoji: string }>(
        "/test/url"
      );

      const result = await fetcher();

      assert.strictEqual(result.text, "日本語テスト");
      assert.strictEqual(result.emoji, "🎉");
    });
  });

  describe("separate instances", () => {
    it("creates separate caches for different URLs", async () => {
      global.fetch = (async (url: string) => {
        fetchCalls.push(url);
        return new Response(JSON.stringify({ url }));
      }) as typeof fetch;

      const fetcher1 = createCachedFetcher<{ url: string }>("/url/1");
      const fetcher2 = createCachedFetcher<{ url: string }>("/url/2");

      const result1 = await fetcher1();
      const result2 = await fetcher2();

      assert.strictEqual(result1.url, "/url/1");
      assert.strictEqual(result2.url, "/url/2");
      assert.deepStrictEqual(fetchCalls, ["/url/1", "/url/2"]);
    });

    it("creates separate caches for same URL with different instances", async () => {
      global.fetch = mockFetch({ count: 0 });
      const fetcher1 = createCachedFetcher("/test/url");
      const fetcher2 = createCachedFetcher("/test/url");

      await fetcher1();
      await fetcher2();

      assert.strictEqual(fetchCalls.length, 2);
    });
  });
});
