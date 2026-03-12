# Test Fixtures

`mpl_core_program.so` is the pinned Metaplex Core fixture used by the contract tests.

- Source release: `release/core@0.9.10`
- Source asset: `https://github.com/metaplex-foundation/mpl-core/releases/download/release/core%400.9.10/mpl_core_program.so`
- Expected checksum: see [`mpl_core_program.so.sha256`](./mpl_core_program.so.sha256)
- Purpose: keep `ProgramTest` deterministic without dumping the live upgradeable Core program from the network
