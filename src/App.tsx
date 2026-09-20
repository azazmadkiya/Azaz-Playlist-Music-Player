import React, { useState } from 'react';
import { MusicPlayer } from './components/MusicPlayer';
import { TRACKS, POPULAR_PLAYLISTS } from './data/miladData';
import { Music, Radio, Link2, Headphones, Play, Sparkles, Disc, Check } from 'lucide-react';

export default function App() {
  const [customInput, setCustomInput] = useState('');
  const [activeTab, setActiveTab] = useState<'tracks' | 'playlists'>('tracks');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white pb-32">
      
      {/* Simple Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Azaz Playlist Music Player
              </h1>
              <p className="text-xs text-slate-400">Stream tracks & YouTube playlists instantly</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-indigo-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Ready
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-4 pt-8 w-full flex-1 space-y-6">
        
        {/* Hero Banner / Quick Playlist Input Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-xl">
            <h2 className="text-2xl font-bold text-white mb-2">Listen by Playlist or Track Link</h2>
            <p className="text-sm text-slate-400 mb-5">
              Paste any YouTube playlist ID, playlist URL, or video link below to load and stream audio seamlessly.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Paste YouTube playlist link or video URL..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <button
                onClick={() => {
                  if (customInput.trim()) {
                    // Trigger custom link load in MusicPlayer via custom event or global state
                    window.dispatchEvent(new CustomEvent('load-custom-url', { detail: customInput.trim() }));
                    setCustomInput('');
                  }
                }}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Play Link</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('tracks')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'tracks'
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Music className="w-4 h-4" />
            Curated Tracks ({TRACKS.length})
          </button>
          <button
            onClick={() => setActiveTab('playlists')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'playlists'
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Radio className="w-4 h-4" />
            Featured Playlists ({POPULAR_PLAYLISTS.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'tracks' ? (
          TRACKS.length > 0 ? (
            <div className="grid gap-3">
              {TRACKS.map((track, idx) => (
                <div
                  key={track.id}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('play-track-index', { detail: idx }));
                  }}
                  className="group bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-4 transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white flex items-center justify-center font-bold text-sm transition-colors shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 truncate transition-colors">
                        {track.title}
                      </h3>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {track.reciter} {track.description ? `• ${track.description}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-500 font-mono">{track.duration}</span>
                    <button className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white flex items-center justify-center transition-colors">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <Music className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">No Curated Tracks</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Paste any YouTube playlist or video link in the input box above to start streaming your favorite music instantly.
              </p>
            </div>
          )
        ) : (
          POPULAR_PLAYLISTS.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {POPULAR_PLAYLISTS.map((playlist) => (
                <div
                  key={playlist.id}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('load-playlist-id', { detail: playlist.id }));
                  }}
                  className="group bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 transition-all cursor-pointer flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/25 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Radio className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {playlist.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {playlist.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-indigo-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Stream Playlist
                    </span>
                    <span className="text-slate-500 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">No Featured Playlists</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Paste any YouTube playlist link in the input box above to load and stream custom playlists seamlessly.
              </p>
            </div>
          )
        )}

      </main>

      {/* Footer Credit */}
      <footer className="text-center pb-28 pt-8 text-xs text-slate-500">
        Developed By{' '}
        <a 
          href="https://azazmadkiya.morbi.store" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2"
        >
          Azazmadkiya
        </a>
      </footer>

      {/* Floating Bottom Music Player Bar */}
      <MusicPlayer />
    </div>
  );
}
