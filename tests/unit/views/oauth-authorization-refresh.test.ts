import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ref } from "vue";
import { describe, expect, it } from "vitest";

import { createLoadingRunner } from "@/views/auth/authorization/loading";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("OAuth2 authorization refresh lifecycle", () => {
  it("keeps loading active until every overlapping request settles", async () => {
    const loading = ref(false);
    const runWithLoading = createLoadingRunner(loading);
    const first = deferred();
    const second = deferred();

    const firstOperation = runWithLoading(() => first.promise);
    const secondOperation = runWithLoading(() => second.promise);
    expect(loading.value).toBe(true);

    first.resolve();
    await firstOperation;
    expect(loading.value).toBe(true);

    second.resolve();
    await secondOperation;
    expect(loading.value).toBe(false);
  });

  it("requires revoke and cleanup operations to await a Promise-returning refresh", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/views/auth/authorization/index.vue"),
      "utf8"
    );

    expect(source).toContain("async function fetchData()");
    expect(source.match(/await fetchData\(\)/g)).toHaveLength(2);
  });
});
