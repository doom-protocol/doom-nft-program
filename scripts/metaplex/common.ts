import {
  fetchCollection,
  mplCore,
  type AssetV1,
  type CollectionV1,
  type UpdateAuthority,
} from "@metaplex-foundation/mpl-core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  base58,
  createSignerFromKeypair,
  generateSigner,
  keypairIdentity,
  publicKey,
  type KeypairSigner,
  type PublicKey,
  type Umi,
} from "@metaplex-foundation/umi";
import { resolve } from "node:path";

import { loadKeypair, loadOrCreateKeypair, resolveWalletPath, writeJson } from "../devnet/common";

const DEFAULT_RPC_URL = "https://api.devnet.solana.com";
const DEFAULT_OUTPUT_PATH = "target/devnet/metaplex";
const DEFAULT_ANCHOR_TOML_PATH = resolve(__dirname, "..", "..", "Anchor.toml");

type EnvLike = Record<string, string | undefined>;

export function readRequiredEnv(name: string, env: EnvLike = process.env): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

export function readOptionalEnv(name: string, env: EnvLike = process.env): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

export function resolveMetaplexConfig(
  anchorTomlPath: string = DEFAULT_ANCHOR_TOML_PATH,
  env: EnvLike = process.env,
): {
  rpcUrl: string;
  keypairPath: string;
} {
  return {
    rpcUrl: readOptionalEnv("SOLANA_RPC_URL", env) ?? readOptionalEnv("ANCHOR_PROVIDER_URL", env) ?? DEFAULT_RPC_URL,
    keypairPath: readOptionalEnv("KEYPAIR_PATH", env) ?? resolveWalletPath(anchorTomlPath),
  };
}

export function createMetaplexClient(
  anchorTomlPath: string = DEFAULT_ANCHOR_TOML_PATH,
  env: EnvLike = process.env,
): { umi: Umi; rpcUrl: string; keypairPath: string } {
  const { rpcUrl, keypairPath } = resolveMetaplexConfig(anchorTomlPath, env);
  const umi = createUmi(rpcUrl).use(mplCore());
  const wallet = loadKeypair(keypairPath);
  const keypair = umi.eddsa.createKeypairFromSecretKey(wallet.secretKey);

  umi.use(keypairIdentity(keypair));
  return { umi, rpcUrl, keypairPath };
}

export function readOptionalPublicKeyEnv(name: string, env: EnvLike = process.env): PublicKey | undefined {
  const value = readOptionalEnv(name, env);
  return value ? publicKey(value) : undefined;
}

export function readRequiredPublicKeyEnv(name: string, env: EnvLike = process.env): PublicKey {
  return publicKey(readRequiredEnv(name, env));
}

export function readOptionalSignerFromEnv(
  umi: Umi,
  name: string,
  env: EnvLike = process.env,
): KeypairSigner | undefined {
  const filePath = readOptionalEnv(name, env);
  if (!filePath) {
    return undefined;
  }

  const signerKeypair = loadKeypair(filePath);
  return createSignerFromKeypair(umi, umi.eddsa.createKeypairFromSecretKey(signerKeypair.secretKey));
}

export function readOrGenerateSigner(
  umi: Umi,
  name: string,
  env: EnvLike = process.env,
): { signer: KeypairSigner; keypairPath?: string } {
  const filePath = readOptionalEnv(name, env);
  if (!filePath) {
    return { signer: generateSigner(umi) };
  }

  const signerKeypair = loadOrCreateKeypair(filePath);
  return {
    signer: createSignerFromKeypair(umi, umi.eddsa.createKeypairFromSecretKey(signerKeypair.secretKey)),
    keypairPath: resolve(filePath),
  };
}

export function assertValidHttpUrl(name: string, value: string): string {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${name} must use http or https`);
  }

  return value;
}

export function serializeSignature(signature: Uint8Array): string {
  return base58.deserialize(signature)[0];
}

export function serializeCollection(collection: CollectionV1): {
  publicKey: string;
  updateAuthority: string;
  name: string;
  uri: string;
  currentSize: number;
  numMinted: number;
} {
  return {
    publicKey: collection.publicKey,
    updateAuthority: collection.updateAuthority,
    name: collection.name,
    uri: collection.uri,
    currentSize: collection.currentSize,
    numMinted: collection.numMinted,
  };
}

export function serializeAsset(asset: AssetV1): {
  publicKey: string;
  owner: string;
  updateAuthority: ReturnType<typeof serializeUpdateAuthority>;
  name: string;
  uri: string;
  seq: string | null;
} {
  return {
    publicKey: asset.publicKey,
    owner: asset.owner,
    updateAuthority: serializeUpdateAuthority(asset.updateAuthority),
    name: asset.name,
    uri: asset.uri,
    seq: asset.seq === null ? null : asset.seq.toString(),
  };
}

export async function fetchCollectionForAsset(umi: Umi, asset: AssetV1): Promise<CollectionV1 | null> {
  if (asset.updateAuthority.type !== "Collection" || !asset.updateAuthority.address) {
    return null;
  }

  return fetchCollection(umi, asset.updateAuthority.address);
}

export function writeOperationOutput(operation: string, payload: unknown, env: EnvLike = process.env): string {
  const filePath = readOptionalEnv("OUTPUT_PATH", env) ?? `${DEFAULT_OUTPUT_PATH}/${operation}.json`;
  writeJson(filePath, payload);
  return resolve(filePath);
}

function serializeUpdateAuthority(updateAuthority: UpdateAuthority):
  | { kind: "None" }
  | {
      kind: "Address" | "Collection";
      address: string;
    } {
  if (updateAuthority.type === "None" || !updateAuthority.address) {
    return { kind: "None" };
  }

  return {
    kind: updateAuthority.type,
    address: updateAuthority.address,
  };
}
