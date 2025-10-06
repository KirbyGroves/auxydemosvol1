import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

interface Track {
  id: number;
  title: string;
  artist: string;
  duration: number;
  cover: string;
  src: string;
}

const tracks: Track[] = [
  {
    id: 1,
    title: "Summer Vibes",
    artist: "The Melody Makers",
    duration: 243,
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: 2,
    title: "Midnight Dreams",
    artist: "Echo Wave",
    duration: 198,
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: 3,
    title: "Ocean Breeze",
    artist: "Coastal Harmony",
    duration: 215,
    cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
];

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const MusicPlayer = () => {
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

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

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentTrack]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play();
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrack]);

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

  const track = tracks[currentTrack];

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-md shadow-sm p-4">
        <div className="space-y-3">
          {/* Track Info */}
          <div className="text-sm text-foreground">
            <div className="font-medium">{track.title}</div>
            <div className="text-muted-foreground text-xs">{track.artist}</div>
          </div>

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
              {formatTime(track.duration)}
            </div>
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={track.src} />
    </div>
  );
};
