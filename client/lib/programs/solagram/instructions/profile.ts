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
  const globalState = await pda.getGlobalStatePDA();
  const profileState = await pda.getProfileStatePDA(options.wallet.address);
  const profileCommunicationListState = await pda.getProfileCommunicationListStatePDA(options.wallet.address);

  return platformProgramClient.getCreateProfileInstruction({
    globalState,
    profileState,

    profileCommunicationListState,

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
    const platformTokenState = await pda.getPlatformTokenStatePDA(tokenPlugin);
    const platformTokenTreasuryState = await pda.getPlatformTokenTreasuryStatePDA(tokenPlugin);
    const tokenProfileTreasuryState = await pda.getTokenProfileTreasuryStatePDA(options.wallet.address, tokenPlugin);

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
