use solana_sdk::{signature::Keypair, signer::Signer};

use crate::test_context::{
    fetch_global_config, fetch_reservation, initialize_global_config_ix, process_instruction,
    reserve_token_id_ix, start_context,
};

#[tokio::test]
async fn reserve_token_id_creates_reservation_and_increments_counter() {
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

    process_instruction(&mut context, reserve_token_id_ix(payer, 1), &[])
        .await
        .expect("reserve token id");

    let reservation = fetch_reservation(&mut context, 1).await;
    assert_eq!(reservation.token_id, 1);
    assert_eq!(reservation.reserver, context.payer.pubkey());
    assert!(!reservation.minted);

    let config = fetch_global_config(&mut context).await;
    assert_eq!(config.next_token_id, 2);
}
