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

```bash
# Initialize global config on devnet
bun run devnet:init

# Reserve the next token id on devnet
bun run devnet:reserve

# Mint a DOOM INDEX NFT on devnet
bun run devnet:mint
```

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
├── build-test-sbf.sh      # Fetches the Core program artifact for tests
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
- The contract test flow avoids a local SBF build of this program and runs it as a host builtin, while loading the official `mpl_core` program binary.
- Devnet deployment may still depend on Solana faucet availability.
