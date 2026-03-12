# Doom NFT Program

This repository contains the Solana program for minting DOOM INDEX artworks as NFTs. It is built with Anchor and currently targets a Metaplex Core based mint flow with deterministic metadata URIs.

## Features

- **Collection setup**: Initialize the DOOM INDEX collection on Metaplex Core
- **Token reservation**: Reserve a sequential `tokenId` before minting
- **NFT minting**: Mint a DOOM INDEX NFT from a valid reservation
- **Admin controls**: Manage base metadata URL, pause state, admin authority, and upgrade authority
- **Contract tests**: Run Rust integration tests against the real Core CPI path

## Tech Stack

- **Blockchain**: Solana
- **Framework**: Anchor
- **Language**: Rust
- **NFT Standard**: Metaplex Core
- **Testing**: Rust `solana-program-test`, Bun
- **Package Manager**: Bun

## Prerequisites

- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.anza.xyz/cli/install)
- [Anchor](https://www.anchor-lang.com/)
- [Bun](https://bun.sh/)

## Installation

```bash
# Clone the repository
git clone https://github.com/doom-protocol/doom-nft-program.git
cd doom-nft-program

# Install dependencies
bun install

# Install git hooks
bun run prepare

# Optional: point Solana CLI at devnet
solana config set --url https://api.devnet.solana.com

# Optional: create a local keypair if you do not have one yet
solana-keygen new
```

## Build

```bash
# Build the Rust workspace
cargo build --workspace

# Build the contract test SBF dependency artifact
bun run build:sbf:test
```

## Test

```bash
# Run Rust unit tests plus contract tests
bun run test

# Run only the contract test suite
bun run test:contract

# Run the full local quality gate
bun run check
```

## Development Scripts

### Program-Driven Devnet Flow

```bash
# Initialize global config on devnet
bun run devnet:init

# Reserve the next token id on devnet
bun run devnet:reserve

# Mint a DOOM INDEX NFT on devnet
bun run devnet:mint
```

These scripts call the Anchor program in this repository and keep the deterministic `tokenId -> {base_metadata_url}/{tokenId}.json` flow intact.

### Direct Metaplex Core Scripts

These scripts follow the official Metaplex NFT/Core client flow and are useful when you want to create, inspect, or manage Core assets directly from a wallet without going through the DOOM program instructions.

```bash
# Create a Core collection
COLLECTION_NAME="DOOM TEST" \
COLLECTION_URI="https://example.com/collection.json" \
bun run metaplex:create:collection

# Create or mint a Core asset
NFT_NAME="DOOM INDEX #1" \
NFT_URI="https://example.com/1.json" \
bun run metaplex:create

# Alias for create
NFT_NAME="DOOM INDEX #1" \
NFT_URI="https://example.com/1.json" \
bun run metaplex:mint

# Fetch an asset or collection
TARGET_KIND=asset \
TARGET_ADDRESS=<asset-or-collection-address> \
bun run metaplex:fetch

# Update asset metadata or update authority
ASSET_ADDRESS=<asset-address> \
NFT_URI="https://example.com/1-updated.json" \
bun run metaplex:update

# Transfer an asset
ASSET_ADDRESS=<asset-address> \
NEW_OWNER=<recipient-address> \
bun run metaplex:transfer

# Burn an asset
ASSET_ADDRESS=<asset-address> \
bun run metaplex:burn
```

Common env vars for the Metaplex scripts:

- `SOLANA_RPC_URL`: RPC endpoint override. Falls back to `ANCHOR_PROVIDER_URL`, then devnet.
- `KEYPAIR_PATH`: Wallet keypair override. Falls back to `ANCHOR_WALLET`, then `Anchor.toml`, then `~/.config/solana/id.json`.
- `OUTPUT_PATH`: Custom JSON output path. Default is `target/devnet/metaplex/<operation>.json`.
- `AUTHORITY_KEYPAIR_PATH`: Optional authority signer for collection-authority, update-authority, owner, or delegate operations.
- `COLLECTION_ADDRESS`: Optional collection address when creating an asset inside a collection.
- `ASSET_KEYPAIR_PATH` / `COLLECTION_KEYPAIR_PATH`: Optional persisted signer path for the new asset or collection account.

## Repository Structure

```text
programs/doom-nft-program/
├── src/
│   ├── instructions/      # Instruction handlers
│   ├── state/             # On-chain account state
│   ├── constants.rs       # Program constants
│   ├── error.rs           # Custom errors
│   ├── events.rs          # Program events
│   ├── lib.rs             # Program entrypoint
│   └── utils.rs           # Shared helpers
├── Cargo.toml
└── Xargo.toml

tests/src/
├── instructions/          # Source-aligned contract tests
├── lib.rs                 # Test module entrypoint
└── test_context.rs        # Shared test fixtures and helpers

scripts/
├── build-test-sbf.sh      # Copies the pinned Core test fixture into target/test-sbf
├── test-contract-v1.sh    # Runs the contract suite
└── devnet/                # Devnet helper scripts
```

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push the branch: `git push origin feature/amazing-feature`
5. Open a pull request.

## License

This project is released under the MIT License.

## Notes

- The program is still under active development.
- The contract test flow avoids a local SBF build of this program and runs it as a host builtin, while loading the pinned official Metaplex Core `release/core@0.9.10` fixture for the Core CPI path.
- Devnet deployment may still depend on Solana faucet availability.
