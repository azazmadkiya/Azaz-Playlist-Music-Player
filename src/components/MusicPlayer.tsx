import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Disc,
  ListMusic,
  ChevronUp,
  ChevronDown,
  Radio,
  Repeat,
  Repeat1,
  Shuffle,
  Sparkles,
  Link2,
  Check,
  ListFilter
} from 'lucide-react';
import { TRACKS, DEFAULT_PLAYLIST_ID, DEFAULT_PLAYLIST_NAME, POPULAR_PLAYLISTS } from '../data/miladData';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const MusicPlayer: React.FC = () => {
  const [playMode, setPlayMode] = useState<'track' | 'playlist'>('playlist');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [playlistId, setPlaylistId] = useState(DEFAULT_PLAYLIST_ID);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(85);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeatMode, setRepeatMode] = useState<'all' | 'one' | 'shuffle'>('all');
  const [statusMessage, setStatusMessage] = useState<string>('Ready to play');
  const [ytReady, setYtReady] = useState(false);
  const [playlistTitle, setPlaylistTitle] = useState(DEFAULT_PLAYLIST_NAME);

  const ytPlayerRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerId = useRef(`yt-audio-frame-${Math.random().toString(36).substring(2, 9)}`);

  const fallbackTrack = {
    id: 'fallback-1',
    youtubeId: '5qap5aO4i9A',
    title: 'Custom Audio Stream',
    reciter: 'YouTube Stream',
    year: '2026',
    duration: 'Live',
    description: 'Custom streamed audio'
  };

  const currentTrack = TRACKS[currentTrackIndex] || TRACKS[0] || fallbackTrack;

  // Listen to window events from App.tsx
  useEffect(() => {
    const handleLoadCustomUrl = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        handleApplyCustomUrlString(detail);
      }
    };

    const handlePlayTrackIndex = (e: Event) => {
      const idx = (e as CustomEvent).detail;
      if (typeof idx === 'number') {
        switchToTrackMode(idx);
      }
    };

    const handleLoadPlaylistId = (e: Event) => {
      const plId = (e as CustomEvent).detail;
      if (plId) {
        const found = POPULAR_PLAYLISTS.find(p => p.id === plId);
        if (found) setPlaylistTitle(found.name);
        switchToPlaylistMode(plId);
      }
    };

    window.addEventListener('load-custom-url', handleLoadCustomUrl as EventListener);
    window.addEventListener('play-track-index', handlePlayTrackIndex as EventListener);
    window.addEventListener('load-playlist-id', handleLoadPlaylistId as EventListener);

    return () => {
      window.removeEventListener('load-custom-url', handleLoadCustomUrl as EventListener);
      window.removeEventListener('play-track-index', handlePlayTrackIndex as EventListener);
      window.removeEventListener('load-playlist-id', handleLoadPlaylistId as EventListener);
    };
  }, [ytReady]);

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setYtReady(true);
      return;
    }

    const existingScript = document.getElementById('youtube-iframe-api');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      setYtReady(true);
    };
  }, []);

  // Initialize YouTube Player
  useEffect(() => {
    if (!ytReady) return;

    try {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
      }

      const playerConfig: any = {
        height: '200',
        width: '200',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            ytPlayerRef.current = event.target;
            ytPlayerRef.current.setVolume(volume);
            if (isMuted) ytPlayerRef.current.mute();
            setStatusMessage('Audio engine ready');
            try {
              ytPlayerRef.current.playVideo();
              setIsPlaying(true);
            } catch {}
          },
          onStateChange: (event: any) => {
            const YT = window.YT;
            if (!YT) return;

            if (event.data === YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setIsLoading(false);
              setStatusMessage('Playing audio');
              try {
                const dur = ytPlayerRef.current?.getDuration() || 0;
                setDuration(dur);
              } catch {}
            } else if (event.data === YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              setIsLoading(false);
              setStatusMessage('Paused');
            } else if (event.data === YT.PlayerState.BUFFERING) {
              setIsLoading(true);
              setStatusMessage('Buffering audio...');
            } else if (event.data === YT.PlayerState.ENDED) {
              handleAudioEnded();
            }
          },
          onError: () => {
            setIsLoading(false);
            setIsPlaying(false);
            setStatusMessage('Audio unavailable. Switching track...');
            setTimeout(() => {
              handleNext();
            }, 1200);
          }
        }
      };

      if (playMode === 'playlist') {
        playerConfig.playerVars.listType = 'playlist';
        playerConfig.playerVars.list = playlistId;
      } else {
        playerConfig.videoId = currentTrack.youtubeId || '5qap5aO4i9A';
      }

      new window.YT.Player(containerId.current, playerConfig);
    } catch (err) {
      console.warn('YouTube Player init error:', err);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [ytReady, playlistId, playMode]);

  // Synchronize timer polling for smooth scrubber updates
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          try {
            const cur = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || 0;
            setCurrentTime(cur);
            if (dur > 0 && dur !== duration) {
              setDuration(dur);
            }
          } catch {}
        }
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, duration]);

  const displayTitle = playMode === 'playlist' ? playlistTitle : currentTrack.title;
  const displaySubtitle = playMode === 'playlist' ? 'Continuous YouTube Playlist Stream' : currentTrack.reciter;

  // Media Session API integration for background & lockscreen playback when minimized
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: displayTitle,
        artist: displaySubtitle,
        album: 'Playlist Music Player',
        artwork: [
          { src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=512&h=512&fit=crop', sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (ytPlayerRef.current && !isPlaying) {
          ytPlayerRef.current.playVideo();
        }
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (ytPlayerRef.current && isPlaying) {
          ytPlayerRef.current.pauseVideo();
        }
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        handlePrev();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        handleNext();
      });
    }
  }, [displayTitle, displaySubtitle, isPlaying]);

  const handleAudioEnded = () => {
    if (repeatMode === 'one') {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.seekTo(0, true);
        ytPlayerRef.current.playVideo();
      }
    } else {
      handleNext();
    }
  };

  const togglePlay = () => {
    if (!ytPlayerRef.current) {
      setStatusMessage('Initializing audio...');
      return;
    }

    if (isPlaying) {
      try {
        ytPlayerRef.current.pauseVideo();
      } catch {
        setIsPlaying(false);
      }
    } else {
      setIsLoading(true);
      setStatusMessage('Connecting audio stream...');
      try {
        ytPlayerRef.current.playVideo();
      } catch {
        setIsLoading(false);
      }
    }
  };

  const handleNext = () => {
    if (!ytPlayerRef.current) return;

    if (playMode === 'playlist') {
      try {
        if (repeatMode === 'shuffle') {
          ytPlayerRef.current.setShuffle(true);
        }
        ytPlayerRef.current.nextVideo();
        setIsPlaying(true);
      } catch {
        switchToTrackMode((currentTrackIndex + 1) % TRACKS.length);
      }
    } else {
      const nextIdx = repeatMode === 'shuffle'
        ? Math.floor(Math.random() * TRACKS.length)
        : (currentTrackIndex + 1) % TRACKS.length;
      playSpecificTrack(nextIdx);
    }
  };

  const handlePrev = () => {
    if (!ytPlayerRef.current) return;

    if (currentTime > 3) {
      try {
        ytPlayerRef.current.seekTo(0, true);
        return;
      } catch {}
    }

    if (playMode === 'playlist') {
      try {
        ytPlayerRef.current.previousVideo();
        setIsPlaying(true);
      } catch {
        switchToTrackMode((currentTrackIndex - 1 + TRACKS.length) % TRACKS.length);
      }
    } else {
      const prevIdx = (currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
      playSpecificTrack(prevIdx);
    }
  };

  const playSpecificTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setPlayMode('track');
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);

    const track = TRACKS[index] || fallbackTrack;
    if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      try {
        ytPlayerRef.current.loadVideoById(track.youtubeId || '5qap5aO4i9A');
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      } catch {
        setIsLoading(false);
      }
    }
  };

  const switchToPlaylistMode = (plId?: string, title?: string) => {
    const targetPlaylist = plId || playlistId || DEFAULT_PLAYLIST_ID;
    if (title) setPlaylistTitle(title);
    setPlaylistId(targetPlaylist);
    setPlayMode('playlist');
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setShowPlaylist(false);

    if (ytPlayerRef.current && typeof ytPlayerRef.current.loadPlaylist === 'function') {
      try {
        ytPlayerRef.current.loadPlaylist({
          list: targetPlaylist,
          listType: 'playlist',
          index: 0
        });
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      } catch {
        setIsLoading(false);
      }
    }
  };

  const switchToTrackMode = (index: number) => {
    playSpecificTrack(index);
    setShowPlaylist(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    if (val === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      try {
        ytPlayerRef.current.setVolume(val);
        if (val > 0 && isMuted) {
          ytPlayerRef.current.unMute();
        }
      } catch {}
    }
  };

  const toggleMute = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    if (ytPlayerRef.current) {
      try {
        if (newMute) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(volume || 85);
        }
      } catch {}
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      try {
        ytPlayerRef.current.seekTo(seekTime, true);
      } catch {}
    }
  };

  const toggleRepeatMode = () => {
    if (repeatMode === 'all') setRepeatMode('one');
    else if (repeatMode === 'one') setRepeatMode('shuffle');
    else setRepeatMode('all');
  };

  const handleApplyCustomUrlString = (urlStr: string) => {
    if (!urlStr.trim()) return;

    let input = urlStr.trim();
    let extractedPlaylistId = '';
    let extractedVideoId = '';

    if (input.includes('list=')) {
      const match = input.match(/[?&]list=([^#&?]+)/);
      if (match && match[1]) {
        extractedPlaylistId = match[1];
      }
    } else if (input.startsWith('PL') || input.startsWith('RD') || input.startsWith('UL')) {
      extractedPlaylistId = input;
    } else {
      const videoMatch = input.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (videoMatch && videoMatch[1]) {
        extractedVideoId = videoMatch[1];
      } else if (input.length === 11) {
        extractedVideoId = input;
      }
    }

    if (extractedPlaylistId) {
      setPlaylistId(extractedPlaylistId);
      setPlaylistTitle('Custom YouTube Playlist');
      switchToPlaylistMode(extractedPlaylistId, 'Custom YouTube Playlist');
      setShowUrlInput(false);
      setCustomUrlInput('');
    } else if (extractedVideoId) {
      setPlayMode('track');
      if (ytPlayerRef.current) {
        ytPlayerRef.current.loadVideoById(extractedVideoId);
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      }
      setShowUrlInput(false);
      setCustomUrlInput('');
    }
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    handleApplyCustomUrlString(customUrlInput);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 pointer-events-none">
      
      {/* Hidden YouTube IFrame Container */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '200px',
          height: '200px',
          opacity: 0.001,
          pointerEvents: 'none',
          zIndex: -1,
          overflow: 'hidden'
        }}
      >
        <div id={containerId.current} />
      </div>

      <div className="max-w-3xl mx-auto pointer-events-auto">
        
        {/* Playlist Drawer */}
        {showPlaylist && (
          <div className="mb-2 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-xl max-h-80 overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <span className="font-mono text-xs uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-1.5">
                <ListMusic className="w-4 h-4 text-indigo-400" />
                Playlists & Custom Links
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPlaylist(false)}
                  className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Custom URL Input Bar - Always shown at top */}
            <form onSubmit={handleApplyCustomUrl} className="mb-3 p-2.5 bg-slate-950 rounded-xl border border-indigo-500/40 flex gap-2">
              <input
                type="text"
                placeholder="Paste YouTube Playlist link or Video URL..."
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                className="flex-1 bg-slate-900 text-slate-100 placeholder-slate-500 text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-indigo-600 text-white text-xs font-bold font-mono rounded-lg hover:bg-indigo-500 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Check className="w-3.5 h-3.5" /> Play
              </button>
            </form>

            {/* Playlists Selection */}
            <div className="mb-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-1 mb-1 font-bold">
                Featured Playlists
              </p>
              <div className="space-y-1.5">
                {POPULAR_PLAYLISTS.map((pl) => {
                  const isSelected = playMode === 'playlist' && playlistId === pl.id;
                  return (
                    <button
                      key={pl.id}
                      onClick={() => switchToPlaylistMode(pl.id, pl.name)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/20 border border-indigo-500/50 text-indigo-200'
                          : 'hover:bg-slate-800/60 text-slate-300 border border-slate-800/60 bg-slate-950/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-mono text-xs font-bold ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          {isSelected && isPlaying ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                          ) : (
                            <Radio className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-slate-200">
                            {pl.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {pl.description}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 shrink-0 border border-slate-700">
                        Playlist
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Individual Tracks */}
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-1 mb-1 font-bold">
                Curated Tracks ({TRACKS.length})
              </p>
              {TRACKS.map((track, idx) => {
                const isSelected = playMode === 'track' && idx === currentTrackIndex;
                return (
                  <button
                    key={track.id}
                    onClick={() => switchToTrackMode(idx)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 border border-indigo-500/50 text-indigo-200'
                        : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-mono text-[11px] font-bold ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {isSelected && isPlaying ? (
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-200' : 'text-slate-200'}`}>
                          {track.title}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {track.reciter}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {track.duration}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Floating Player Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          
          {/* Top Progress Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-950 overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-0.5">
            
            {/* Track Info & Spinning Disc */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={`w-10 h-10 rounded-full border border-slate-700 bg-slate-950 flex items-center justify-center shrink-0 shadow-md relative ${isPlaying ? 'animate-spin' : ''}`}
                style={{ animationDuration: '6s' }}
              >
                <Disc className="w-5 h-5 text-indigo-400" />
                <div className="absolute w-2 h-2 bg-slate-900 rounded-full border border-indigo-500" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-indigo-400 font-semibold flex items-center gap-1">
                    <Radio className={`w-2.5 h-2.5 ${isPlaying ? 'animate-pulse text-indigo-400' : 'text-slate-500'}`} />
                    <span>{playMode === 'playlist' ? 'Playlist Stream' : 'Track Mode'}</span>
                  </span>

                  {isPlaying && (
                    <div className="flex items-end gap-0.5 h-2.5">
                      <span className="w-0.5 bg-indigo-400 h-2 animate-pulse" />
                      <span className="w-0.5 bg-violet-400 h-3 animate-pulse" style={{ animationDelay: '150ms' }} />
                      <span className="w-0.5 bg-indigo-300 h-1.5 animate-pulse" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                  {displayTitle}
                </h4>
                <p className="text-[10px] text-slate-400 truncate">
                  {displaySubtitle}
                </p>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              
              <button
                onClick={handlePrev}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                title="Previous"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                disabled={isLoading && !ytReady}
                className="p-2.5 rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all font-bold cursor-pointer disabled:opacity-75"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <Sparkles className="w-4 h-4 animate-spin text-white" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={handleNext}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                title="Next"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={toggleRepeatMode}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer hidden xs:flex items-center justify-center"
                title={`Playback Mode: ${repeatMode}`}
              >
                {repeatMode === 'all' && <Repeat className="w-4 h-4" />}
                {repeatMode === 'one' && <Repeat1 className="w-4 h-4 text-indigo-400" />}
                {repeatMode === 'shuffle' && <Shuffle className="w-4 h-4 text-indigo-400" />}
              </button>

              <button
                onClick={() => setShowPlaylist(!showPlaylist)}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  showPlaylist
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title="Open Playlists"
              >
                <ListMusic className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Expand Controls"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Expanded Drawer */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5">
              
              {/* Seek Bar */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400 w-10 text-right">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] font-mono text-slate-400 w-10">
                  {duration > 0 ? formatTime(duration) : '--:--'}
                </span>
              </div>

              {/* Volume & Status */}
              <div className="flex items-center justify-between gap-4 pt-1 flex-wrap sm:flex-nowrap">
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-indigo-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-24 sm:w-32 accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-slate-400">
                    {isMuted ? '0%' : `${volume}%`}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">
                    {statusMessage}
                  </span>

                  {playMode === 'playlist' ? (
                    <button
                      onClick={() => switchToTrackMode(0)}
                      className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-indigo-300 hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ListFilter className="w-3 h-3" />
                      Single Tracks
                    </button>
                  ) : (
                    <button
                      onClick={() => switchToPlaylistMode()}
                      className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-indigo-300 hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Radio className="w-3 h-3 text-indigo-400" />
                      Playlist Mode
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
