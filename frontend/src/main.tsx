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

import { CoinsProvider } from "config/context";
import {
  MainPage,
  ChimpGame,
  LeaderboardPage,
  ReactionGame,
  NumberMemory,
  DndGame,
} from "./pages";
import { GalleryPage } from "./pages/Gallery";
import { ChainId } from "config/chains";

// Define Base Sepolia network for Dynamic Labs
const evmNetworks: EvmNetwork[] = [
  {
    blockExplorerUrls: [baseSepolia.blockExplorers.default.url],
    chainId: baseSepolia.id,
    chainName: "Base Sepolia",
    name: "Base Sepolia",
    iconUrls: ["https://app.dynamic.xyz/assets/networks/base.svg"],
    nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
    networkId: baseSepolia.id,
    privateCustomerRpcUrls: [],
    rpcUrls: [baseSepolia.rpcUrls.default.http[0]],
    vanityName: "Base Sepolia",
  },
];

// Configure Wagmi with Coinbase Wallet connector
const coinbaseConnector = coinbaseWallet({
  appName: "PlayHazards",
  chains: [baseSepolia],
  preference: "smartWalletOnly", 
});

const config = createConfig({
  chains: [baseSepolia],
  connectors: [coinbaseConnector],
  transports: {
    [baseSepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
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
    path: "/numberMemory",
    element: <NumberMemory />,
  },
  {
    path: "/dndgame",
    element: <DndGame />,
  },
  {
    path: "/gallery",
    element: <GalleryPage />,
  },
]);

// Render the app
createRoot(document.getElementById("root")!).render(
  <DynamicContextProvider
    settings={{
      environmentId: import.meta.env.VITE_DYNAMIC_ENV_ID ?? "",
      walletConnectors: [EthereumWalletConnectors],
      overrides: { evmNetworks },
      recommendedWallets: [{ walletKey: "coinbase" }], // Prioritize Coinbase Smart Wallet
    }}
  >
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <CoinsProvider>
          <RouterProvider router={router} />
          <ToastContainer />
        </CoinsProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </DynamicContextProvider>
);
