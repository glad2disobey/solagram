import { before, describe, it } from "node:test";
import assert from "node:assert";

import * as kit from "@solana/kit";
import * as token from "@solana-program/token-2022";

import * as tokenProgramClient from "../../../clients/js/src/generated/token";

import * as lib from "../../../client/lib";

import * as helpers from "../../helpers";

const { solagram, token: tokenProgram } = lib.programs;

const constants = lib.programs.token.constants;

describe("Token", () => {
  const rpcClient = lib.connection.getRpcClient();

  let adminWallet: kit.KeyPairSigner;
  let aliceWallet: kit.KeyPairSigner;

  let mint: kit.KeyPairSigner;

  const transferFeeExpected = {
    epoch: 0n,

    maximumFee: constants.DEFAULT_MAXIMUM_FEE,
    transferFeeBasisPoints: constants.DEFAULT_TRANSFER_FEE_BASIS_POINTS,
  };

  before(async () => {
    [adminWallet, aliceWallet, mint] = await Promise.all([
      helpers.wallet.getAdminWallet(),
      helpers.wallet.makeWallet(3_000_000_000n),
      kit.generateKeyPairSigner(),
    ]);
  });

  it("Initialize token", async () => {
    await lib.programs.token.transactions.initialize.initialize({
      admin: adminWallet,

      mint,
    });

    const mintAccount = await token.fetchMint(rpcClient.rpc, mint.address);

    const tokenMetadataExtension = lib.token.getExtension(mintAccount, "TokenMetadata");
    assert.deepStrictEqual(tokenMetadataExtension["mint"], mint.address);
    assert.deepStrictEqual(tokenMetadataExtension["name"], constants.TOKEN_NAME);
    assert.deepStrictEqual(tokenMetadataExtension["symbol"], constants.TOKEN_SYMBOL);
    assert.deepStrictEqual(tokenMetadataExtension["uri"], constants.TOKEN_URI);
    assert.deepStrictEqual(kit.unwrapOption(tokenMetadataExtension["updateAuthority"]), adminWallet.address);

    const tokenTransferFeeExtension = lib.token.getExtension(mintAccount, "TransferFeeConfig");
    assert.deepStrictEqual(tokenTransferFeeExtension["olderTransferFee"], transferFeeExpected);
    assert.deepStrictEqual(tokenTransferFeeExtension["newerTransferFee"], transferFeeExpected);
    assert.deepStrictEqual(tokenTransferFeeExtension["transferFeeConfigAuthority"], adminWallet.address);
    assert.deepStrictEqual(tokenTransferFeeExtension["withdrawWithheldAuthority"], adminWallet.address);
  });

  it("Install plugin", async () => {
    await solagram.transactions.admin.installPlugin({
      wallet: adminWallet,
      plugin: tokenProgramClient.TOKEN_PROGRAM_ADDRESS,
      pluginType: "token",
      mint: mint.address,
    });
  });

  it("Mint tokens", async () => {
    const platformTokenTreasuryStatePDA = await solagram.pda.getPlatformTokenTreasuryStatePDA(
      tokenProgramClient.TOKEN_PROGRAM_ADDRESS
    );

    await tokenProgram.transactions.mint.mintTo({
      mint: mint.address,
      authority: adminWallet,
      destination: platformTokenTreasuryStatePDA,
      amount: 100_000n,
    });

    const tokenAccount = await token.fetchToken(rpcClient.rpc, platformTokenTreasuryStatePDA);
    assert.deepStrictEqual(tokenAccount.data.amount, 100_000n);
  });

  it("Create profiles", async () => {
    await solagram.transactions.profile.createProfile({ wallet: aliceWallet, name: "Alice" });

    const profileTreasuryPDA = await solagram.pda
      .getTokenProfileTreasuryStatePDA(aliceWallet.address, tokenProgramClient.TOKEN_PROGRAM_ADDRESS);

    const defaultTokenAirdropAmount = lib.programs.solagram.plugins.constants.DEFAULT_TOKEN_AIRDROP_AMOUNT;
    const expectedTokenAmount = defaultTokenAirdropAmount
      - BigInt(Number(defaultTokenAirdropAmount) * (constants.DEFAULT_TRANSFER_FEE_BASIS_POINTS / 10000));

    const profileTreasuryAccount = await token.fetchToken(rpcClient.rpc, profileTreasuryPDA);
    assert.deepStrictEqual(profileTreasuryAccount.data.amount, BigInt(expectedTokenAmount));
  });
});
