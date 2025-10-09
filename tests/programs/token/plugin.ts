import { before, describe, it } from "node:test";
import assert from "node:assert";

import * as kit from "@solana/kit";
import * as token from "@solana-program/token-2022";

import * as tokenProgramClient from "../../../clients/js/src/generated/token";

import * as helpers from "../../helpers";

const { solagram, token: tokenProgram } = helpers.programs;

const constants = helpers.programs.token.constants;

describe("Token", () => {
  const rpcClient = helpers.connection.getRpcClient();

  let adminWallet: kit.KeyPairSigner;
  let aliceWallet: kit.KeyPairSigner;

  let mint: kit.KeyPairSigner;

  const transferFeeExpected = {
    epoch: 0n,

    maximumFee: constants.DEFAULT_MAXIMUM_FEE,
    transferFeeBasisPoints: constants.DEFAULT_TRANSFER_FEE_BASIS_POINTS,
  };

  before(async () => {
    adminWallet = await helpers.wallet.getAdminWallet();

    aliceWallet = await helpers.wallet.makeWallet(3_000_000_000n);

    mint = await kit.generateKeyPairSigner();
  });

  it("Initialize token", async () => {
    await helpers.programs.token.instructions.initialize.initializePlugin(
      adminWallet,

      mint,
    );

    const mintAccount = await token.fetchMint(rpcClient.rpc, mint.address);

    const tokenMetadataExtension = helpers.token.getExtension(mintAccount, "TokenMetadata");
    assert.deepStrictEqual(tokenMetadataExtension["mint"], mint.address);
    assert.deepStrictEqual(tokenMetadataExtension["name"], constants.TOKEN_NAME);
    assert.deepStrictEqual(tokenMetadataExtension["symbol"], constants.TOKEN_SYMBOL);
    assert.deepStrictEqual(tokenMetadataExtension["uri"], constants.TOKEN_URI);
    assert.deepStrictEqual(kit.unwrapOption(tokenMetadataExtension["updateAuthority"]), adminWallet.address);

    const tokenTransferFeeExtension = helpers.token.getExtension(mintAccount, "TransferFeeConfig");
    assert.deepStrictEqual(tokenTransferFeeExtension["olderTransferFee"], transferFeeExpected);
    assert.deepStrictEqual(tokenTransferFeeExtension["newerTransferFee"], transferFeeExpected);
    assert.deepStrictEqual(tokenTransferFeeExtension["transferFeeConfigAuthority"], adminWallet.address);
    assert.deepStrictEqual(tokenTransferFeeExtension["withdrawWithheldAuthority"], adminWallet.address);
  });

  it("Install plugin", async () => {
    await solagram.instructions.admin.installPlugin(
      adminWallet,
      tokenProgramClient.TOKEN_PROGRAM_ADDRESS,
      "token",
      { mint: mint.address },
    );
  });

  it("Mint tokens", async () => {
    const platformTokenTreasuryStatePDA = await solagram.pda.getPlatformTokenTreasuryStatePDA(
      tokenProgramClient.TOKEN_PROGRAM_ADDRESS
    );

    await tokenProgram.instructions.mintTo.mintTo({
      mint: mint.address,
      authority: adminWallet,
      destination: platformTokenTreasuryStatePDA,
      amount: 100_000n,
    });

    const tokenAccount = await token.fetchToken(rpcClient.rpc, platformTokenTreasuryStatePDA);
    assert.deepStrictEqual(tokenAccount.data.amount, 100_000n);
  });

  it("Create profiles", async () => {
    await solagram.instructions.profile.createProfile(aliceWallet, "Alice");

    const profileTreasuryPDA = await solagram.pda
      .getTokenProfileTreasuryStatePDA(aliceWallet.address, tokenProgramClient.TOKEN_PROGRAM_ADDRESS);

    const defaultTokenAirdropAmount = helpers.programs.solagram.plugins.constants.DEFAULT_TOKEN_AIRDROP_AMOUNT;
    const expectedTokenAmount = defaultTokenAirdropAmount
      - defaultTokenAirdropAmount * (constants.DEFAULT_TRANSFER_FEE_BASIS_POINTS / 10000);

    const profileTreasuryAccount = await token.fetchToken(rpcClient.rpc, profileTreasuryPDA);
    assert.deepStrictEqual(profileTreasuryAccount.data.amount, BigInt(expectedTokenAmount));
  });
});
