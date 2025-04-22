import React, { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import {
  User,
  Edit2,
  Save,
  X,
  Upload,
  GamepadIcon,
  Award,
  Clock,
  Coins,
} from "lucide-react";
import { VerticalNavigationTemplate } from "components/VerticalNavigationTemplate";
import { formatEther } from "viem";
import { BITContract } from "config/contracts";
import axios from "axios";

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  bio: string;
  gameStats?: {
    nftsOwned: number;
    gamesPlayed: number;
    lastPlayed: string;
  };
}

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

export const ProfileComponent: React.FC = () => {
  const { address: account, isConnected } = useAccount();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

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

  // Initial profile data - now we'll fetch from API
  const [profile, setProfile] = useState<UserProfile>({
    name: "Player One",
    email: "player@playhazards.com",
    avatar: "",
    bio: "Blockchain gaming enthusiast and NFT collector.",
    gameStats: {
      nftsOwned: 0,
      gamesPlayed: 0,
      lastPlayed: new Date().toISOString(),
    },
  });

  // Form state for editing
  const [formData, setFormData] = useState<UserProfile>(profile);

  // Fetch user profile from API
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (account && isConnected) {
        try {
          setIsLoading(true);
          const response = await axios.get(
            `${API_BASE_URL}/api/users/${account}`
          );
          setProfile(response?.data?.data);
          setFormData(response?.data?.data);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // If error, we'll use default profile data
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserProfile();
  }, [account, isConnected]);

  // Update form data when profile changes
  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setFormData(profile);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (account && isConnected) {
      try {
        setIsLoading(true);
        const response = await axios.put(
          `${API_BASE_URL}/api/users/${account}`,
          {
            name: formData.name,
            email: formData.email,
            avatar: formData.avatar,
            bio: formData.bio,
          }
        );

        setProfile(response?.data?.data);
        setIsEditing(false);
        setNotification({
          open: true,
          message: "Profile updated successfully!",
          severity: "success",
        });
      } catch (error) {
        console.error("Error updating profile:", error);
        setNotification({
          open: true,
          message: "Failed to update profile. Please try again.",
          severity: "error",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          avatar: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <User className="w-16 h-16 mb-4 text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-700">
          Please connect your wallet to view your profile
        </h2>
      </div>
    );
  }

  if (isLoading) {
    return (
      <VerticalNavigationTemplate>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </VerticalNavigationTemplate>
    );
  }

  return (
    <VerticalNavigationTemplate>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-32 relative">
            {!isEditing ? (
              <button
                onClick={handleEditToggle}
                className="absolute top-4 right-4 flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all"
              >
                <Edit2 size={18} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                  ) : (
                    <Save size={18} />
                  )}
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-all"
                >
                  <X size={18} />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>

          <div className="px-6 py-8">
            <div className="flex flex-col md:flex-row md:gap-8">
              {/* Avatar section */}
              <div className="flex flex-col items-center mb-6 md:mb-0">
                <div className="relative -mt-20 mb-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white dark:ring-gray-800 bg-gray-200">
                    <img
                      src={
                        formData.avatar ||
                        "https://pwco.com.sg/wp-content/uploads/2020/05/Generic-Profile-Placeholder-v3.png"
                      }
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isEditing && (
                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 bg-indigo-500 hover:bg-indigo-600 p-2 rounded-full cursor-pointer shadow-md transition-all"
                    >
                      <Upload size={16} className="text-white" />
                      <input
                        id="avatar-upload"
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleFileUpload}
                      />
                    </label>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {profile.name}
                </h1>
                <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm rounded-full px-4 py-1 mt-2">
                  Blockchain Gamer
                </div>
              </div>

              {/* Profile details */}
              <div className="flex-1 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Name
                    </label>
                    {isEditing ? (
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    ) : (
                      <p className="text-gray-800 dark:text-gray-200">
                        {profile.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    ) : (
                      <p className="text-gray-800 dark:text-gray-200">
                        {profile.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Wallet Address
                    </label>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-800 dark:text-gray-200 font-mono text-sm break-all">
                        {account}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                        (Cannot be edited)
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    ) : (
                      <p className="text-gray-800 dark:text-gray-200">
                        {profile.bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Game Stats Section */}
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                <GamepadIcon size={24} className="text-indigo-500" />
                Game Stats
              </h2>

              <div className="flex justify-around items-center ">
                <div className="bg-gradient-to-br from-emerald-50 min-w-80 to-green-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-sm border border-green-100 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        NFTs Owned
                      </p>
                      <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
                        {profile.gameStats?.nftsOwned || 0}
                      </p>
                    </div>
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg">
                      <Award
                        size={24}
                        className="text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-red-200 min-w-80 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-sm border border-amber-100 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                        BIT Tokens
                      </p>
                      <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
                        {/* {Number(formatEther(balanceData as bigint))} */}
                      </p>
                    </div>
                    <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg">
                      <Coins
                        size={24}
                        className="text-amber-600 dark:text-amber-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* <div className="mt-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-sm border border-blue-100 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        Games Played
                      </p>
                      <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
                        {profile.gameStats?.gamesPlayed || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Last played:{" "}
                        {profile.gameStats?.lastPlayed
                          ? new Date(
                              profile.gameStats.lastPlayed
                            ).toLocaleDateString()
                          : "Never"}
                      </p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                      <Clock
                        size={24}
                        className="text-blue-600 dark:text-blue-400"
                      />
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        {notification.open && (
          <div
            className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transition-all transform ${
              notification.severity === "success"
                ? "bg-green-500"
                : "bg-red-500"
            } text-white flex items-center gap-2`}
          >
            {notification.severity === "success" ? (
              <Save size={20} />
            ) : (
              <X size={20} />
            )}
            {notification.message}
            <button
              onClick={handleCloseNotification}
              className="ml-2 hover:bg-white/20 rounded-full p-1"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </VerticalNavigationTemplate>
  );
};
