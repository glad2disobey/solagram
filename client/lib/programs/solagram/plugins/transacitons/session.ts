import * as kit from "@solana/kit";

import * as platformProgramClient from "../../../../../../clients/js/src/generated/solagram";

import * as instructions from "../instructions";

import * as pda from "../../pda";

import * as transation from "../../../../transaction";
import * as connection from "../../../../connection";

const rpcClient = connection.getRpcClient();

interface SignPlatformSessionInterface {
  session: kit.Address,

  mint: kit.Address,
  
  signer: kit.KeyPairSigner,
}

export async function signPlatformSession(
  options: SignPlatformSessionInterface,
  commitment: kit.Commitment = "confirmed",
) {
  const [pendingSessionList, sessionList] = await getPurgeSessionLists(options.signer.address);

  const [
    purgeProfileSessionsInstruction,
    signPlatformSessionInstruction,
  ] = await Promise.all([
    instructions.session.getPurgeProfileSessionsInstruction({
      pendingSessionList,
      sessionList,
  
      signer: options.signer,
    }),
    instructions.session.getSignPlatformSessionInstruction({
      session: options.session,
  
      mint: options.mint,
  
      signer: options.signer,
    }),
  ]);

  await transation.execute(
    [options.signer],
    [purgeProfileSessionsInstruction, signPlatformSessionInstruction],
    commitment,
  );
}

interface AbortPlatformSessionInterface {
  session: kit.Address,

  tokenPlugin: kit.Address,
  mint: kit.Address,

  signer: kit.KeyPairSigner,
}

export async function abortPlatformSession(
  options: AbortPlatformSessionInterface,
  commitment: kit.Commitment = "confirmed",
) {
  const [
    [pendingSessionList, sessionList],
    platformSessionState,
  ] = await Promise.all([
    getPurgeSessionLists(options.signer.address),
    pda.getPlatformSessionStatePDA(options.session),
  ]);

  const [
    sessionParticipantListState,
    platformSessionStateAccount,
  ] = await Promise.all([
    pda.getSessionParticipantListStatePDA(platformSessionState),
    platformProgramClient.fetchPlatformSessionState(rpcClient.rpc, platformSessionState),
  ]);

  const [
    abortPlatformSessionInstruction,
    purgeProfileSessionsInstruction,
  ] = await Promise.all([
    instructions.session.getAbortPlatformSessionInstruction({
      session: options.session,
  
      tokenPlugin: options.tokenPlugin,
      mint: options.mint,
  
      signer: options.signer,
    }),
    instructions.session.getPurgeProfileSessionsInstruction({
      pendingSessionList,
      sessionList,
  
      signer: options.signer,
    }),
  ]);

  const sessionParticipantListStateAccount =
    await platformProgramClient.fetchPubkeyList(rpcClient.rpc, sessionParticipantListState);

  const sessionParticipantList = sessionParticipantListStateAccount.data.pubkeys;

  const tokenProfileTreasuryStateList = await Promise.all(
    sessionParticipantList.map(participant =>
      pda.getTokenProfileTreasuryStatePDA(
        participant,
        platformSessionStateAccount.data.interest.tokenPlugin,
      )
    )
  );

  tokenProfileTreasuryStateList.forEach(tokenProfileTreasuryState => {
    abortPlatformSessionInstruction.accounts.push({
      address: tokenProfileTreasuryState,
      role: kit.AccountRole.WRITABLE,
    });
  });

  await transation.execute(
    [options.signer],
    [abortPlatformSessionInstruction, purgeProfileSessionsInstruction],
    commitment,
  );
}

interface PurgeProfileSessionsInterface {
  signer: kit.KeyPairSigner,
}

export async function purgeProfileSessions(
  options: PurgeProfileSessionsInterface,
  commitment: kit.Commitment = "confirmed",
) {
  const [pendingSessionList, sessionList] = await getPurgeSessionLists(options.signer.address);

  const purgeProfileSessionsInstruction = await instructions.session.getPurgeProfileSessionsInstruction({
    pendingSessionList,
    sessionList,

    signer: options.signer,
  });

  await transation.execute([options.signer], [purgeProfileSessionsInstruction], commitment);
}

async function getPurgeSessionLists(profile: kit.Address): Promise<kit.Address[][]> {
  const [
    profilePendingSessionListState,
    profileSessionListState,
  ] = await Promise.all([
    pda.getProfilePendingSessionListStatePDA(profile),
    pda.getProfileSessionListStatePDA(profile),
  ]);

  const [
    profilePendingSessionListStateAccount,
    profileSessionListStateAccount,
  ] = await Promise.all([
    platformProgramClient.fetchPubkeyList(rpcClient.rpc, profilePendingSessionListState),
    platformProgramClient.fetchPubkeyList(rpcClient.rpc, profileSessionListState),
  ]);

  const [
    profilePendingSessionListAccounts,
    profileSessionListAccounts,
  ] = await Promise.all([
    platformProgramClient.fetchAllMaybePlatformSessionState(
      rpcClient.rpc,
      profilePendingSessionListStateAccount.data.pubkeys,
    ),
    platformProgramClient.fetchAllMaybePlatformSessionState(
      rpcClient.rpc,
      profileSessionListStateAccount.data.pubkeys,
    ),
  ]);

  return [
    profilePendingSessionListAccounts.filter(session => !session.exists).map(session => session.address),
    profileSessionListAccounts.filter(session => !session.exists).map(session => session.address),
  ];
}
