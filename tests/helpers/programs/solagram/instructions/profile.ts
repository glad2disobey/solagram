import * as kit from "@solana/kit";

import * as token from "@solana-program/token-2022";

import * as solagramProgramClient from "../../../../../clients/js/src/generated/solagram";

import * as pda from "../pda";

import * as transaction from "../../../transaction";
import * as connection from "../../../connection";

export async function createProfile(wallet: kit.KeyPairSigner, name: string) {
  const globalState = await pda.getGlobalStatePDA();

  const profileState = await pda.getProfileStatePDA(wallet.address);
  const profileCommunicationListState = await pda.getProfileCommunicationListStatePDA(wallet.address);

  const createProfileInstruction = solagramProgramClient.getCreateProfileInstruction({
    globalState: globalState,
    profileState: profileState,

    profileCommunicationListState,

    name,
    signer: wallet,
  });

  const createTokenAccountInstructions = await getCreateTokenAccountInstructions(wallet);

  await transaction.executeTransaction([wallet], [createProfileInstruction, ...createTokenAccountInstructions]);
}

async function getCreateTokenAccountInstructions(
  wallet: kit.KeyPairSigner,
): Promise<solagramProgramClient.CreateTokenAccountInstruction[]> {
  const rpcClient = connection.getRpcClient();

  const tokenPluginListPDA = await pda.getTokenPluginListStatePDA();
  const tokenPluginList = await solagramProgramClient.fetchPubkeyList(rpcClient.rpc, tokenPluginListPDA);

  const createTokenAccountInstructions: solagramProgramClient.CreateTokenAccountInstruction[] = [];

  for await (const tokenPDA of tokenPluginList.data.pubkeys) {
    const platformTokenStatePDA = await pda.getPlatformTokenStatePDA(tokenPDA);
    const platformTokenTreasuryStatePDA = await pda.getPlatformTokenTreasuryStatePDA(tokenPDA);
    const tokenProfileTreasuryStatePDA = await pda.getTokenProfileTreasuryStatePDA(wallet.address, tokenPDA);

    const platformTokenStateAccount = await solagramProgramClient.fetchPlatformTokenState(rpcClient.rpc, platformTokenStatePDA);

    const [associatedTokenAccount] = await token.findAssociatedTokenPda({
      mint: platformTokenStateAccount.data.mintAddress,
      owner: wallet.address,
      tokenProgram: token.TOKEN_2022_PROGRAM_ADDRESS,
    });

    createTokenAccountInstructions.push(solagramProgramClient.getCreateTokenAccountInstruction({
      mint: platformTokenStateAccount.data.mintAddress,

      platformTokenState: platformTokenStatePDA,
      platformTokenTreasuryState: platformTokenTreasuryStatePDA,
      tokenProfileTreasuryState: tokenProfileTreasuryStatePDA,

      associatedTokenAccount: associatedTokenAccount,

      tokenPluginListState: tokenPluginListPDA,
      tokenPlugin: tokenPDA,

      signer: wallet,
    }));
  }

  return createTokenAccountInstructions;
}
