import { createCollection, fetchCollection } from "@metaplex-foundation/mpl-core";

import {
  assertValidHttpUrl,
  createMetaplexClient,
  readOptionalPublicKeyEnv,
  readOrGenerateSigner,
  readRequiredEnv,
  serializeCollection,
  serializeSignature,
  writeOperationOutput,
} from "./common";

async function main(): Promise<void> {
  const { umi, rpcUrl, keypairPath } = createMetaplexClient();
  const name = readRequiredEnv("COLLECTION_NAME");
  const uri = assertValidHttpUrl("COLLECTION_URI", readRequiredEnv("COLLECTION_URI"));
  const updateAuthority = readOptionalPublicKeyEnv("COLLECTION_UPDATE_AUTHORITY");
  const { signer: collection, keypairPath: collectionKeypairPath } = readOrGenerateSigner(
    umi,
    "COLLECTION_KEYPAIR_PATH",
  );

  const { signature } = await createCollection(umi, {
    collection,
    name,
    uri,
    updateAuthority,
  }).sendAndConfirm(umi);

  const savedCollection = await fetchCollection(umi, collection.publicKey);
  const output = {
    rpcUrl,
    payer: umi.identity.publicKey,
    payerKeypairPath: keypairPath,
    signature: serializeSignature(signature),
    collection: serializeCollection(savedCollection),
    collectionKeypairPath: collectionKeypairPath ?? null,
  };
  const outputPath = writeOperationOutput("create-collection", output);

  console.log(JSON.stringify({ ...output, outputPath }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
