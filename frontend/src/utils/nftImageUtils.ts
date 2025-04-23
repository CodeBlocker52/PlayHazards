// NFT Image Utility Functions

// Define paths to local NFT images
const NFT_IMAGES = {
  bronze: [
    '/assets/bronze/brain1.png',
    '/assets/bronze/brain2.png'
  ],
  silver: [
    '/assets/silver/brain1.png',
    '/assets/silver/brain2.png',
    '/assets/silver/brain3.png',
    '/assets/silver/brain4.png',
    '/assets/silver/brain5.png'
  ],
  gold: [
    '/assets/gold/brain1.gif',
    '/assets/gold/brain2.gif'
  ]
};

// Fallback NFT data structure matching brains_info.json
const FALLBACK_NFT_DATA = {
  bronzeNFT: [
    {
      image: NFT_IMAGES.bronze[0],
      name: "Smally brain",
      description: "The brains of crypto beginners.",
      requiredScore: "Requires 50 on-chain BIT",
      gen: "gen 1 - 1",
      supply: "supply: 12323"
    },
    {
      image: NFT_IMAGES.bronze[1],
      name: "Mini brain",
      description: "Another type of brains of crypto beginners.",
      requiredScore: "Requires 50 on-chain BIT",
      gen: "gen 1 - 2",
      supply: "supply: 21321"
    }
  ],
  silverNFT: [
    {
      image: NFT_IMAGES.silver[0],
      name: "Miner's brain",
      description: "The brain of average mining enjoyer.",
      requiredScore: "Requires 300 on-chain BIT",
      gen: "gen 2 - 1",
      supply: "supply: 423"
    },
    {
      image: NFT_IMAGES.silver[1],
      name: "Average brain",
      description: "The brain of experienced crypto dog.",
      requiredScore: "Requires 300 on-chain BIT",
      gen: "gen 2 - 2",
      supply: "supply: 321"
    },
    {
      image: NFT_IMAGES.silver[2],
      name: "Axis brain",
      description: "The geek brains of the geek personality.",
      requiredScore: "Requires 300 on-chain BIT",
      gen: "gen 2 - 3",
      supply: "supply: 453"
    },
    {
      image: NFT_IMAGES.silver[3],
      name: "Middly brain",
      description: "The brain of average mining enjoyer.",
      requiredScore: "Requires 300 on-chain BIT",
      gen: "gen 2 - 4",
      supply: "supply: 233"
    },
    {
      image: NFT_IMAGES.silver[4],
      name: "Minted brain",
      description: "The brain that undergo minting.",
      requiredScore: "Requires 300 on-chain BIT",
      gen: "gen 2 - 5",
      supply: "supply: 195"
    }
  ],
  goldNFT: [
    {
      image: NFT_IMAGES.gold[0],
      name: "Geek brain",
      description: "The brain of the real geek.",
      requiredScore: "Requires 500 on-chain BIT",
      gen: "gen 5 - 1",
      supply: "supply: 23"
    },
    {
      image: NFT_IMAGES.gold[1],
      name: "Jet brain",
      description: "The brain of the real jet man.",
      requiredScore: "Requires 500 on-chain BIT",
      gen: "gen 5 - 2",
      supply: "supply: 10"
    }
  ]
};

// Get NFT data with fallback to local images
export const getNFTData = () => {
  return FALLBACK_NFT_DATA;
};

// Get a specific NFT type data
export const getNFTTypeData = (type: 'bronzeNFT' | 'silverNFT' | 'goldNFT') => {
  return FALLBACK_NFT_DATA[type] || [];
};

// Map a blob ID to a local image path based on NFT type and index
export const mapBlobIdToLocalImage = (blobId: string, nftType: string, index: number = 0) => {
  // Default to first bronze image if mapping fails
  let defaultImage = NFT_IMAGES.bronze[0];
  
  try {
    if (nftType === 'bronzeNFT' && index < NFT_IMAGES.bronze.length) {
      return NFT_IMAGES.bronze[index];
    } else if (nftType === 'silverNFT' && index < NFT_IMAGES.silver.length) {
      return NFT_IMAGES.silver[index];
    } else if (nftType === 'goldNFT' && index < NFT_IMAGES.gold.length) {
      return NFT_IMAGES.gold[index];
    }
    return defaultImage;
  } catch (error) {
    console.error('Error mapping blob ID to local image:', error);
    return defaultImage;
  }
};