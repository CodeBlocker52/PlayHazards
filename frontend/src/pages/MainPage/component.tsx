import clsx from "clsx";
import { useCoinsContext } from "config/context";
import { BITContract, NFTContract } from "config/contracts";
import { SyncIcon } from "core";
import { formatEther, parseEther } from "viem";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { NFTCard, VerticalNavigationTemplate } from "components";

import blod_id_info from "../../assets/info_blob_id.json";

const default_avatar =
  "https://pwco.com.sg/wp-content/uploads/2020/05/Generic-Profile-Placeholder-v3.png";

const BRONZE_THRESHOLD = 50;
const SILVER_THRESHOLD = 300;
const GOLD_THRESHOLD = 500;

const baseAggregatorUrl = "https://aggregator.walrus-testnet.walrus.space";

export const MainPage = () => {
  const { address: account } = useAccount();
  const {
    // data: BITContractTxResult,
    status: BITContractTxStatus,
    writeContract: writeContractBITToken,
  } = useWriteContract();
  const {
    // data: BITContractTxResult,
    error: BrainNFTContractError,
    status: BrainNFTContractTxStatus,
    writeContract: writeContractBrainNFT,
  } = useWriteContract();
  const { coins, setCoins } = useCoinsContext();
  const [synced, setSynced] = useState(0);

  const [bronzeNFT, setBronzeNFT] = useState([]);
  const [silverNFT, setSilverNFT] = useState([]);
  const [goldNFT, setGoldNFT] = useState([]);

  // Fetch NFT data with fallback to local images
  useEffect(() => {
    const blobUrl = `${baseAggregatorUrl}/v1/${blod_id_info["blob_id"]}`;

    // Import the NFT image utilities
    import("../../utils/nftImageUtils").then(({ getNFTData }) => {
      try {
        // First try to fetch from server
        fetch(blobUrl, {
          method: "GET",
          // Set a timeout to prevent long waits
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error(`Failed to fetch: ${res.status}`);
            }
            return res.json();
          })
          .then((data) => {
            console.log(data);
            setBronzeNFT(data.bronzeNFT || []);
            setSilverNFT(data.silverNFT || []);
            setGoldNFT(data.goldNFT || []);
          })
          .catch((err) => {
            console.log(err);
            
            // Use local NFT data from our utility
            const fallbackData = getNFTData();
            setBronzeNFT(fallbackData.bronzeNFT || []);
            setSilverNFT(fallbackData.silverNFT || []);
            setGoldNFT(fallbackData.goldNFT || []);
          });
      } catch (error) {
        console.error("Error in NFT data loading:", error);
        
        // Use fallback data when the fetch fails
        const fallbackNFTs = [
          {
            name: "Bronze NFT",
            image: "/av1.png",
            requiredScore: "50 BIT required",
            gen: "Gen 1",
            supply: "Limited",
            description: "A special NFT for completing games"
          },
          {
            name: "Bronze NFT 2",
            image: "/av2.png",
            requiredScore: "50 BIT required",
            gen: "Gen 1",
            supply: "Limited",
            description: "A special NFT for completing games"
          }
        ];
        
        const silverFallbackNFTs = [
          {
            name: "Silver NFT",
            image: "/av3.png",
            requiredScore: "300 BIT required",
            gen: "Gen 1",
            supply: "Limited",
            description: "A premium NFT for skilled players"
          },
          {
            name: "Silver NFT 2",
            image: "/av4.png",
            requiredScore: "300 BIT required",
            gen: "Gen 1",
            supply: "Limited",
            description: "A premium NFT for skilled players"
          }
        ];
        
        const goldFallbackNFTs = [
          {
            name: "Gold NFT",
            image: "/av5.png",
            requiredScore: "500 BIT required",
            gen: "Gen 1",
            supply: "Limited",
            description: "An exclusive NFT for elite players"
          },
          {
            name: "Gold NFT 2",
            image: "/av6.png",
            requiredScore: "500 BIT required",
            gen: "Gen 1",
            supply: "Limited",
            description: "An exclusive NFT for elite players"
          }
        ];
        
        setBronzeNFT(fallbackNFTs);
        setSilverNFT(silverFallbackNFTs);
        setGoldNFT(goldFallbackNFTs);
      }
    }).catch(error => {
      console.error("Failed to import nftImageUtils:", error);

      
      // Basic fallback if even the utility fails
      const basicFallbackNFTs = [
        {
          name: "Bronze NFT",
          image: "/av1.png",
          requiredScore: "50 BIT required",
          gen: "Gen 1",
          supply: "Limited",
          description: "A special NFT for completing games"
        },
        {
          name: "Bronze NFT 2",
          image: "/av2.png",
          requiredScore: "50 BIT required",
          gen: "Gen 1",
          supply: "Limited",
          description: "A special NFT for completing games"
        }
      ];
      
      setBronzeNFT(basicFallbackNFTs);
      setSilverNFT(basicFallbackNFTs);
      setGoldNFT(basicFallbackNFTs);
    });
  }, [baseAggregatorUrl]);

  const claimCoins = useCallback(async () => {
    writeContractBITToken({
      ...BITContract,
      functionName: "claimTokens",
      args: [parseEther(coins.toString())],
    } as any);
  }, [coins, writeContractBITToken]);

  const claimCard = useCallback(
    async (nftIndex: number) => {
      writeContractBrainNFT({
        ...NFTContract,
        functionName: "claimNFT",
        args: [nftIndex],
        sender: "",
      } as any);
    },
    [writeContractBrainNFT]
  );

  const { data: ownershipData, refetch: refetchOwnershipData } =
    useReadContract({
      ...NFTContract,
      functionName: "getOwnershipCount",
      args: [account],
    } as any);

  const ownershipCount = useMemo(() => {
    return ownershipData?.map((o) => Number(String(o).substring(0, 1))) ?? [];
  }, [ownershipData]);

  const {
    data: balanceData,
    isSuccess: isBalanceReadSuccess,
    isFetching,
    refetch: refetchBalance,
  } = useReadContract({
    ...BITContract,
    functionName: "balanceOf",
    args: [account],
  } as any);

  useEffect(() => {
    if (BITContractTxStatus === "success") {
      setCoins(0);
      localStorage.setItem("coins", "0");
      refetchBalance();
    }
  }, [refetchBalance, setCoins, BITContractTxStatus]);

  useEffect(() => {
    console.log("balanceData", balanceData);
    if (isBalanceReadSuccess && balanceData !== undefined) {
      setSynced(Number(formatEther(balanceData as bigint)));
    }
  }, [balanceData, isBalanceReadSuccess, isFetching, setCoins]);

  useEffect(() => {
    if (BITContractTxStatus === "pending") {
      toast("Mining your transaction..");
    } else if (BITContractTxStatus === "success") {
      toast.success("Successfully synced your tokens");

      setCoins(0);
      localStorage.setItem("coins", "0");
    } else if (BITContractTxStatus === "error") {
      toast.error("Failed to sync tokens. Something went wrong.");
    }
  }, [setCoins, setSynced, BITContractTxStatus]);

  useEffect(() => {
    if (BrainNFTContractTxStatus === "pending") {
      toast("Mining your transaction..");
    } else if (BrainNFTContractTxStatus === "success") {
      toast.success("Successfully minted NFT for you");

      refetchOwnershipData();
    } else if (BrainNFTContractTxStatus === "error") {
      toast.error("Failed to mint NFT");
    }
  }, [refetchOwnershipData, setSynced, BrainNFTContractTxStatus]);

  return (
    <VerticalNavigationTemplate>
      <div className="py-10 mx-auto mt-4 ml-4">
        <div>
          <div className="flex items-center ">
            <div className="mb-6 px-3">
              <img alt="icon" src="/reward.svg" />
            </div>
            <p className="text-3xl mt-2 mb-10 font-bold text-white">Rewards</p>
          </div>
          <p className="text-lg  text-white opacity-80">
            Play games and claim exclusive NFTs!
          </p>
          <div className="flex animate-smooth-appear">
            <div className="px-8 py-3 bg-gray-750 rounded-2xl w-60">
              <p className="text-sm text-gray-300 bg-gray-750">
                Synced on-chain
              </p>
              <div className="flex items-center">
                <p className="mr-2 text-xl font-bold text-white">{synced}</p>
                <div
                  className="hidden w-4 h-4 rounded-full"
                  style={{
                    backgroundImage: "url(" + default_avatar + ")",
                    backgroundSize: "cover",
                  }}
                />
              </div>
            </div>
            <div className="ml-4">
              <div className="flex items-center justify-center px-4 py-3 bg-gray-750 rounded-2xl w-60">
                <div>
                  <p className="text-sm text-gray-300">Transfer on-chain</p>
                  <div className="flex items-center">
                    <p className="mr-2 text-xl font-bold text-white">{coins}</p>
                    <div
                      className="hidden w-4 h-4 rounded-full"
                      style={{
                        backgroundImage: "url(" + default_avatar + ")",
                        backgroundSize: "cover",
                      }}
                    />
                  </div>
                </div>
                <button
                  className={clsx(
                    "px-3 py-2 mt-2 ml-5 font-bold text-white bg-purple-950 ring-purple-920 rounded focus:outline-none transition-all",
                    coins === 0 && "cursor-not-allowed ring-0 opacity-50",
                    coins > 0 && "hover:ring-2"
                  )}
                  onClick={claimCoins}
                  disabled={coins === 0}
                >
                  <SyncIcon className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </div>

          <div className="animate-smooth-appear">
            <p className="inline-block px-4 py-2 mt-8 text-xl text-white rounded-md bg-gray-750">
              Regular
            </p>
            <div className="mt-4 grid grid-cols-12 gap-x-10 gap-y-8 animate-smooth-appear">
              {bronzeNFT.map((n, i) => (
                <div key={n.image} className="col-span-4">
                  <NFTCard
                    imageUrl={n.image}
                    name={n.name}
                    desc={n.requiredScore}
                    contentLeft={n.gen}
                    contentRight={n.supply}
                    contentMain={n.description}
                    handleClick={() => claimCard(i + 1)}
                    insufficient={synced < BRONZE_THRESHOLD}
                    owned={!!ownershipCount?.[i + 1]}
                    baseAggregatorUrl={baseAggregatorUrl}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="animate-smooth-appear">
            {/* <p className="mt-8 text-2xl font-bold text-gray-300">Silver NFTs</p> */}
            <p className="inline-block px-4 py-2 mt-8 text-xl text-white rounded-md bg-gray-750 silver">
              Silver
            </p>
            <div className="mt-4 grid grid-cols-12 gap-x-10 gap-y-8 animate-smooth-appear">
              {silverNFT.map((n, i) => (
                <div key={n.image} className="col-span-4 ">
                  <NFTCard
                    imageUrl={n.image}
                    name={n.name}
                    desc={n.requiredScore}
                    contentLeft={n.gen}
                    contentRight={n.supply}
                    contentMain={n.description}
                    handleClick={() => claimCard(i + 3)}
                    insufficient={synced < SILVER_THRESHOLD}
                    owned={!!ownershipCount[i + 3]}
                    baseAggregatorUrl={baseAggregatorUrl}
                  />
                </div>
              ))}
            </div>
          </div>

          <p className="inline-block px-4 py-2 mt-8 text-xl text-white rounded-md bg-gray-750 gold">
            Gold
          </p>
          <div className="mt-4 grid grid-cols-12 gap-x-10 gap-y-8 animate-smooth-appear">
            {goldNFT.map((n, i) => (
              <div key={n.image} className="col-span-4">
                <NFTCard
                  imageUrl={n.image}
                  name={n.name}
                  desc={n.requiredScore}
                  contentLeft={n.gen}
                  contentRight={n.supply}
                  contentMain={n.description}
                  handleClick={() => claimCard(i + 8)}
                  insufficient={synced < GOLD_THRESHOLD}
                  owned={!!ownershipCount[i + 8]}
                  baseAggregatorUrl={baseAggregatorUrl}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </VerticalNavigationTemplate>
  );
};
