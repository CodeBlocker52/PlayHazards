import React, { useEffect, useState } from "react";
import { getImageUrl } from "../../utils/imageUtils";

interface Props {
  imageUrl: string;
  name: string;
  desc: string;
  contentLeft: string;
  contentRight: string;
  contentMain: string;
  handleClick?: () => void;
  insufficient: boolean;
  owned?: boolean;
  ipfsCid?: string; // IPFS CID if available
  baseAggregatorUrl?: string; // Base URL for the aggregator
}

export const NFTCard: React.FC<Props> = ({
  imageUrl,
  name,
  desc,
  contentLeft,
  contentRight,
  contentMain,
  handleClick,
  insufficient,
  owned,
  ipfsCid,
  baseAggregatorUrl,
}: Props) => {
  const [fetchedImageUrl, setFetchedImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Use the utility to get the image URL with improved fallback handling
  useEffect(() => {
    // Reset error state when imageUrl changes
    setImageError(false);
    
    // Import the NFT image utilities for fallback
    const loadImage = async () => {
      try {
        // First try to use the provided imageUrl
        if (imageUrl) {
          // If it's a full URL, use it directly
          if (imageUrl.startsWith('http')) {
            setFetchedImageUrl(imageUrl);
          } 
          // If it's a path starting with '/', it's relative to public
          else if (imageUrl.startsWith('/')) {
            setFetchedImageUrl(imageUrl);
          }
          // If baseAggregatorUrl is provided and the image might be from IPFS
          else if (baseAggregatorUrl && !imageUrl.includes('/')) {
            try {
              // Try to construct a URL from the baseAggregatorUrl and imageUrl
              const fullUrl = `${baseAggregatorUrl}/v1/${imageUrl}`;
              // Test if the image can be loaded
              const response = await fetch(fullUrl, { method: 'HEAD' });
              if (response.ok) {
                setFetchedImageUrl(fullUrl);
              } else {
                throw new Error(`Failed to load image from ${fullUrl}`);
              }
            } catch (error) {
              console.error("Error loading image from aggregator:", error);
              // Fallback to a local asset path
              setFetchedImageUrl(getImageUrl(`/assets/bronze/brain1.png`));
            }
          }
          // Otherwise use the utility function
          else {
            setFetchedImageUrl(getImageUrl(imageUrl));
          }
        } else {
          // Fallback to a default avatar if no imageUrl is provided
          setFetchedImageUrl(getImageUrl(`/assets/bronze/brain1.png`));
        }
      } catch (error) {
        console.error("Error setting image URL:", error);
        setImageError(true);
        // Fallback to a default NFT image
        setFetchedImageUrl(getImageUrl(`/assets/bronze/brain1.png`));
      }
    };
    
    loadImage();
  }, [imageUrl, baseAggregatorUrl]);

  // Handle image load errors
  const handleImageError = () => {
    setImageError(true);
    // Fallback to a default avatar
    setFetchedImageUrl(getImageUrl(`/av${Math.floor(Math.random() * 8) + 1}.png`));
  };

  return (
    <div style={{ 
      border: "1px solid #2c3a43",
      margin: "0.5rem", // Reduce margin around the card
    }} className="rounded-2xl w-[300px]">
      <div className="relative">
        <div
          className="rounded-lg h-56 w-[300px] "
          style={{
            backgroundImage: fetchedImageUrl ? `url(${fetchedImageUrl})` : "none",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundColor: "#1a2025",
          }}
          onError={handleImageError}
        />
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-black text-sm">Image could not be loaded</p>
          </div>
        )}
        <div className="absolute z-100 bottom-4 left-4">
          <p className="text-xl font-bold text-black">{name}</p>
          <p className="text-xs text-black">{desc}</p>
        </div>
        <button
          className="absolute z-10 hidden w-12 h-12 rounded-full top-4 right-4"
          onClick={handleClick}
        >
          <img alt="icon" src="/hammer.svg" />
        </button>
      </div>
      <hr
        style={{
          borderColor: "#2c3a43",
        }}
      />
      <div className="p-4">
        <div className="flex items-center justify-center">
          <p className="text-xs text-gray-300 uppercase">{contentLeft}</p>
          <p className="text-xs text-gray-300 uppercase">{contentRight}</p>
        </div>
        <p className="my-4 overflow-hidden text-xs italic text-gray-300">
          {contentMain}
        </p>

        {!insufficient && !owned && (
          <button
            style={{ width: "100%" }}
            onClick={handleClick}
            className="block px-4 py-3 my-2 mt-2 font-bold text-white rounded focus:outline-none bg-purple-950 ring-purple-800 transition-all hover:ring-2"
          >
            Mint NFT Card
          </button>
        )}
        {insufficient && !owned && (
          <div className="px-4 py-3 my-2 mt-2 font-bold text-center text-white rounded focus:outline-none transition-all bg-gray-750">
            <p>Insufficient BIT tokens</p>
          </div>
        )}
        {owned && (
          <div className="px-4 py-3 my-2 mt-2 font-bold text-center text-white rounded focus:outline-none transition-all bg-gray-750">
            <p>Already owned</p>
          </div>
        )}
      </div>
    </div>
  );
};