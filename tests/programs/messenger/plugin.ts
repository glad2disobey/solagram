import { before, describe, it } from "node:test";
import assert from "node:assert";

import * as kit from "@solana/kit";

import * as solagramProgramClient from "../../../clients/js/src/generated/solagram";
import * as messengerProgramClient from "../../../clients/js/src/generated/messenger";

import * as lib from "../../../client/lib";

const { solagram, messenger } = lib.programs;

const rpcClient = lib.connection.getRpcClient();

describe("Messenger", async () => {
  let adminWallet: kit.KeyPairSigner;

  let aliceWallet: kit.KeyPairSigner;
  let barryWallet: kit.KeyPairSigner;
  let cindyWallet: kit.KeyPairSigner;

  let aliceConversations: kit.Account<solagramProgramClient.PubkeyList, string>;

  before(async () => {
    adminWallet = await lib.wallet.getAdminWallet();

    aliceWallet = await lib.wallet.makeWallet(3_000_000_000n);
    barryWallet = await lib.wallet.makeWallet(4_000_000_000n);
    cindyWallet = await lib.wallet.makeWallet(5_000_000_000n);
  });

  it("Initialize plugin", async () => {
    await messenger.transactions.initialize.initialize({
      admin: adminWallet,
    });
  })

  it("Create profiles", async () => {
    await solagram.transactions.profile.createProfile({ wallet: aliceWallet, name: "Alice" });
    await solagram.transactions.profile.createProfile({ wallet: barryWallet, name: "Barry" });
    await solagram.transactions.profile.createProfile({ wallet: cindyWallet, name: "Cindy" });
  });

  it("Install plugin", async () => {
    await solagram.transactions.admin.installPlugin({
      wallet: adminWallet,
      plugin: messengerProgramClient.MESSENGER_PROGRAM_ADDRESS,
      pluginType: "communication",
    });
  });

  it("Open conversation", async () => {
    const aliceConversationsPDA = await solagram.pda.getProfileCommunicationListStatePDA(aliceWallet.address);
    aliceConversations = await solagramProgramClient.fetchPubkeyList(rpcClient.rpc, aliceConversationsPDA);
    assert.equal(aliceConversations.data.pubkeys.length, 0);

    await messenger.transactions.conversation.openConversation({ owner: aliceWallet, title: "Test conversation" });

    aliceConversations = await solagramProgramClient.fetchPubkeyList(rpcClient.rpc, aliceConversationsPDA);
    assert.equal(aliceConversations.data.pubkeys.length, 1);
  });

  it("Add message", async () => {
    const platformConversationState = aliceConversations.data.pubkeys[0];

    await messenger.transactions.message.addMessage({
      participant: aliceWallet,
      platformConversationState,
      message: "Hello, world",
    });

    await assert.rejects(messenger.transactions.message.addMessage({
      participant: barryWallet,
      platformConversationState,
      message: "Hello, Alice",
    }));
  });

  it("Add participant", async () => {
    const platformConversationState = aliceConversations.data.pubkeys[0];

    await assert.rejects(messenger.transactions.conversation.addParticipant({
      participant: barryWallet.address,
      signer: cindyWallet,
      platformConversationState: platformConversationState,
    }));

    await messenger.transactions.conversation.addParticipant({
      signer: aliceWallet,
      participant: barryWallet.address,
      platformConversationState: platformConversationState,
    });

    await messenger.transactions.message.addMessage({
      participant: barryWallet,
      platformConversationState,
      message: "Hello, Alice",
    });

    const platformConversationAccount = await solagramProgramClient.fetchPlatformConversationState(
      rpcClient.rpc,
      platformConversationState,
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
  });
});
