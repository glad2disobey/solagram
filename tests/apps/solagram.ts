import { before, describe, it } from "node:test";
import assert from "node:assert";

import * as kit from "@solana/kit";

import * as anchor from "@coral-xyz/anchor";

import * as programClient from "../../clients/js/src/generated";

import * as helpers from "../helpers";

describe("profile", async () => {
  const rpcClient = helpers.connection.getRpcClient();

  async function checkFunds() {
    const [aliceBalance, barryBalance, cindyBalance] = await Promise.all(
      [aliceWallet, barryWallet, cindyWallet]
        .map(wallet => rpcClient.rpc.getBalance(wallet.address).send())
    );

    console.log("Alice's balance: ", aliceBalance);
    console.log("Barry's balance: ", barryBalance);
    console.log("Cindy's balance: ", cindyBalance);
  }

  async function initializeProgram(wallet: kit.KeyPairSigner): Promise<kit.Address> {
    const [globalStatePDA] = await kit.getProgramDerivedAddress({
      programAddress: programClient.SOLAGRAM_PROGRAM_ADDRESS,
      seeds: helpers.encoder.encodeSeeds(["global_state"]),
    });

    const initializeGlobalStateInstruction = programClient.getInitializeGlobalStateInstruction({
      admin: wallet,
      globalState: globalStatePDA,
      adminArg: wallet.address,
    });

    await kit.pipe(
      await helpers.transaction.createTransactionBasement(wallet),
      (tx) => kit.appendTransactionMessageInstruction(initializeGlobalStateInstruction, tx),
      (tx) => helpers.transaction.signAndSendTransaction(tx),
    );

    return globalStatePDA;
  }

  async function createProfile(wallet: kit.KeyPairSigner, name: string): Promise<kit.Address> {
    const [profilePDA] = await kit.getProgramDerivedAddress({
      programAddress: programClient.SOLAGRAM_PROGRAM_ADDRESS,
      seeds: helpers.encoder.encodeSeeds(["profile", wallet.address]),
    });

    const createProfileInstruction = programClient.getCreateProfileInstruction({
      name,
      signer: wallet,
      profile: profilePDA,
      globalState: globalStatePDA,
    });

    await kit.pipe(
      await helpers.transaction.createTransactionBasement(wallet),
      (tx) => kit.appendTransactionMessageInstruction(createProfileInstruction, tx),
      (tx) => helpers.transaction.signAndSendTransaction(tx),
    );

    return profilePDA;
  }

  let adminWallet: kit.KeyPairSigner;

  let aliceWallet, barryWallet, cindyWallet: kit.KeyPairSigner;
  let aliceProfileAddress, barryProfileAddress, cindyProfileAddress: kit.Address;

  let globalStatePDA: kit.Address;

  const abortControllers: AbortController[] = [];

  before(async () => {
    adminWallet = await helpers.wallet.makeWallet();

    aliceWallet = await helpers.wallet.makeWallet(3_000_000_000n);
    barryWallet = await helpers.wallet.makeWallet();
    cindyWallet = await helpers.wallet.makeWallet(0n);

    await checkFunds();
  });

  it("Create profiles", async () => {
    globalStatePDA = await initializeProgram(adminWallet);

    aliceProfileAddress = await createProfile(aliceWallet, "Alice");
    barryProfileAddress = await createProfile(barryWallet, "Barry");
    
    await assert.rejects(createProfile(cindyWallet, "Cindy"));
    await checkFunds();

    await helpers.wallet.airdropToWallet(cindyWallet, 1_000_000_000n);

    await assert.rejects(createProfile(cindyWallet, "VeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryLongName"));

    cindyProfileAddress = await createProfile(cindyWallet, "Cindy");
    await checkFunds();

    await assert.rejects(createProfile(barryWallet, "Barry"));
  });

  it("Check profiles", async () => {
    const [aliceProfile, barryProfile, cindyProfile] = await programClient.fetchAllProfile(rpcClient.rpc, [
      aliceProfileAddress,
      barryProfileAddress,
      cindyProfileAddress,
    ]);

    assert.equal(aliceProfile.data.name, "Alice");
    assert.equal(barryProfile.data.name, "Barry");
    assert.equal(cindyProfile.data.name, "Cindy");
  });
});
