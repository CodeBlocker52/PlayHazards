import BITToken from "artifacts/contracts/BITToken.sol/BITToken.json";
import BrainNFT from "artifacts/contracts/BrainNFT.sol/BrainNFT.json";
import { ChainId, ChainIDUrl, TARGET_CHAIN } from "config/chains";

// Use the ChainId from chains.ts to ensure consistency
const bitTokenAddresses: ChainIDUrl = {
  [ChainId.Hardhat]: "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9",
  [ChainId.Monad]: "0xcEF6B5286eC1d0d2a50d84e2222063424993034D",
};

const nftTokenAddresses: ChainIDUrl = {
  [ChainId.Hardhat]: "0x8a791620dd6260079bf849dc5567adc3f2fdc318",
  [ChainId.Monad]: "0x9EC9E9e2AcF033Cc75EBd055CFd2367Bb4B1c984",
};

export const BITContract = {
  abi: BITToken.abi,
  address: bitTokenAddresses[TARGET_CHAIN],
};

export const NFTContract = {
  abi: BrainNFT.abi,
  address: nftTokenAddresses[TARGET_CHAIN],
};