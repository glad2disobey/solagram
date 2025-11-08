import * as kit from "@solana/kit";

export type RpcClient = {
	rpc: kit.Rpc<kit.SolanaRpcApi>,
	rpcSubscriptions: kit.RpcSubscriptions<kit.SolanaRpcSubscriptionsApi>,
}

let rpcClient: RpcClient;

export function getRpcClient() {
  if (rpcClient !== undefined) return rpcClient;

  return rpcClient = {
    rpc: kit.createSolanaRpc("http://localhost:8899"),
    rpcSubscriptions: kit.createSolanaRpcSubscriptions("ws://localhost:8900"),
  };
}
