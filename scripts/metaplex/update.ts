import { baseUpdateAuthority, fetchAsset, update } from "@metaplex-foundation/mpl-core";

import {
  assertValidHttpUrl,
  createMetaplexClient,
  fetchCollectionForAsset,
  readOptionalEnv,
  readOptionalPublicKeyEnv,
  readOptionalSignerFromEnv,
  readRequiredPublicKeyEnv,
  serializeAsset,
  serializeCollection,
  serializeSignature,
  writeOperationOutput,
} from "./common";

async function main(): Promise<void> {
  const { umi, rpcUrl, keypairPath } = createMetaplexClient();
  const assetAddress = readRequiredPublicKeyEnv("ASSET_ADDRESS");
  const name = readOptionalEnv("NFT_NAME");
  const uri = readOptionalEnv("NFT_URI");
  const newUpdateAuthority = readOptionalPublicKeyEnv("NEW_UPDATE_AUTHORITY");
  const authority = readOptionalSignerFromEnv(umi, "AUTHORITY_KEYPAIR_PATH");

  if (!name && !uri && !newUpdateAuthority) {
    throw new Error("One of NFT_NAME, NFT_URI, or NEW_UPDATE_AUTHORITY is required");
  }

  const asset = await fetchAsset(umi, assetAddress);
  const collection = await fetchCollectionForAsset(umi, asset);
  const { signature } = await update(umi, {
    asset,
    collection: collection ?? undefined,
    authority,
    name,
    uri: uri ? assertValidHttpUrl("NFT_URI", uri) : undefined,
    newUpdateAuthority: newUpdateAuthority ? baseUpdateAuthority("Address", [newUpdateAuthority]) : undefined,
  }).sendAndConfirm(umi);

  const updatedAsset = await fetchAsset(umi, assetAddress);
  const updatedCollection = await fetchCollectionForAsset(umi, updatedAsset);
  const output = {
    rpcUrl,
    payer: umi.identity.publicKey,
    payerKeypairPath: keypairPath,
    signature: serializeSignature(signature),
    asset: serializeAsset(updatedAsset),
    collection: updatedCollection ? serializeCollection(updatedCollection) : null,
    authority: authority?.publicKey ?? null,
  };
  const outputPath = writeOperationOutput("update", output);

  console.log(JSON.stringify({ ...output, outputPath }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
