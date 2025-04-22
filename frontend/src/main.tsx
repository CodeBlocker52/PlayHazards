import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import {
  DynamicContextProvider,
  EvmNetwork,
} from "@dynamic-labs/sdk-react-core";
import { createConfig, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "viem";
import { baseSepolia } from "viem/chains";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { coinbaseWallet } from "wagmi/connectors";
// Import the DynamicWagmiConnector
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";

import { CoinsProvider } from "config/context";
import {
  MainPage,
  ChimpGame,
  LeaderboardPage,
  ReactionGame,
  MemoryMatrix,
  DndGame,
  LandingPage,
} from "./pages";
import { GalleryPage } from "./pages/Gallery";
import { ChainId } from "config/chains";
import {ProfileComponent} from "./pages/Profile";

// Define Base Sepolia network for Dynamic Labs
const evmNetworks: EvmNetwork[] = [
  // {
  //   blockExplorerUrls: [baseSepolia.blockExplorers.default.url],
  //   chainId: baseSepolia.id,
  //   chainName: "Base Sepolia",
  //   name: "Base Sepolia",
  //   iconUrls: ["https://app.dynamic.xyz/assets/networks/base.svg"],
  //   nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  //   networkId: baseSepolia.id,
  //   privateCustomerRpcUrls: [],
  //   rpcUrls: [baseSepolia.rpcUrls.default.http[0]],
  //   vanityName: "Base Sepolia",
  // },
  // Add Monad Testnet
  {
    blockExplorerUrls: ["https://testnet.monadexplorer.com"],
    chainId: 10143, // Monad Testnet chain ID
    chainName: "Monad Testnet",
    name: "Monad Testnet",
    iconUrls: ["https://your-monad-icon-url"], // You'll need to provide an icon URL
    nativeCurrency: { decimals: 18, name: "Monad", symbol: "MON" },
    networkId: 10143,
    privateCustomerRpcUrls: [],
    rpcUrls: ["https://testnet-rpc.monad.xyz"],
    vanityName: "Monad Testnet",
  }
];
// Create a custom chain definition for Monad
const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'MonadExplorer', url: 'https://testnet.monadexplorer.com' },
  },
}

// Modify the coinbase connector to include Monad
const coinbaseConnector = coinbaseWallet({
  appName: "PlayHazards",
  chains: [monadTestnet],
  preference: "smartWalletOnly",
});

// Update the config to include Monad
const config = createConfig({
  chains: [monadTestnet],
  connectors: [coinbaseConnector],
  transports: {
    // [baseSepolia.id]: http(),
    [monadTestnet.id]: http('https://testnet-rpc.monad.xyz'),
  },
});

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/main",
    element: <MainPage />,
  },
  {
    path: "/leaderboard",
    element: <LeaderboardPage />,
  },
  {
    path: "/chimpTest",
    element: <ChimpGame />,
  },
  {
    path: "/reactionTime",
    element: <ReactionGame />,
  },
  {
    path: "/memoryMatrix",
    element: <MemoryMatrix />,
  },
  {
    path: "/dndgame",
    element: <DndGame />,
  },
  {
    path: "/gallery",
    element: <GalleryPage />,
  },
  {
    path: "/profile",
    element: <ProfileComponent />,
  },
]);

// Render the app with correct provider order
createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <DynamicContextProvider
        settings={{
          environmentId: import.meta.env.VITE_DYNAMIC_ENV_ID ?? "",
          walletConnectors: [EthereumWalletConnectors],
          overrides: { evmNetworks },
          recommendedWallets: [{ walletKey: "coinbase" }], // Prioritize Coinbase Smart Wallet
        }}
      >
        <DynamicWagmiConnector>
          <CoinsProvider>
            <RouterProvider router={router} />
            <ToastContainer />
          </CoinsProvider>
        </DynamicWagmiConnector>
      </DynamicContextProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
