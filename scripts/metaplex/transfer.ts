import { fetchAsset, transfer } from "@metaplex-foundation/mpl-core";

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
  const newOwner = readRequiredPublicKeyEnv("NEW_OWNER");
  const authority = readOptionalSignerFromEnv(umi, "AUTHORITY_KEYPAIR_PATH");
  const asset = await fetchAsset(umi, assetAddress);
  const collection = await fetchCollectionForAsset(umi, asset);

  const { signature } = await transfer(umi, {
    asset,
    collection: collection ?? undefined,
    newOwner,
    authority,
  }).sendAndConfirm(umi);

  const transferredAsset = await fetchAsset(umi, assetAddress);
  const linkedCollection = await fetchCollectionForAsset(umi, transferredAsset);
  const output = {
    rpcUrl,
    payer: umi.identity.publicKey,
    payerKeypairPath: keypairPath,
    signature: serializeSignature(signature),
    asset: serializeAsset(transferredAsset),
    collection: linkedCollection ? serializeCollection(linkedCollection) : null,
    authority: authority?.publicKey ?? null,
  };
  const outputPath = writeOperationOutput("transfer", output);

  console.log(JSON.stringify({ ...output, outputPath }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
