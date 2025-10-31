import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

interface Track {
  id: string;
  title: string;
  googleDriveFileId: string;
  duration: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { folderId } = await req.json();
    
    if (!folderId) {
      return new Response(
        JSON.stringify({ error: 'Folder ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate folder ID format (Google Drive IDs are alphanumeric with hyphens/underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(folderId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid folder ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_DRIVE_API_KEY');
    
    if (!apiKey) {
      console.error('Google Drive API key not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching files from folder:', folderId);

    // Fetch files from Google Drive folder with proper URL encoding
    const query = encodeURIComponent(`'${folderId}' in parents and mimeType contains 'audio'`);
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&key=${apiKey}&fields=files(id,name,mimeType)`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Referer': 'https://lovableproject.com',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Drive API error:', response.status, errorText);
      
      // Check for API key referrer restriction error
      if (response.status === 403 && errorText.includes('API_KEY_HTTP_REFERRER_BLOCKED')) {
        console.error('API Key Configuration Issue: The Google Drive API key has HTTP referrer restrictions. Please configure the API key in Google Cloud Console to allow requests from server-side applications (remove referrer restrictions or allow empty referrers).');
        return new Response(
          JSON.stringify({ 
            error: 'API configuration error. Please check that your Google Drive API key allows server-side requests.',
            hint: 'Visit Google Cloud Console > APIs & Services > Credentials to configure your API key restrictions'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Unable to fetch tracks at this time' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Files found:', data.files?.length || 0);

    // Transform files into track format
    const tracks: Track[] = (data.files || []).map((file: DriveFile, index: number) => ({
      id: file.id,
      title: file.name.replace(/\.(mp3|wav|m4a|ogg)$/i, ''), // Remove file extension
      googleDriveFileId: file.id,
      duration: 180, // Default duration - will be determined by browser when loaded
    }));

    return new Response(
      JSON.stringify({ tracks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-drive-tracks function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
