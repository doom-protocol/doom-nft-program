use solana_sdk::{signature::Keypair, signature::Signature, signer::Signer};

use crate::test_context::{
    fetch_global_config, initialize_global_config_ix, process_instruction, start_context,
};

#[tokio::test]
async fn initialize_global_config_sets_defaults() {
    let mut context = start_context().await;
    let payer = context.payer.pubkey();
    let upgrade_authority = Keypair::new();
    let base_metadata_url = "https://example.com/doom-index";

    let signature = process_instruction(
        &mut context,
        initialize_global_config_ix(payer, upgrade_authority.pubkey(), base_metadata_url),
        &[],
    )
    .await
    .expect("initialize global config");

    assert_ne!(signature, Signature::default());

    let config = fetch_global_config(&mut context).await;
    assert_eq!(config.admin, context.payer.pubkey());
    assert_eq!(config.upgrade_authority, upgrade_authority.pubkey());
    assert_eq!(config.next_token_id, 1);
    assert!(!config.mint_paused);
    assert_eq!(config.base_metadata_url, base_metadata_url);
}
