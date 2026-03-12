import { create, fetchAsset, fetchCollection } from "@metaplex-foundation/mpl-core";

import {
  assertValidHttpUrl,
  createMetaplexClient,
  fetchCollectionForAsset,
  readOptionalPublicKeyEnv,
  readOptionalSignerFromEnv,
  readOrGenerateSigner,
  readRequiredEnv,
  serializeAsset,
  serializeCollection,
  serializeSignature,
  writeOperationOutput,
} from "./common";

async function main(): Promise<void> {
  const { umi, rpcUrl, keypairPath } = createMetaplexClient();
  const name = readRequiredEnv("NFT_NAME");
  const uri = assertValidHttpUrl("NFT_URI", readRequiredEnv("NFT_URI"));
  const owner = readOptionalPublicKeyEnv("NFT_OWNER") ?? umi.identity.publicKey;
  const updateAuthority = readOptionalPublicKeyEnv("NFT_UPDATE_AUTHORITY");
  const collectionAddress = readOptionalPublicKeyEnv("COLLECTION_ADDRESS");
  const authority = readOptionalSignerFromEnv(umi, "AUTHORITY_KEYPAIR_PATH");
  const { signer: asset, keypairPath: assetKeypairPath } = readOrGenerateSigner(umi, "ASSET_KEYPAIR_PATH");

  if (collectionAddress && updateAuthority) {
    throw new Error("NFT_UPDATE_AUTHORITY cannot be used together with COLLECTION_ADDRESS");
  }

  const collection = collectionAddress ? await fetchCollection(umi, collectionAddress) : undefined;
  const { signature } = await create(umi, {
    asset,
    name,
    uri,
    owner,
    updateAuthority,
    collection,
    authority,
  }).sendAndConfirm(umi);

  const savedAsset = await fetchAsset(umi, asset.publicKey);
  const linkedCollection = await fetchCollectionForAsset(umi, savedAsset);
  const output = {
    rpcUrl,
    payer: umi.identity.publicKey,
    payerKeypairPath: keypairPath,
    signature: serializeSignature(signature),
    asset: serializeAsset(savedAsset),
    collection: linkedCollection ? serializeCollection(linkedCollection) : null,
    assetKeypairPath: assetKeypairPath ?? null,
    authority: authority?.publicKey ?? null,
  };
  const outputPath = writeOperationOutput("create", output);

  console.log(JSON.stringify({ ...output, outputPath }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
