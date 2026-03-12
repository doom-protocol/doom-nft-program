import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, test } from "node:test";

import { readRequiredEnv, resolveMetaplexConfig } from "./common";

const originalAnchorWallet = process.env.ANCHOR_WALLET;
const originalAnchorProviderUrl = process.env.ANCHOR_PROVIDER_URL;
const originalKeypairPath = process.env.KEYPAIR_PATH;
const originalSolanaRpcUrl = process.env.SOLANA_RPC_URL;

afterEach(() => {
  restoreEnv("ANCHOR_WALLET", originalAnchorWallet);
  restoreEnv("ANCHOR_PROVIDER_URL", originalAnchorProviderUrl);
  restoreEnv("KEYPAIR_PATH", originalKeypairPath);
  restoreEnv("SOLANA_RPC_URL", originalSolanaRpcUrl);
});

describe("readRequiredEnv", () => {
  test("returns a trimmed value", () => {
    assert.equal(readRequiredEnv("NAME", { NAME: "  DOOM INDEX  " }), "DOOM INDEX");
  });

  test("throws when the value is missing or blank", () => {
    assert.throws(() => readRequiredEnv("NAME", {}), /NAME is required/);
    assert.throws(() => readRequiredEnv("NAME", { NAME: "   " }), /NAME is required/);
  });
});

describe("resolveMetaplexConfig", () => {
  test("prefers explicit script env vars over Anchor defaults", () => {
    process.env.SOLANA_RPC_URL = "https://rpc.example.com";
    process.env.KEYPAIR_PATH = "/tmp/custom-keypair.json";
    process.env.ANCHOR_PROVIDER_URL = "https://ignored.example.com";
    process.env.ANCHOR_WALLET = "/tmp/ignored-anchor-wallet.json";

    assert.deepEqual(resolveMetaplexConfig("/tmp/Anchor.toml"), {
      rpcUrl: "https://rpc.example.com",
      keypairPath: "/tmp/custom-keypair.json",
    });
  });

  test("falls back to Anchor config when explicit env vars are unset", () => {
    delete process.env.SOLANA_RPC_URL;
    delete process.env.KEYPAIR_PATH;

    const tempDir = mkdtempSync(join(tmpdir(), "doom-metaplex-config-"));
    const anchorTomlPath = join(tempDir, "Anchor.toml");

    try {
      writeFileSync(
        anchorTomlPath,
        ["[provider]", 'cluster = "devnet"', 'wallet = "target/devnet/deployer.json"', ""].join("\n"),
        "utf8",
      );
      process.env.ANCHOR_PROVIDER_URL = "https://api.devnet.solana.com";

      assert.deepEqual(resolveMetaplexConfig(anchorTomlPath), {
        rpcUrl: "https://api.devnet.solana.com",
        keypairPath: join(tempDir, "target/devnet/deployer.json"),
      });
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
