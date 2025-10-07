// Configuration file for your Google Drive music folder
// HOW TO USE:
// 1. Upload your MP3 files to a Google Drive folder
// 2. Right-click the folder → Share → Change to "Anyone with the link can view"
// 3. Copy the folder link: https://drive.google.com/drive/folders/YOUR_FOLDER_ID
// 4. Extract the FOLDER_ID from the link
// 5. Paste it below

export const GOOGLE_DRIVE_FOLDER_ID = "1JZuhm773M0BXi1TDnumkzFXzi-NZ_U1W";

export interface Track {
  id: string;
  title: string;
  googleDriveFileId: string;
  duration: number;
}

// Helper function to convert Google Drive file ID to streaming URL
export const getGoogleDriveStreamUrl = (fileId: string): string => {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
};
