import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, test } from "node:test";

import { resolveWalletPath } from "./common";

const originalAnchorWallet = process.env.ANCHOR_WALLET;
const originalHome = process.env.HOME;

afterEach(() => {
  if (originalAnchorWallet === undefined) {
    delete process.env.ANCHOR_WALLET;
  } else {
    process.env.ANCHOR_WALLET = originalAnchorWallet;
  }

  if (originalHome === undefined) {
    delete process.env.HOME;
  } else {
    process.env.HOME = originalHome;
  }
});

describe("resolveWalletPath", () => {
  test("prefers ANCHOR_WALLET when it is set", () => {
    process.env.ANCHOR_WALLET = "/tmp/custom-wallet.json";

    assert.equal(resolveWalletPath("/tmp/unused/Anchor.toml"), "/tmp/custom-wallet.json");
  });

  test("uses provider.wallet from Anchor.toml when ANCHOR_WALLET is unset", () => {
    delete process.env.ANCHOR_WALLET;

    const tempDir = mkdtempSync(join(tmpdir(), "doom-anchor-wallet-"));
    const anchorTomlPath = join(tempDir, "Anchor.toml");

    try {
      writeFileSync(
        anchorTomlPath,
        ["[provider]", 'cluster = "devnet"', 'wallet = "target/devnet/deployer.json"', ""].join("\n"),
        "utf8",
      );

      assert.equal(resolveWalletPath(anchorTomlPath), join(tempDir, "target/devnet/deployer.json"));
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("falls back to the stable default wallet when provider.wallet is missing", () => {
    delete process.env.ANCHOR_WALLET;
    process.env.HOME = "/tmp/home-dir";

    const tempDir = mkdtempSync(join(tmpdir(), "doom-anchor-wallet-"));
    const anchorTomlPath = join(tempDir, "Anchor.toml");

    try {
      writeFileSync(anchorTomlPath, ["[provider]", 'cluster = "localnet"', ""].join("\n"), "utf8");

      assert.equal(resolveWalletPath(anchorTomlPath), "/tmp/home-dir/.config/solana/id.json");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
