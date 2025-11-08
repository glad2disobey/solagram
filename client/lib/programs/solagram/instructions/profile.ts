import * as kit from "@solana/kit";

import * as token from "@solana-program/token-2022";

import * as platformProgramClient from "../../../../../clients/js/src/generated/solagram";

import * as pda from "../pda";

import * as connection from "../../../connection";

interface GetCreateProfileInstructionInterface {
  name: string,

  wallet: kit.KeyPairSigner,
}

export async function getCreateProfileInstruction(
  options: GetCreateProfileInstructionInterface,
): Promise<platformProgramClient.CreateProfileInstruction> {
  const [
    globalState,
    profileState,
    profileCommunicationListState,
    profileSessionListState,
    profilePendingSessionListState
  ] = await Promise.all([
    pda.getGlobalStatePDA(),
    pda.getProfileStatePDA(options.wallet.address),
    pda.getProfileCommunicationListStatePDA(options.wallet.address),
    pda.getProfileSessionListStatePDA(options.wallet.address),
    pda.getProfilePendingSessionListStatePDA(options.wallet.address)
  ]);

  return platformProgramClient.getCreateProfileInstruction({
    globalState,

    profileState,

    profileCommunicationListState,

    profileSessionListState,
    profilePendingSessionListState,

    name: options.name,

    signer: options.wallet,
  }) as platformProgramClient.CreateProfileInstruction;
}

interface GetCreateTokenAccountInstructionsInterface {
  wallet: kit.KeyPairSigner,
}

export async function getCreateTokenAccountInstructions(
  options: GetCreateTokenAccountInstructionsInterface,
): Promise<platformProgramClient.CreateTokenAccountInstruction[]> {
  const rpcClient = connection.getRpcClient();

  const tokenPluginListState = await pda.getTokenPluginListStatePDA();
  const tokenPluginListStateAccount = await platformProgramClient.fetchPubkeyList(rpcClient.rpc, tokenPluginListState);

  const createTokenAccountInstructions: platformProgramClient.CreateTokenAccountInstruction[] = [];

  for await (const tokenPlugin of tokenPluginListStateAccount.data.pubkeys) {
    const [
      platformTokenState,
      platformTokenTreasuryState,
      tokenProfileTreasuryState,
    ] = await Promise.all([
      pda.getPlatformTokenStatePDA(tokenPlugin),
      pda.getPlatformTokenTreasuryStatePDA(tokenPlugin),
      pda.getTokenProfileTreasuryStatePDA(options.wallet.address, tokenPlugin),
    ]);

    const platformTokenStateAccount = await platformProgramClient.fetchPlatformTokenState(rpcClient.rpc, platformTokenState);

    const [associatedTokenAccount] = await token.findAssociatedTokenPda({
      mint: platformTokenStateAccount.data.mintAddress,
      owner: options.wallet.address,
      tokenProgram: token.TOKEN_2022_PROGRAM_ADDRESS,
    });

    createTokenAccountInstructions.push(platformProgramClient.getCreateTokenAccountInstruction({
      platformTokenState,
      platformTokenTreasuryState,
      tokenProfileTreasuryState,

      mint: platformTokenStateAccount.data.mintAddress,

      associatedTokenAccount,

      tokenPluginListState,
      tokenPlugin,

      signer: options.wallet,
    }));
  }

  return createTokenAccountInstructions;
}
