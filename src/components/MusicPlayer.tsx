import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { GOOGLE_DRIVE_FOLDER_ID, Track, getGoogleDriveStreamUrl } from "@/config/tracks";
import { supabase } from "@/integrations/supabase/client";
import demosIcon from "@/assets/demos-icon.jpg";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const MusicPlayer = () => {
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useAltSource, setUseAltSource] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch tracks from Google Drive on component mount
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: functionError } = await supabase.functions.invoke('fetch-drive-tracks', {
          body: { folderId: GOOGLE_DRIVE_FOLDER_ID }
        });

        if (functionError) {
          throw functionError;
        }

        if (data?.tracks && data.tracks.length > 0) {
          setTracks(shuffleArray(data.tracks));
        } else {
          setError('No audio files found in the folder');
        }
      } catch (err) {
        console.error('Error fetching tracks:', err);
        setError('Failed to load tracks from Google Drive');
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      if (currentTrack < tracks.length - 1) {
        setCurrentTrack(currentTrack + 1);
      } else {
        setIsPlaying(false);
      }
    };

    const handleLoadedMetadata = () => {
      // Update track duration with actual audio duration
      if (audio.duration && isFinite(audio.duration)) {
        setTracks(prevTracks => {
          const newTracks = [...prevTracks];
          if (newTracks[currentTrack]) {
            newTracks[currentTrack] = {
              ...newTracks[currentTrack],
              duration: audio.duration
            };
          }
          return newTracks;
        });
      }
    };

    const handleError = (e: Event) => {
      console.error('Audio loading error:', e);
      if (!useAltSource) {
        setUseAltSource(true);
        return; // try alternate source once
      }
      setError('Failed to load audio file. Please check if the file is accessible.');
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("error", handleError);
    };
  }, [currentTrack, useAltSource]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((err) => {
          console.warn('Playback prevented or failed:', err);
          setIsPlaying(false);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    setUseAltSource(false);
  }, [currentTrack]);

  const track = tracks[currentTrack];
  const trackUrl = track
    ? (useAltSource
        ? `https://drive.usercontent.google.com/uc?id=${track.googleDriveFileId}&export=download`
        : `${SUPABASE_URL}/functions/v1/stream-drive-file?fileId=${track.googleDriveFileId}`)
    : '';

  // Reload audio when the track URL changes so metadata can load correctly
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setError(null);
    setCurrentTime(0);
    try {
      audio.load();
    } catch (e) {
      console.warn('Audio reload failed:', e);
    }
  }, [trackUrl]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handlePrevious = () => {
    if (currentTrack > 0) {
      setCurrentTrack(currentTrack - 1);
      setCurrentTime(0);
    }
  };

  const handleNext = () => {
    if (currentTrack < tracks.length - 1) {
      setCurrentTrack(currentTrack + 1);
      setCurrentTime(0);
    }
  };

  const handleSeek = (value: number[]) => {
    const time = value[0];
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Loading tracks...</p>
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <p className="text-destructive">{error || 'No tracks available'}</p>
          <p className="text-sm text-muted-foreground">
            Make sure your Google Drive folder ID is correct and the folder is public
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl">
        {/* Background Icon */}
        <div className="relative w-full aspect-square">
          <img 
            src={demosIcon} 
            alt="Demos Icon" 
            className="w-full h-full object-contain"
          />
          
          {/* Music Player positioned over lower 3/20ths */}
          <div className="absolute bottom-0 left-0 right-0 h-[15%] flex items-center justify-center px-4">
            <div className="w-full bg-card/95 backdrop-blur-sm border border-border rounded-md shadow-lg p-4">
        <div className="space-y-3">
          {/* Track Info */}
          <div className="text-sm text-foreground text-center">
            <div className="font-medium">{track.title}</div>
          </div>

          {error && (
            <div className="text-xs text-destructive text-center">{error}</div>
          )}

          {/* Controls and Progress */}
          <div className="flex items-center gap-3">
            {/* Control Buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                disabled={currentTrack === 0}
                className="h-8 w-8"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="h-8 w-8"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                disabled={currentTrack === tracks.length - 1}
                className="h-8 w-8"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Time Display */}
            <div className="text-xs text-muted-foreground min-w-[40px]">
              {formatTime(currentTime)}
            </div>

            {/* Progress Bar */}
            <div className="flex-1">
              <Slider
                value={[currentTime]}
                max={track.duration}
                step={1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
            </div>

            {/* Duration */}
            <div className="text-xs text-muted-foreground min-w-[40px] text-right">
              {formatTime(track.duration || 0)}
            </div>
          </div>
        </div>
            </div>
          </div>
        </div>
      </div>

      <audio
        key={track?.id}
        ref={audioRef}
        src={trackUrl}
        preload="metadata"
        crossOrigin="anonymous"
      />
    </div>
  );
};
