import { JsonRpcProvider } from "ethers";
import { hardhat } from "viem/chains";

export enum ChainId {
  Monad = 10143,
  Hardhat = 31337,
}

type ValidChainID = ChainId.Monad | ChainId.Hardhat;

export type ChainIDUrl = {
  [T in ValidChainID]: string;
};

export const readOnlyUrls: ChainIDUrl = {
  [ChainId.Monad]: "https://testnet-rpc.monad.xyz",
  [ChainId.Hardhat]: hardhat.rpcUrls.default.http[0] ?? `http://localhost:8545`,
};

export const blockExplorers: ChainIDUrl = {
  [ChainId.Monad]: `https://testnet.monadexplorer.com`,
  [ChainId.Hardhat]: `https://localhost:8545`,
};

export const TARGET_CHAIN = (parseInt(
  import.meta.env.VITE_TARGET_CHAIN_ID as string
) || ChainId.Hardhat) as ValidChainID;

export const isValidChain = (chainId: ChainId) => {
  return chainId == TARGET_CHAIN;
};

export const chainReadProvider = new JsonRpcProvider(
  readOnlyUrls[TARGET_CHAIN]
);
