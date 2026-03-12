import { fetchAsset, fetchCollection } from "@metaplex-foundation/mpl-core";

import {
  createMetaplexClient,
  fetchCollectionForAsset,
  readRequiredEnv,
  readRequiredPublicKeyEnv,
  serializeAsset,
  serializeCollection,
  writeOperationOutput,
} from "./common";

async function main(): Promise<void> {
  const { umi, rpcUrl, keypairPath } = createMetaplexClient();
  const targetKind = readRequiredEnv("TARGET_KIND");
  const targetAddress = readRequiredPublicKeyEnv("TARGET_ADDRESS");

  if (targetKind !== "asset" && targetKind !== "collection") {
    throw new Error("TARGET_KIND must be either 'asset' or 'collection'");
  }

  const output =
    targetKind === "asset"
      ? await fetchAssetOutput(umi, targetAddress)
      : { targetKind, target: serializeCollection(await fetchCollection(umi, targetAddress)) };
  const result = {
    rpcUrl,
    payer: umi.identity.publicKey,
    payerKeypairPath: keypairPath,
    ...output,
  };
  const outputPath = writeOperationOutput("fetch", result);

  console.log(JSON.stringify({ ...result, outputPath }, null, 2));
}

async function fetchAssetOutput(
  umi: ReturnType<typeof createMetaplexClient>["umi"],
  targetAddress: string,
): Promise<{
  targetKind: "asset";
  target: ReturnType<typeof serializeAsset>;
  collection: ReturnType<typeof serializeCollection> | null;
}> {
  const asset = await fetchAsset(umi, targetAddress);
  const collection = await fetchCollectionForAsset(umi, asset);

  return {
    targetKind: "asset",
    target: serializeAsset(asset),
    collection: collection ? serializeCollection(collection) : null,
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
