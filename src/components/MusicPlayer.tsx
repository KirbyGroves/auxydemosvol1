import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";

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
  const [volume, setVolume] = useState(70);
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
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

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
    <div className="min-h-screen w-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Album Art */}
          <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={track.cover}
              alt={track.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          {/* Track Info */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-white">{track.title}</h2>
            <p className="text-white/70">{track.artist}</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              max={track.duration}
              step={1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-sm text-white/60">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(track.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              disabled={currentTrack === 0}
              className="text-white hover:text-white hover:bg-white/20 disabled:opacity-30"
            >
              <SkipBack className="h-5 w-5" />
            </Button>

            <Button
              size="icon"
              onClick={togglePlay}
              className="h-14 w-14 rounded-full bg-white text-primary hover:bg-white/90 shadow-lg hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" fill="currentColor" />
              ) : (
                <Play className="h-6 w-6 ml-1" fill="currentColor" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              disabled={currentTrack === tracks.length - 1}
              className="text-white hover:text-white hover:bg-white/20 disabled:opacity-30"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3 px-2">
            <Volume2 className="h-5 w-5 text-white/70" />
            <Slider
              value={[volume]}
              max={100}
              step={1}
              onValueChange={(value) => setVolume(value[0])}
              className="flex-1"
            />
          </div>

          {/* Track List */}
          <div className="space-y-2 pt-4 border-t border-white/10">
            {tracks.map((t, index) => (
              <button
                key={t.id}
                onClick={() => {
                  setCurrentTrack(index);
                  setCurrentTime(0);
                  setIsPlaying(true);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                  index === currentTrack
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <img
                  src={t.cover}
                  alt={t.title}
                  className="w-10 h-10 rounded object-cover"
                />
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">{t.title}</p>
                  <p className="text-xs opacity-70">{t.artist}</p>
                </div>
                <span className="text-xs opacity-70">{formatTime(t.duration)}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <audio ref={audioRef} src={track.src} />
    </div>
  );
};
