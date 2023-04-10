> :warning: **Work in progress**
> This program was not completed, and has not been tested in production.

<br/>

![](banner.jpeg)


<div align="center">
  <h1>Formfunction Campaign Treasury Manager</h1>
  <a href="#overview">Overview</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="#repo-structure">Repo Structure</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="#initial-environment-setup">Initial Environment Setup</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="#getting-started">Getting Started</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="#testing">Testing</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="#releases">Releases</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="#tips">Tips</a>
  <br />
  <hr />
</div>

# Overview

This repo contains the Formfunction campaign treasury manager program and SDK. The goals of this program are as follows:

1. A campaign’s treasury can be funded by a generative mint sale and/or auction house sales (e.g. auctions, instant sales, editions, offers). The treasury mint will be either SOL or USDC, but we will not have mixed treasuries.
    
    If a creator wants to keep a treasury in part SOL and part USDC, the recommendation will be to tune the initial payout to an appropriate level (assuming this is configurable) and then set the treasury to their preferred token. They can then swap the initial payout to the other token, once the initial payout occurs.
    
2. If a campaign **does not** meet its goal within the specified time period, NFTs holders can claim a full refund (minus Solana transaction fees).
    
    Supporter **must burn** their NFT to claim a refund.
    
    1. This applies to all kinds of NFTs (1/1s, editions, gacha mints, etc.).
    2. There would be a limited time window during which burning is allowed.
    
    Refunds are denominated in the treasury mint.
    
    If an NFT is not burned, the buyer keeps the NFT, and the creator keeps the funds.
    
3. If the campaign **********does********** meet its goal…
    1. Some initial payout percentage of the funds will be immediately given to the creator. This number should be configurable.
    2. The rest of the funds will be released in ******phases******. We (Formfunction) can veto the phases, in which case users will get partially refunded. The number of phases and the payout percentage for each phase should be configurable. A future follow-up may allow campaign supporters to veto payout phases.

> 💡 Note that in our product, we will probably start with hardcoded phases and not expose the configuration logic to creators. E.g. by default, 50% would be paid out immediately, then 25% after 3 months, and then 25% after 6 months.

## Repo Structure

```.
├── artifacts                      # 3rd party program binaries (from solana program dump command)
├── keys                           # Program keypairs for devnet and testnet deployments
├── programs                       # Rust program source code
│   └── campaign-treasury-manager  # Program code
├── scripts                        # Some helper bash scripts for the repo
├── src                            # TypeScript source folder
│   ├── scripts                    # SDK specific scripts
│   ├── sdk                        # SDK source folder
│   ├── tests                      # Tests and test related code
│   └── index.ts                   # SDK library exports
├── ...                            # Other project config files and folders
└── README.md
```

## Initial Environment Setup

Complete the following to setup your environment:

1. Install [Node.js](https://nodejs.org/en) (and [nvm](https://github.com/nvm-sh/nvm) if you want).
2. Follow the [Anchor setup instructions](https://book.anchor-lang.com/chapter_2/installation.html). After this you should have Rust, Solana, Yarn and Anchor installed on your system.

## Getting Started

Once you have your environment setup you can run the following:

```sh
# Install dependencies
$ yarn

# Run setup steps
$ yarn setup
```

The following commands are also available:

```sh
# Run prettier checks
$ yarn prettier

# Run eslint checks
$ yarn eslint

# Run prettier and eslint with auto-fix flag
$ yarn lint

# Compile the program
$ yarn build-program

# Compile TypeScript code
$ yarn tsc

# Build the TS SDK
$ yarn build-sdk

# Build everything
$ yarn build

# Run all tests (see more on testing below)
$ yarn test
```

## Testing

There are several different tests included in the repo. To explain them and how to run them it's easier to just look at the npm scripts which are available (note: keep this in sync with `package.json`):

```sh
# Run unit tests for TS SDK utils and helper functions.
$ yarn test-unit

# Run cargo tests
$ yarn test-cargo
$ yarn test-cargo-debug

# Run program tests using SDK client with a local validator.
$ yarn test-program
$ yarn test-program-debug

# Run all the tests in one go.
$ yarn test
```

## Releases

Releases are based on git tags. There is a GitHub Action which is responsible for running releases.

The Solana program and TS SDK are versioned separately.

### Crate

To publish a new version of this crate, [follow the steps here](https://www.notion.so/formfunction/Shipyard-Private-Crate-Registry-9e74df6df9714c3085661639363931c8#7dae84725f314f21905ae704a15e7a3f).

### Solana Program

For the Solana program we build a binary using Anchor. To publish a new binary:

1. Increment the version in the program `Cargo.toml` file.
2. Push a commit to the `main` branch in GitHub.

Note that if the Anchor version is upgraded you should update the anchor version in the GitHub action as well.

### Devnet Deployment

Run the following to deploy or upgrade the program on devnet or testnet:

```bash
# Set your CLI to the appropriate cluster.
$ solana config set -u devnet|testnet

# Get the deployer account address.
$ solana-keygen pubkey keys/devnet/deployer-keypair.json

# Ensure you have enough SOL. Repeat the following until you have ~10 SOL or more.
$ solana airdrop 1 G1K5YZmhg1LqaYUC9VXWK7YLCdwqJcVPLpgBt5tmUWVf

# Test, build and deploy the program. Pass argument for network.
$ yarn deploy-program devnet|testnet
```

To deploy the program from scratch to a new program address, do the following:

- Update the `DEPLOY_PROGRAM_ID` in `deploy-program.sh`.
- Add the new program address in `Anchor.toml` and all of the Anchor configs in `scripts/anchor-configs`.
- Add the new program and config keypairs for devnet/testnet in `keys/`.
- Update the address in `keys/README`.
- Run the above deploy steps.

### Mainnet Deployment

The program is not yet deployed on mainnet.

### TypeScript SDK

Follow the following steps to publish a new version of the TypeScript SDK:

1. Run `yarn version` and enter a new appropriate [semver version](https://docs.npmjs.com/about-semantic-versioning) for the npm package. That will create a new tag and commit.
2. Run `git push origin NEW_TAG`.
3. `git push` the new commit as well.

This will push the new release tag to GitHub and trigger the release pipeline, after which clients can install the latest SDK.

## Tips

Feel free to run `cargo clippy` ([Clippy](https://github.com/rust-lang/rust-clippy)) once in a while to see if there are any recommended improvements for the Rust code.
