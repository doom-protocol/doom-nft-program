import { burn, fetchAsset } from "@metaplex-foundation/mpl-core";

import {
  createMetaplexClient,
  fetchCollectionForAsset,
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
  const authority = readOptionalSignerFromEnv(umi, "AUTHORITY_KEYPAIR_PATH");
  const asset = await fetchAsset(umi, assetAddress);
  const collection = await fetchCollectionForAsset(umi, asset);

  const { signature } = await burn(umi, {
    asset,
    collection: collection ?? undefined,
    authority,
  }).sendAndConfirm(umi);

  const output = {
    rpcUrl,
    payer: umi.identity.publicKey,
    payerKeypairPath: keypairPath,
    signature: serializeSignature(signature),
    burnedAsset: serializeAsset(asset),
    collection: collection ? serializeCollection(collection) : null,
    authority: authority?.publicKey ?? null,
  };
  const outputPath = writeOperationOutput("burn", output);

  console.log(JSON.stringify({ ...output, outputPath }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
