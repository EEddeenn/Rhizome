export function createCachedFetcher<T>(url: string): () => Promise<T> {
  let cache: T | null = null;
  let promise: Promise<T> | null = null;

  return () => {
    if (cache) return Promise.resolve(cache);
    if (promise) return promise;
    promise = fetch(url)
      .then((res) => res.json())
      .then((data) => {
        cache = data;
        return data;
      })
      .catch((error) => {
        promise = null;
        throw error;
      });
    return promise;
  };
}
