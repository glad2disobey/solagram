import { before, describe, it } from "node:test";
import assert from "node:assert";

import * as kit from "@solana/kit";

import * as solagramProgramClient from "../../../clients/js/src/generated/solagram";
import * as messengerProgramClient from "../../../clients/js/src/generated/messenger";

import * as helpers from "../../helpers";

const { solagram, messenger } = helpers.programs;

const rpcClient = helpers.connection.getRpcClient();

describe("Messenger", async () => {
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

  let adminWallet: kit.KeyPairSigner;

  let aliceWallet: kit.KeyPairSigner;
  let barryWallet: kit.KeyPairSigner;
  let cindyWallet: kit.KeyPairSigner;

  let aliceConversations: kit.Account<solagramProgramClient.PubkeyList, string>;

  before(async () => {
    adminWallet = await helpers.wallet.getAdminWallet();

    aliceWallet = await helpers.wallet.makeWallet(3_000_000_000n);
    barryWallet = await helpers.wallet.makeWallet(4_000_000_000n);
    cindyWallet = await helpers.wallet.makeWallet(5_000_000_000n);

    await checkFunds();
  });

  it("Initialize plugin", async () => {
    await messenger.instructions.initialize.initializePlugin(
      adminWallet,
      solagramProgramClient.SOLAGRAM_PROGRAM_ADDRESS,
    );
  })

  it("Create profiles", async () => {
    await solagram.instructions.profile.createProfile(aliceWallet, "Alice");
    await solagram.instructions.profile.createProfile(barryWallet, "Barry");
    await solagram.instructions.profile.createProfile(cindyWallet, "Cindy");
  });

  it("Install plugin", async () => {
    await solagram.instructions.admin.installPlugin(
      adminWallet,
      messengerProgramClient.MESSENGER_PROGRAM_ADDRESS,
      "communication",
    );
  });

  it("Open conversation", async () => {
    const aliceConversationsPDA = await solagram.pda.getProfileCommunicationListStatePDA(aliceWallet.address);
    aliceConversations = await solagramProgramClient.fetchPubkeyList(rpcClient.rpc, aliceConversationsPDA);
    assert.equal(aliceConversations.data.pubkeys.length, 0);

    await messenger.instructions.conversation.openConversation(aliceWallet, "Test conversation");

    aliceConversations = await solagramProgramClient.fetchPubkeyList(rpcClient.rpc, aliceConversationsPDA);
    assert.equal(aliceConversations.data.pubkeys.length, 1);
  });

  it("Add message", async () => {
    const platformConversationPDA = aliceConversations.data.pubkeys[0];

    await messenger.instructions.message.addMessage(aliceWallet, platformConversationPDA, "Hello, world");

    await assert.rejects(messenger.instructions.message.addMessage(barryWallet, platformConversationPDA, "Hello, Alice"));
  });

  it("Add participant", async () => {
    const platformConversationPDA = aliceConversations.data.pubkeys[0];

    await assert.rejects(messenger.instructions.conversation.addParticipant(
      cindyWallet,
      barryWallet.address,
      platformConversationPDA,
    ));

    await messenger.instructions.conversation.addParticipant(aliceWallet, barryWallet.address, platformConversationPDA);

    await messenger.instructions.message.addMessage(barryWallet, platformConversationPDA, "Hello, Alice");

    const platformConversationAccount = await solagramProgramClient.fetchPlatformConversationState(
      rpcClient.rpc,
      platformConversationPDA,
    );

    const conversationAccount = await messengerProgramClient.fetchConversationState(
      rpcClient.rpc,
      platformConversationAccount.data.conversation,
    );

    const barryMessage = await messengerProgramClient.fetchMessageState(rpcClient.rpc, conversationAccount.data.message);
    assert.equal(barryMessage.data.messageText, "Hello, Alice");
    assert.equal(barryMessage.data.authority, barryWallet.address);

    const aliceMessage = await messengerProgramClient.fetchMessageState(rpcClient.rpc, barryMessage.data.previousMessage);
    assert.equal(aliceMessage.data.messageText, "Hello, world");
    assert.equal(aliceMessage.data.authority, aliceWallet.address);

    await checkFunds();
  });
});
