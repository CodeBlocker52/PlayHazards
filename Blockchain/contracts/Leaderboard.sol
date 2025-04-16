// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.26;

import "./BITToken.sol";
import "./BrainNFT.sol";

contract UserLeaderboard {
    address public bitToken;
    address public brainNFT;
    address public owner;

    constructor(address bitToken_, address brainNFT_) {
        bitToken = bitToken_;
        brainNFT = brainNFT_;
        owner = msg.sender;
    }

    struct UserRank {
        address user;
        uint256 score;
        uint256 tokenBalance;
        uint256 nftCount;
    }

    function getLeaderboard(uint256 limit) external view returns (UserRank[] memory) {
        // Get all BITToken holders
        Leaderboard.User[] memory holders = BITToken(bitToken).getUsers();
        UserRank[] memory ranks = new UserRank[](holders.length);

        // Calculate scores
        for (uint256 i = 0; i < holders.length; i++) {
            address user = holders[i].addr;
            uint256[] memory nftCounts = BrainNFT(brainNFT).getOwnershipCount(user);
            uint256 nftScore = 0;

            // Calculate NFT score
            for (uint256 j = 1; j <= 9; j++) {
                if (j > 7) {
                    nftScore += nftCounts[j] * 100; // Gold NFTs
                } else if (j > 2) {
                    nftScore += nftCounts[j] * 50; // Silver NFTs
                } else {
                    nftScore += nftCounts[j] * 10; // Bronze NFTs
                }
            }

            uint256 tokenBalance = holders[i].balance;
            
            // Combined score: NFT score + token balance in whole tokens
            uint256 totalScore = nftScore + (tokenBalance / 1e18);
            
            ranks[i] = UserRank(user, totalScore, tokenBalance, nftScore / 10);
        }

        // Sort ranks (bubble sort for simplicity)
        for (uint256 i = 0; i < ranks.length; i++) {
            for (uint256 j = i + 1; j < ranks.length; j++) {
                if (ranks[i].score < ranks[j].score) {
                    UserRank memory temp = ranks[i];
                    ranks[i] = ranks[j];
                    ranks[j] = temp;
                }
            }
        }

        // Return top `limit` or all if limit > length
        uint256 returnLength = limit > ranks.length ? ranks.length : limit;
        UserRank[] memory result = new UserRank[](returnLength);
        for (uint256 i = 0; i < returnLength; i++) {
            result[i] = ranks[i];
        }

        return result;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "OWNER_ONLY");
        _;
    }

    function updateContractAddresses(address bitToken_, address brainNFT_) external onlyOwner {
        bitToken = bitToken_;
        brainNFT = brainNFT_;
    }
}