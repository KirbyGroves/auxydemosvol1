import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Expose-Headers": "Content-Type, Content-Length, Accept-Ranges, Content-Range",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const fileId = url.searchParams.get("fileId");

    // Validate fileId format (Google Drive file IDs are typically 20-50 chars, alphanumeric with hyphens/underscores)
    if (!fileId || !/^[a-zA-Z0-9_-]{20,50}$/.test(fileId)) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing file ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GOOGLE_DRIVE_API_KEY");
    if (!apiKey) {
      console.error("GOOGLE_DRIVE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Forward Range header for streaming/seek support
    const range = req.headers.get("range") ?? undefined;

    const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
    console.log("Streaming file from Drive:", fileId, "range:", range || "none");

    const driveResp = await fetch(driveUrl, {
      method: "GET",
      headers: {
        Accept: "*/*",
        Referer: "https://lovableproject.com",
        ...(range ? { Range: range } : {}),
      },
    });

    if (!driveResp.ok || !driveResp.body) {
      const text = await driveResp.text().catch(() => "");
      console.error("Drive stream error", driveResp.status, text);
      return new Response(
        JSON.stringify({ error: "Unable to stream file at this time" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Propagate important headers
    const headers = new Headers(corsHeaders);
    const ct = driveResp.headers.get("Content-Type");
    const cl = driveResp.headers.get("Content-Length");
    const ar = driveResp.headers.get("Accept-Ranges");
    const cr = driveResp.headers.get("Content-Range");
    if (ct) headers.set("Content-Type", ct);
    if (cl) headers.set("Content-Length", cl);
    if (ar) headers.set("Accept-Ranges", ar);
    if (cr) headers.set("Content-Range", cr);
    headers.set("Cache-Control", "public, max-age=3600");

    // Use the same status code (200 or 206 for partial content)
    return new Response(driveResp.body, {
      status: driveResp.status,
      headers,
    });
  } catch (err) {
    console.error("Unexpected error in stream-drive-file:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});