use solana_program_test::BanksClientError;
use solana_sdk::{signature::Keypair, signer::Signer};

use crate::test_context::{
    fetch_asset, fetch_reservation, initialize_collection_ix, initialize_global_config_ix,
    mint_doom_index_nft_ix, process_instruction, reserve_token_id_ix, start_context,
};

#[tokio::test]
async fn mint_with_valid_reservation_creates_core_asset() {
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

    process_instruction(&mut context, reserve_token_id_ix(payer, 1), &[])
        .await
        .expect("reserve token id");

    let asset = Keypair::new();
    process_instruction(
        &mut context,
        mint_doom_index_nft_ix(payer, 1, asset.pubkey(), collection.pubkey()),
        &[&asset],
    )
    .await
    .expect("mint doom index nft");

    let reservation = fetch_reservation(&mut context, 1).await;
    assert!(reservation.minted);

    let asset = fetch_asset(&mut context, asset.pubkey()).await;
    assert_eq!(asset.base.name, "DOOM INDEX #1");
    assert_eq!(asset.base.uri, "https://example.com/base/1.json");
    assert_eq!(asset.base.owner, context.payer.pubkey());
}

#[tokio::test]
async fn mint_without_reservation_fails() {
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

    let asset = Keypair::new();
    let error = process_instruction(
        &mut context,
        mint_doom_index_nft_ix(payer, 1, asset.pubkey(), collection.pubkey()),
        &[&asset],
    )
    .await
    .expect_err("mint should fail without reservation");

    assert!(matches!(error, BanksClientError::TransactionError(_)));
}
