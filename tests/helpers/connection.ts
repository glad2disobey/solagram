import * as kit from "@solana/kit";

export type RpcClient = {
	rpc: kit.Rpc<kit.SolanaRpcApi>,
	rpcSubscriptions: kit.RpcSubscriptions<kit.SolanaRpcSubscriptionsApi>,
}

let rpcClient: RpcClient | null;

export function getRpcClient() {
  if (rpcClient) return rpcClient;

  return rpcClient = {
    rpc: kit.createSolanaRpc("http://localhost:8899"),
    rpcSubscriptions: kit.createSolanaRpcSubscriptions("ws://localhost:8900"),
  };
}
