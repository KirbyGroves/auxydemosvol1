// Configuration file for your music tracks
// To add tracks from Google Drive:
// 1. Upload MP3 files to a public Google Drive folder
// 2. Right-click each file → Share → Copy link
// 3. Extract the FILE_ID from the link: https://drive.google.com/file/d/FILE_ID/view
// 4. Add the FILE_ID and track details below

export interface Track {
  id: number;
  title: string;
  googleDriveFileId: string; // The ID from your Google Drive share link
  duration: number; // Duration in seconds (you'll need to check this manually)
  cover?: string; // Optional: URL to album art
}

// Add your tracks here with their Google Drive file IDs
export const tracks: Track[] = [
  {
    id: 1,
    title: "Summer Vibes",
    googleDriveFileId: "1ABC123example", // Replace with your actual file ID
    duration: 243,
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop"
  },
  {
    id: 2,
    title: "Midnight Dreams",
    googleDriveFileId: "2DEF456example", // Replace with your actual file ID
    duration: 198,
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop"
  },
  {
    id: 3,
    title: "Ocean Breeze",
    googleDriveFileId: "3GHI789example", // Replace with your actual file ID
    duration: 215,
    cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop"
  }
];

// Helper function to convert Google Drive file ID to streaming URL
export const getGoogleDriveStreamUrl = (fileId: string): string => {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
};
