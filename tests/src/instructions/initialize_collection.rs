use solana_sdk::{signature::Keypair, signer::Signer};

use crate::test_context::{
    collection_authority_pda, fetch_collection, fetch_global_config, global_config_pda,
    initialize_collection_ix, initialize_global_config_ix, process_instruction, start_context,
};

#[tokio::test]
async fn initialize_collection_persists_collection_and_authority() {
    let mut context = start_context().await;
    let payer = context.payer.pubkey();
    let upgrade_authority = Keypair::new();
    process_instruction(
        &mut context,
        initialize_global_config_ix(
            payer,
            upgrade_authority.pubkey(),
            "https://example.com/base",
        ),
        &[],
    )
    .await
    .expect("initialize global config");

    let collection = Keypair::new();
    process_instruction(
        &mut context,
        initialize_collection_ix(payer, collection.pubkey()),
        &[&collection],
    )
    .await
    .expect("initialize collection");

    let config = fetch_global_config(&mut context).await;
    let (collection_authority, _) = collection_authority_pda(global_config_pda().0);
    assert_eq!(config.collection, collection.pubkey());
    assert_eq!(config.collection_update_authority, collection_authority);

    let collection = fetch_collection(&mut context, collection.pubkey()).await;
    assert_eq!(collection.base.name, "DOOM INDEX");
    assert_eq!(collection.base.update_authority, collection_authority);
}
