import React, { memo } from "react";
import { useAccount } from "wagmi";
import clsx from "clsx";
import { ChimpIcon, CoinIcon, NumberMemoryIcon, ReactionIcon, CollectionsIcon } from "core";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import ApiIcon from '@mui/icons-material/Api';
import logo from "../../../../assets/logo.png"


const AccountBlock: React.FC = () => {
  const { address: account } = useAccount();

  return (
    <div
      className={clsx(
        "flex items-center justify-start w-full py-4 mt-6 rounded-lg space-x-2 px-3.5 transition-all min-h-[72px]",
        account && "account-block"
      )}
      style={account ? { width: "96%" } : {}}
    >
      <DynamicWidget />
    </div>
  );
};

const MemoizedAccountBlock = memo(AccountBlock);

export const VerticalNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      id="Main"
      className="flex flex-col items-start justify-start w-full h-full transform xl:translate-x-0 ease-in-out transition duration-500 sm:w-72"
    >
      <button
        className="flex items-center justify-start w-full px-4 pt-6 text-white focus:outline-none space-x-3"
        onClick={() => navigate("/")}
      >
        <img src={logo} width={70} height={70} className="rounded-full"></img>
        <p className="text-2xl leading-6">PlayHazards</p>
      </button>
      <MemoizedAccountBlock />
      <p className="pb-0 pl-4 mt-6 font-bold text-white">Navigation</p>
      <div className="flex flex-col items-start justify-start w-full px-4 pb-5 mt-3 space-y-3">
        <Link to="/" className="w-full">
          <button
            style={{
              backgroundColor:
                location.pathname === "/" ? "#202a30" : "transparent",
            }}
            className="flex items-center w-full py-3 pl-4 text-white rounded focus:outline-none jusitfy-start hover:text-white hover:bg-gray-700 space-x-6"
          >
            <svg
              className="fill-stroke"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 4H5C4.44772 4 4 4.44772 4 5V9C4 9.55228 4.44772 10 5 10H9C9.55228 10 10 9.55228 10 9V5C10 4.44772 9.55228 4 9 4Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19 4H15C14.4477 4 14 4.44772 14 5V9C14 9.55228 14.4477 10 15 10H19C19.5523 10 20 9.55228 20 9V5C20 4.44772 19.5523 4 19 4Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 14H5C4.44772 14 4 14.4477 4 15V19C4 19.5523 4.44772 20 5 20H9C9.55228 20 10 19.5523 10 19V15C10 14.4477 9.55228 14 9 14Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19 14H15C14.4477 14 14 14.4477 14 15V19C14 19.5523 14.4477 20 15 20H19C19.5523 20 20 19.5523 20 19V15C20 14.4477 19.5523 14 19 14Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-base leading-4">Rewards</p>
          </button>
        </Link>

        <Link to="/leaderboard" className="w-full">
          <button
            style={{
              backgroundColor:
                location.pathname === "/leaderboard"
                  ? "#202a30"
                  : "transparent",
            }}
            className="flex items-center w-full py-3 pl-4 text-white rounded focus:outline-none jusitfy-start hover:text-white hover:bg-gray-700 space-x-6"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 20.999H9V12.599C9 12.4399 9.06321 12.2873 9.17574 12.1748C9.28826 12.0623 9.44087 11.999 9.6 11.999H14.4C14.5591 11.999 14.7117 12.0623 14.8243 12.1748C14.9368 12.2873 15 12.4399 15 12.599V20.999V20.999ZM20.4 20.999H15V18.099C15 17.9399 15.0632 17.7873 15.1757 17.6748C15.2883 17.5623 15.4409 17.499 15.6 17.499H20.4C20.5591 17.499 20.7117 17.5623 20.8243 17.6748C20.9368 17.7873 21 17.9399 21 18.099V20.399C21 20.5582 20.9368 20.7108 20.8243 20.8233C20.7117 20.9358 20.5591 20.999 20.4 20.999V20.999ZM9 20.999V16.099C9 15.9399 8.93679 15.7873 8.82426 15.6748C8.71174 15.5623 8.55913 15.499 8.4 15.499H3.6C3.44087 15.499 3.28826 15.5623 3.17574 15.6748C3.06321 15.7873 3 15.9399 3 16.099V20.399C3 20.5582 3.06321 20.7108 3.17574 20.8233C3.28826 20.9358 3.44087 20.999 3.6 20.999H9V20.999ZM10.806 5.11204L11.715 3.18504C11.7395 3.12995 11.7795 3.08316 11.8301 3.05032C11.8807 3.01748 11.9397 3 12 3C12.0603 3 12.1193 3.01748 12.1699 3.05032C12.2205 3.08316 12.2605 3.12995 12.285 3.18504L13.195 5.11204L15.227 5.42304C15.488 5.46304 15.592 5.79904 15.403 5.99104L13.933 7.49104L14.28 9.60904C14.324 9.88104 14.052 10.089 13.818 9.96004L12 8.96004L10.182 9.96004C9.949 10.088 9.676 9.88104 9.72 9.60904L10.067 7.49104L8.597 5.99104C8.407 5.79904 8.512 5.46304 8.772 5.42304L10.806 5.11304V5.11204Z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-base leading-4">Leaderboard</p>
          </button>
        </Link>

        <Link to="/gallery" className="w-full">

        <button
          style={{
            backgroundColor:
              location.pathname === "/gallery" ? "#202a30" : "transparent",
          }}
          className="flex items-center justify-start w-full py-3 pl-4 text-white rounded focus:outline-none hover:text-white hover:bg-gray-700"
          onClick={() => navigate("/gallery")}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center justify-start">
              <CollectionsIcon className="w-6" />
              <p className="ml-6 text-base leading-4">Gallery</p>
            </div>
          </div>
        </button>

        </Link>

        
      </div>
      <p className="pb-0 pl-4 font-bold text-white">Games</p>
      <div className="flex flex-col items-start justify-start w-full px-4 pb-5 mt-4 text-white space-y-3">
        
      <button
          style={{
            backgroundColor:
              location.pathname === "/dndgame" ? "#202a30" : "transparent",
          }}
          className="flex items-center justify-start w-full py-3 pl-4 text-white rounded focus:outline-none hover:text-white hover:bg-gray-700"
          onClick={() => navigate("/dndgame")}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center justify-start">
              <ApiIcon className="w-6" />
              <p className="ml-6 text-base leading-4">DnD Game</p>
            </div>
          </div>
        </button>
        
        <button
          style={{
            backgroundColor:
              location.pathname === "/chimpTest" ? "#202a30" : "transparent",
          }}
          className="flex items-center justify-start w-full py-3 pl-4 text-white rounded focus:outline-none hover:text-white hover:bg-gray-700"
          onClick={() => navigate("/chimpTest")}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center justify-start">
              <ChimpIcon className="w-6" />
              <p className="ml-6 text-base leading-4">Chimp test</p>
            </div>
          </div>
        </button>
        <button
          style={{
            backgroundColor:
              location.pathname === "/numberMemory" ? "#202a30" : "transparent",
          }}
          className="flex items-center justify-start w-full py-3 pl-4 text-white rounded focus:outline-none space-x-6 hover:text-white hover:bg-gray-700 hover:bg-red"
          onClick={() => navigate("/numberMemory")}
        >
          <NumberMemoryIcon className="w-6" />
          <p className="text-base leading-4">Number Memory</p>
        </button>
        <button
          style={{
            backgroundColor:
              location.pathname === "/reactionTime" ? "#202a30" : "transparent",
          }}
          onClick={() => navigate("/reactionTime")}
          className="flex items-center justify-start w-full py-3 pl-4 text-white rounded focus:outline-none space-x-6 hover:text-white hover:bg-gray-700"
        >
          <ReactionIcon className="w-6" />
          <p className="text-base leading-4">Reaction time</p>
        </button>

      </div>
      <div className="flex items-center hidden px-6 py-4 ml-4 font-bold coin-display rounded-md animate-pulse-fast">
        
        <p>203 BIT</p>
      </div>
    </div>
  );
};
