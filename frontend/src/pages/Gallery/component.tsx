import { useEffect, useState } from "react";
import { VerticalNavigationTemplate } from "components/VerticalNavigationTemplate";
import { toast } from "react-toastify";
import { getImageUrl } from "../../utils/imageUtils";

export const GalleryPage = () => {
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const server_url = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

  // Fetch gallery images from the server with improved fallback handling
  useEffect(() => {
    setLoading(true);
    
    // Import the NFT image utilities for fallback
    import("../../utils/nftImageUtils").then(({ getNFTData }) => {
      try {
        // First try to fetch from server with a timeout
        fetch(server_url+"/api/gallery", {
          method: "GET",
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Server responded with status: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            // Transform the data into the format expected by the component
            const images = Object.entries(data).map(([filename, details]) => ({
              filename,
              imageUrl: `/assets/bronze/brain${Math.floor(Math.random() * 2) + 1}.png`, // Use local NFT images
              // You could use the blob_id here if you implement a function to get the URL from it
              // blobId: details.blob_id
            }));
            setGalleryImages(images);
            setLoading(false);
          })
          .catch((error) => {
            console.error("Failed to fetch gallery images:", error);
            setError(true);
            setLoading(false);
            toast.error("Failed to load gallery images. Using local NFT images instead.");
            
            // Use NFT data from our utility for fallback
            const nftData = getNFTData();
            const allNfts = [
              ...nftData.bronzeNFT,
              ...nftData.silverNFT,
              ...nftData.goldNFT
            ];
            
            // Create gallery images from NFT data
            const fallbackImages = allNfts.map((nft, i) => ({
              filename: nft.name || `NFT ${i+1}`,
              imageUrl: nft.image || `/assets/bronze/brain${i % 2 + 1}.png`,
              description: nft.description
            }));
            
            setGalleryImages(fallbackImages);
          });
      } catch (error) {
        console.error("Error in gallery image loading:", error);
        setError(true);
        setLoading(false);
        toast.error("Failed to load gallery images. Using local NFT images instead.");
        
        // Basic fallback if even the utility fails
        const basicFallbackImages = [
          { filename: "Bronze Brain 1", imageUrl: "/assets/bronze/brain1.png", description: "Bronze tier NFT" },
          { filename: "Bronze Brain 2", imageUrl: "/assets/bronze/brain2.png", description: "Bronze tier NFT" },
          { filename: "Silver Brain 1", imageUrl: "/assets/silver/brain1.png", description: "Silver tier NFT" },
          { filename: "Silver Brain 2", imageUrl: "/assets/silver/brain2.png", description: "Silver tier NFT" },
          { filename: "Gold Brain 1", imageUrl: "/assets/gold/brain1.gif", description: "Gold tier NFT" },
          { filename: "Gold Brain 2", imageUrl: "/assets/gold/brain2.gif", description: "Gold tier NFT" }
        ];
        
        setGalleryImages(basicFallbackImages);
      }
    }).catch(error => {
      console.error("Failed to import nftImageUtils:", error);
      setError(true);
      setLoading(false);
      toast.error("Failed to load NFT utilities. Using basic fallback images.");
      
      // Very basic fallback if even the import fails
      const veryBasicFallbackImages = Array.from({ length: 8 }, (_, i) => ({
        filename: `Local Image ${i+1}`,
        imageUrl: `/av${i % 8 + 1}.png`
      }));
      
      setGalleryImages(veryBasicFallbackImages);
    });
  }, [server_url]);

  return (
    <VerticalNavigationTemplate>
      <div className="py-10 mx-auto mt-4">
        <h2 className="text-3xl font-bold text-center text-white">Gallery</h2>
        <p className="text-center text-white opacity-80">
            Relive the Epic Moments of Your Dungeons & Dragons Quest
        </p>

        {loading && (
          <div className="text-center mt-8">
            <p className="text-white">Loading gallery images...</p>
          </div>
        )}

        {error && (
          <div className="text-center mt-8">
            <p className="text-white">Using local images as fallback.</p>
          </div>
        )}

        <div className="mt-8">
          <ImageSection title="Gallery Images" images={galleryImages} />
        </div>
      </div>
    </VerticalNavigationTemplate>
  );
};

const ImageSection = ({ title, images }) => (
    <div className="mt-6">
      <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {images.length === 0 ? (
          <p className="text-white">No images available.</p>
        ) : (
          images.slice(0,12).map((image, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg overflow-hidden shadow-lg"
            >
              <img
                src={getImageUrl(image.imageUrl || `/av${(index % 8) + 1}.png`)}
                alt={image.filename || image.name || `Image ${index}`}
                className="w-full h-48 object-contain"
              />
              <div className="p-2 flex justify-center align-center items-center">
                <h3 className="text-white place-self-center">{image.filename || image.name || `Image ${index}`}</h3>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
  
