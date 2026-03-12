import { fetchAsset } from "@metaplex-foundation/mpl-core";
import { publicKey } from "@metaplex-foundation/umi";

import {
  fetchGlobalConfig,
  getConnection,
  Keypair,
  loadWallet,
  mintDoomIndexNftInstruction,
  readJson,
  sendInstructions,
  writeJson,
} from "./common";
import { createMetaplexClient } from "../metaplex/common";

type ReservationOutput = {
  tokenId: string;
};

type FetchLike = typeof fetch;
type AssetUriFetcher = (assetAddress: string) => Promise<string>;

export async function assertUrlReachable(url: string, label: string, fetchImpl: FetchLike = fetch): Promise<void> {
  const headResponse = await fetchImpl(url, { method: "HEAD" });
  if (headResponse.ok) {
    return;
  }

  const getResponse = await fetchImpl(url, { method: "GET" });
  if (!getResponse.ok) {
    throw new Error(`${label} fetch failed: ${getResponse.status} ${getResponse.statusText}`);
  }
}

export async function fetchAssetUri(
  assetAddress: string,
  fetchAssetUriImpl: AssetUriFetcher = createAssetUriFetcher(),
): Promise<string> {
  const uri = await fetchAssetUriImpl(assetAddress);
  if (!uri) {
    throw new Error(`Asset ${assetAddress} does not contain a metadata URI`);
  }

  return uri;
}

async function main(): Promise<void> {
  const connection = getConnection();
  const payer = loadWallet();
  const globalConfig = await fetchGlobalConfig(connection);
  const reservation =
    process.env.TOKEN_ID !== undefined
      ? { tokenId: process.env.TOKEN_ID }
      : readJson<ReservationOutput>("target/devnet/latest-reservation.json");
  const tokenId = BigInt(reservation.tokenId);
  const asset = Keypair.generate();

  const mintInstruction = mintDoomIndexNftInstruction(
    payer.publicKey,
    tokenId,
    asset.publicKey,
    globalConfig.collection,
  );
  const signature = await sendInstructions(connection, payer, [mintInstruction], [asset]);

  const metadataUri = await fetchAssetUri(asset.publicKey.toBase58());
  const metadataResponse = await fetch(metadataUri);
  if (!metadataResponse.ok) {
    throw new Error(`Metadata fetch failed: ${metadataResponse.status} ${metadataResponse.statusText}`);
  }
  const metadata = (await metadataResponse.json()) as {
    image?: string;
    animation_url?: string;
  };
  if (!metadata.image || !metadata.animation_url) {
    throw new Error("Metadata must include both image and animation_url");
  }

  await assertUrlReachable(metadata.image, "Image");
  await assertUrlReachable(metadata.animation_url, "animation_url");

  const output = {
    signature,
    tokenId: tokenId.toString(),
    asset: asset.publicKey.toBase58(),
    metadataUri,
    image: metadata.image,
    animationUrl: metadata.animation_url,
  };

  writeJson("target/devnet/latest-mint.json", output);
  console.log(JSON.stringify(output, null, 2));
}

function createAssetUriFetcher(): AssetUriFetcher {
  const { umi } = createMetaplexClient();
  return async (assetAddress: string) => {
    const asset = await fetchAsset(umi, publicKey(assetAddress));
    return asset.uri;
  };
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
