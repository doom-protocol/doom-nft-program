import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assertUrlReachable, fetchAssetUri } from "./mint";

describe("fetchAssetUri", () => {
  test("returns the URI from the official asset fetcher", async () => {
    const metadataUri = await fetchAssetUri("Asset111111111111111111111111111111111111111", async () => {
      return "https://example.com/base/1.json";
    });

    assert.equal(metadataUri, "https://example.com/base/1.json");
  });

  test("throws when the asset does not contain a URI", async () => {
    await assert.rejects(
      () => fetchAssetUri("Asset111111111111111111111111111111111111111", async () => ""),
      /does not contain a metadata URI/,
    );
  });
});

describe("assertUrlReachable", () => {
  test("falls back to GET when HEAD is not supported", async () => {
    const calls: Array<{ url: string; method: string }> = [];
    await assertUrlReachable("https://example.com/asset.png", "Image", async (url, init) => {
      calls.push({ url: String(url), method: init?.method ?? "GET" });
      if (init?.method === "HEAD") {
        return new Response(null, { status: 405, statusText: "Method Not Allowed" });
      }

      return new Response("ok", { status: 200, statusText: "OK" });
    });

    assert.deepEqual(calls, [
      { url: "https://example.com/asset.png", method: "HEAD" },
      { url: "https://example.com/asset.png", method: "GET" },
    ]);
  });

  test("throws when both HEAD and GET fail", async () => {
    await assert.rejects(
      () =>
        assertUrlReachable("https://example.com/asset.png", "Image", async (_url, init) => {
          if (init?.method === "HEAD") {
            return new Response(null, { status: 403, statusText: "Forbidden" });
          }

          return new Response(null, { status: 404, statusText: "Not Found" });
        }),
      /Image fetch failed: 404 Not Found/,
    );
  });
});
