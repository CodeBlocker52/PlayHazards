import { useAccount } from "wagmi";
import Link from "next/link";

export const LandingPage = () => {
  const { isConnected } = useAccount();

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen text-white overflow-hidden"
      style={{
        backgroundImage: "url('/bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black opacity-50" />
      <div className="relative z-10 flex flex-col items-center px-6 py-12 sm:px-12 lg:px-24">
        <h1 className="text-6xl font-extrabold mb-6 bg-gradient-to-r from-purple-200 to-purple-300 bg-clip-text text-transparent animate-pulse">
          Web3 Game Odyssey
        </h1>
        <p className="text-xl mb-8 text-center max-w-2xl text-gray-200 neon-glow drop-shadow-lg">
          Step into a blockchain-powered universe! Earn rare NFTs, battle in epic challenges, and dominate the chain.
        </p>
        {!isConnected && (
          <p className="text-md mb-6 text-gray-400 animate-fade-in">
            Connect your wallet to embark on this journey.
          </p>
        )}
        <Link href="/main">
          <div className="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold rounded-lg shadow-2xl hover:from-purple-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-110 animate-bounce-slow">
            Enter the Metaverse
          </div>
        </Link>
      </div>
    </div>
  );
};