use solana_sdk::{signature::Keypair, signer::Signer};

use crate::test_context::{
    fetch_global_config, initialize_global_config_ix, process_instruction, start_context,
    update_base_metadata_url_ix,
};

#[tokio::test]
async fn update_base_metadata_url_updates_config() {
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

    process_instruction(
        &mut context,
        update_base_metadata_url_ix(payer, "https://example.com/next"),
        &[],
    )
    .await
    .expect("update base metadata url");

    assert_eq!(
        fetch_global_config(&mut context).await.base_metadata_url,
        "https://example.com/next"
    );
}
