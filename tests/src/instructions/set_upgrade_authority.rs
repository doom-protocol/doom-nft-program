use solana_sdk::{signature::Keypair, signer::Signer};

use crate::test_context::{
    fetch_global_config, initialize_global_config_ix, process_instruction,
    set_upgrade_authority_ix, start_context,
};

#[tokio::test]
async fn upgrade_authority_is_independent_from_admin() {
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

    let next_upgrade_authority = Keypair::new();
    process_instruction(
        &mut context,
        set_upgrade_authority_ix(upgrade_authority.pubkey(), next_upgrade_authority.pubkey()),
        &[&upgrade_authority],
    )
    .await
    .expect("set upgrade authority");

    let config = fetch_global_config(&mut context).await;
    assert_eq!(config.admin, payer);
    assert_eq!(config.upgrade_authority, next_upgrade_authority.pubkey());
}
