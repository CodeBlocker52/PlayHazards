// IPFS Configuration

// Pinata Gateway URL
export const PINATA_GATEWAY_URL = "https://gateway.pinata.cloud/ipfs";

// Helper function to get IPFS URL from CID
export const getIpfsUrl = (cid: string): string => {
  if (!cid) return '';
  
  // If it's already a full URL, return it
  if (cid.startsWith('http')) {
    return cid;
  }
  
  // Remove ipfs:// prefix if present
  const cleanCid = cid.replace('ipfs://', '');
  
  // Return the full gateway URL
  return `${PINATA_GATEWAY_URL}/${cleanCid}`;
};

// Pinata API configuration (for uploading)
export const PINATA_API = {
  endpoint: 'https://api.pinata.cloud',
  pinFileEndpoint: '/pinning/pinFileToIPFS',
  pinJsonEndpoint: '/pinning/pinJSONToIPFS',
  headers: (apiKey: string, secretKey: string) => ({
    'pinata_api_key': apiKey,
    'pinata_secret_api_key': secretKey,
  }),
};

// Function to upload file to IPFS via Pinata
export const uploadToPinata = async (
  file: File, 
  apiKey: string, 
  secretKey: string
): Promise<{ cid: string, url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${PINATA_API.endpoint}${PINATA_API.pinFileEndpoint}`, {
    method: 'POST',
    headers: PINATA_API.headers(apiKey, secretKey),
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to upload to Pinata: ${response.statusText}`);
  }
  
  const data = await response.json();
  return {
    cid: data.IpfsHash,
    url: getIpfsUrl(data.IpfsHash),
  };
};