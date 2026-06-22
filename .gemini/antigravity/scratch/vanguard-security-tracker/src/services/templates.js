export const TEMPLATES = {
  dashboard: {
    name: "SaaS Sales Dashboard",
    type: "web",
    description: "Analytics dashboard with live interactive charts, statistics counters, and activity feeds.",
    files: {
      "App.jsx": `import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, ArrowUpRight, ArrowDownRight, Bell, Search, Activity, Settings, Calendar } from 'lucide-react';

export default function App() {
  // Sync filters to localStorage to simulate database preferences
  const [timeRange, setTimeRange] = useState(() => {
    return localStorage.getItem('lumina_db_timerange') || '7d';
  });
  const [selectedMetric, setSelectedMetric] = useState(() => {
    return localStorage.getItem('lumina_db_metric') || 'revenue';
  });

  useEffect(() => {
    localStorage.setItem('lumina_db_timerange', timeRange);
  }, [timeRange]);

  useEffect(() => {
    localStorage.setItem('lumina_db_metric', selectedMetric);
  }, [selectedMetric]);

  const metrics = {
    revenue: { val: '$24,892.40', change: '+12.5%', isUp: true, desc: 'vs previous period' },
    activeUsers: { val: '1,284', change: '+8.2%', isUp: true, desc: 'vs last week' },
    conversions: { val: '3.42%', change: '-0.4%', isUp: false, desc: 'vs last month' }
  };

  const activities = [
    { id: 1, user: 'Alex Rivers', action: 'purchased Enterprise Plan', time: '2 mins ago', amount: '+$599.00' },
    { id: 2, user: 'Sarah Vance', action: 'upgraded to Team Plan', time: '14 mins ago', amount: '+$199.00' },
    { id: 3, user: 'Daniel Kim', action: 'started trial', time: '1 hour ago', amount: 'Free' },
    { id: 4, user: 'Elena Rostova', action: 'renewed Professional Plan', time: '3 hours ago', amount: '+$99.00' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-900 bg-slate-900/50 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-500/20">
            S
          </div>
          <span className="font-semibold text-lg tracking-tight">SyncNode Analytics</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search metrics or users..." 
              className="bg-slate-950/80 border border-slate-800 rounded-full pl-9 pr-4 py-1.5 text-sm w-64 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-200 relative">
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500"></span>
            <Bell className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-semibold text-indigo-400">
            JD
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Overview</h1>
            <p className="text-sm text-slate-400">Real-time SaaS pipeline stats.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-0.5 rounded-lg flex">
            {['24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={\`px-3 py-1 text-xs font-medium rounded-md transition-all \${timeRange === range ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}\`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(metrics).map(([key, data]) => {
            const isSelected = selectedMetric === key;
            return (
              <div 
                key={key} 
                onClick={() => setSelectedMetric(key)}
                className={\`cursor-pointer p-6 rounded-xl border transition-all duration-300 \${isSelected ? 'bg-slate-900/90 border-indigo-500/80 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/20' : 'bg-slate-900/40 border-slate-900 hover:border-slate-800'}\`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                    {key === 'revenue' ? 'Recurring Revenue' : key === 'activeUsers' ? 'Active Members' : 'Conversion Ratio'}
                  </span>
                  <div className={\`p-2 rounded-lg \${isSelected ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'}\`}>
                    {key === 'revenue' ? <DollarSign className="w-4 h-4" /> : key === 'activeUsers' ? <Users className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-white">{data.val}</span>
                  <span className={\`text-xs font-medium flex items-center gap-0.5 \${data.isUp ? 'text-emerald-400' : 'text-rose-400'}\`}>
                    {data.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {data.change}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{data.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Chart Section */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-white">Activity Pulse</h3>
            <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-full border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Syncing
            </span>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 pt-4 border-b border-slate-800/60 pb-1">
            {[45, 59, 38, 85, 62, 78, 90, 68, 55, 74, 88, 95].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mb-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                  {height}%
                </div>
                <div 
                  style={{ height: \`\${height}%\` }}
                  className="w-full rounded-t bg-gradient-to-t from-indigo-600/30 to-indigo-500 hover:from-indigo-500 hover:to-teal-400 transition-all duration-300 cursor-pointer shadow-lg shadow-indigo-500/10"
                ></div>
                <span className="text-[10px] text-slate-600 font-mono mt-1">M{i+1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info Blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feed */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-6 flex flex-col">
            <h3 className="text-base font-semibold text-white mb-4">Pipeline Live Feed</h3>
            <div className="space-y-4 flex-1">
              {activities.map((act) => (
                <div key={act.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-900 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-400">
                      {act.user.charAt(0)}
                    </div>
                    <div>
                      <span className="font-medium text-slate-200">{act.user}</span>
                      <span className="text-slate-400 ml-1.5">{act.action}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-emerald-400">{act.amount}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-6">
            <h3 className="text-base font-semibold text-white mb-4">Quick Deploy Tools</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-900 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Global Webhook URL</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Push updates instantly to custom endpoints.</p>
                </div>
                <button className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md text-xs font-semibold transition-colors">
                  Configure
                </button>
              </div>
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-900 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Export Raw Reports</h4>
                  <p className="text-xs text-slate-500 mt-0.5">CSV/PDF formatted data summaries.</p>
                </div>
                <button className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md text-xs font-semibold transition-colors">
                  Download
                </button>
              </div>
              <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h4 className="text-sm font-semibold text-indigo-300">Server Health: 100%</h4>
                    <p className="text-xs text-indigo-400/70">All containers operational.</p>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow shadow-emerald-500"></span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}`,
      "styles.css": `/* Custom styles for Web app */
@layer base {
  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.1); }
    50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.25); }
  }
}
.stat-card-active {
  animation: pulseGlow 3s infinite;
}`,
      "index.html": `<!DOCTYPE html>
<html>
<head>
  <title>Sales Analytics Dashboard</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`
    }
  },
  musicPlayer: {
    name: "AeroBeat Music Player",
    type: "mobile",
    description: "Mobile music player app with bottom sheets, rotating vinyl animations, and volume sliders.",
    files: {
      "App.jsx": `import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Volume2, Heart, ListMusic, Disc, Compass, Layers, User } from 'lucide-react';

export default function App() {
  // Sync track and states to localStorage to simulate DB states
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('player');
  const [progress, setProgress] = useState(35);
  
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => {
    return Number(localStorage.getItem('lumina_music_track') || '0');
  });
  
  const [isLiked, setIsLiked] = useState(() => {
    return localStorage.getItem('lumina_music_liked') === 'true';
  });
  
  const [volume, setVolume] = useState(() => {
    return Number(localStorage.getItem('lumina_music_volume') || '80');
  });

  useEffect(() => {
    localStorage.setItem('lumina_music_track', String(currentTrackIndex));
  }, [currentTrackIndex]);

  useEffect(() => {
    localStorage.setItem('lumina_music_liked', String(isLiked));
  }, [isLiked]);

  useEffect(() => {
    localStorage.setItem('lumina_music_volume', String(volume));
  }, [volume]);

  const playlist = [
    { title: 'Neon Horizon', artist: 'Hyperion', duration: '3:45', cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80' },
    { title: 'Cyber Drift', artist: 'Daft Pixel', duration: '4:12', cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80' },
    { title: 'Aether Spark', artist: 'Lumina', duration: '2:58', cover: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&q=80' },
    { title: 'Digital Rain', artist: 'NetRunner', duration: '3:20', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80' }
  ];

  const track = playlist[currentTrackIndex];

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    setProgress(0);
  };
  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    setProgress(0);
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#070512] text-slate-100 flex flex-col font-sans relative overflow-hidden select-none">
      
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[60%] bg-purple-900/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[50%] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* App Header */}
      <header className="px-6 pt-6 pb-2 flex items-center justify-between z-10">
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-purple-400">AEROBEAT</span>
        <button 
          onClick={() => setActiveTab(activeTab === 'playlist' ? 'player' : 'playlist')}
          className="p-2 bg-slate-900/50 rounded-full border border-white/5 text-purple-400 hover:text-purple-300"
        >
          <ListMusic className="w-4 h-4" />
        </button>
      </header>

      {/* Screen Views */}
      <div className="flex-1 px-6 flex flex-col justify-center z-10 pb-20">
        {activeTab === 'player' ? (
          /* MAIN PLAYER VIEW */
          <div className="flex flex-col items-center">
            {/* Spinning Disc Cover */}
            <div className="relative my-8 group cursor-pointer">
              <div className="absolute inset-0 bg-purple-600/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
              <div className={\`w-64 h-64 rounded-full border-4 border-slate-900/80 bg-slate-950 overflow-hidden shadow-2xl relative flex items-center justify-center \${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}\`}>
                <img 
                  src={track.cover} 
                  alt={track.title} 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.4)_70%,rgba(0,0,0,0.95)_100%)]"></div>
                <div className="absolute w-12 h-12 rounded-full bg-[#070512] border-2 border-slate-800 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                </div>
              </div>
            </div>

            {/* Track Info */}
            <div className="w-full text-center mt-4 mb-6">
              <h2 className="text-xl font-bold tracking-tight text-white mb-1">{track.title}</h2>
              <p className="text-sm text-purple-400/90 font-medium">{track.artist}</p>
            </div>

            {/* Controls Slider */}
            <div className="w-full space-y-2 mb-6">
              <div className="relative h-1 w-full bg-slate-800 rounded-full overflow-hidden cursor-pointer">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-indigo-500" 
                  style={{ width: \`\${progress}%\` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0:{progress < 10 ? '0' + progress : progress}</span>
                <span>{track.duration}</span>
              </div>
            </div>

            {/* Media Control Buttons */}
            <div className="flex items-center justify-between w-full max-w-[280px] mb-8">
              <button className="text-slate-400 hover:text-white transition-colors">
                <Shuffle className="w-5 h-5" />
              </button>
              
              <button onClick={prevTrack} className="text-slate-200 hover:text-white p-2 transition-colors">
                <SkipBack className="w-6 h-6 fill-current" />
              </button>

              <button 
                onClick={togglePlay} 
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all text-white"
              >
                {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 translate-x-0.5 fill-current" />}
              </button>

              <button onClick={nextTrack} className="text-slate-200 hover:text-white p-2 transition-colors">
                <SkipForward className="w-6 h-6 fill-current" />
              </button>

              <button 
                onClick={() => setIsLiked(!isLiked)} 
                className={\`transition-colors \${isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'}\`}
              >
                <Heart className={\`w-5 h-5 \${isLiked ? 'fill-current' : ''}\`} />
              </button>
            </div>

            {/* Volume Panel */}
            <div className="flex items-center gap-3 w-full max-w-[200px] bg-slate-900/40 p-2 rounded-full border border-white/5 backdrop-blur-sm">
              <Volume2 className="w-4 h-4 text-purple-400" />
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>
        ) : (
          /* PLAYLIST VIEW */
          <div className="flex flex-col h-full space-y-4 pt-4">
            <h3 className="text-base font-bold text-white mb-2">Up Next</h3>
            <div className="space-y-2 overflow-y-auto max-h-[360px] pr-1">
              {playlist.map((item, index) => {
                const isActive = index === currentTrackIndex;
                return (
                  <div 
                    key={index}
                    onClick={() => {
                      setCurrentTrackIndex(index);
                      setProgress(0);
                    }}
                    className={\`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border \${isActive ? 'bg-purple-900/20 border-purple-500/30' : 'bg-slate-900/30 border-transparent hover:bg-slate-900/60'}\`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                        <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className={\`text-sm font-semibold \${isActive ? 'text-purple-400' : 'text-slate-200'}\`}>{item.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{item.artist}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{item.duration}</span>
                  </div>
                );
              })}
            </div>
            <button 
              onClick={() => setActiveTab('player')}
              className="w-full py-2.5 bg-slate-900 border border-white/5 rounded-xl text-xs font-semibold text-purple-400 hover:bg-slate-800 transition-colors"
            >
              Back to Player
            </button>
          </div>
        )}
      </div>

      {/* Native Bottom Bar Navigation */}
      <footer className="absolute bottom-0 left-0 right-0 h-16 bg-slate-950/80 border-t border-white/5 backdrop-blur-md px-8 flex items-center justify-between z-20">
        <button className="flex flex-col items-center gap-1 text-purple-500">
          <Compass className="w-5 h-5" />
          <span className="text-[9px] font-bold">Discover</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
          <Layers className="w-5 h-5" />
          <span className="text-[9px]">Library</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
          <User className="w-5 h-5" />
          <span className="text-[9px]">Profile</span>
        </button>
      </footer>
    </div>
  );
}`,
      "styles.css": `/* Mobile Music Player Animations */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #a855f7;
  cursor: pointer;
}
`,
      "index.html": `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>AeroBeat Music Player</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`
    }
  },
  fitnessTracker: {
    name: "FitPulse Health Tracker",
    type: "mobile",
    description: "Workout and fitness app with step counters, live heart-rate line, and hydration tracker.",
    files: {
      "App.jsx": `import React, { useState, useEffect } from 'react';
import { Activity, Flame, Heart, Navigation, Trophy, Plus, RefreshCw, Zap, TrendingUp } from 'lucide-react';

export default function App() {
  // Sync fitness logs to localStorage for simulation
  const [steps, setSteps] = useState(() => {
    return Number(localStorage.getItem('lumina_fit_steps') || '6420');
  });
  const [calories, setCalories] = useState(() => {
    return Number(localStorage.getItem('lumina_fit_calories') || '384');
  });
  const [water, setWater] = useState(() => {
    return Number(localStorage.getItem('lumina_fit_water') || '3');
  });
  const [heartRate, setHeartRate] = useState(72);

  useEffect(() => {
    localStorage.setItem('lumina_fit_steps', String(steps));
  }, [steps]);

  useEffect(() => {
    localStorage.setItem('lumina_fit_calories', String(calories));
  }, [calories]);

  useEffect(() => {
    localStorage.setItem('lumina_fit_water', String(water));
  }, [water]);

  // Simulate heart rate changes
  useEffect(() => {
    const hrInterval = setInterval(() => {
      setHeartRate((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3;
        const next = prev + delta;
        return Math.max(60, Math.min(130, next));
      });
    }, 1500);
    return () => clearInterval(hrInterval);
  }, []);

  const addWater = () => setWater(water + 1);
  const resetStats = () => {
    setSteps(0);
    setCalories(0);
    setWater(0);
  };

  const stepPercentage = Math.min(100, (steps / 10000) * 100);

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden select-none">
      
      {/* Top Banner */}
      <header className="px-6 pt-6 pb-2 flex items-center justify-between border-b border-slate-900 bg-slate-900/20 backdrop-blur-md">
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Active Pulse</h2>
          <h1 className="text-lg font-bold text-white">Hey Champion!</h1>
        </div>
        <button onClick={resetStats} className="p-2 bg-slate-900 rounded-full border border-slate-800 hover:bg-slate-800 text-teal-400">
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      {/* Screen Views */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto pb-20">
        
        {/* Fitness Goal Ring */}
        <div className="bg-gradient-to-tr from-slate-900 to-slate-900/60 p-6 rounded-2xl border border-teal-500/10 flex items-center justify-between shadow-xl">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-teal-400 tracking-wider uppercase">Steps Target</span>
            <div className="text-3xl font-extrabold text-white">{steps.toLocaleString()}</div>
            <p className="text-xs text-slate-400">Goal: 10,000 steps</p>
          </div>
          
          {/* SVG Progress Ring */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="rgba(20,184,166,0.08)" strokeWidth="8" fill="transparent" />
              <circle 
                cx="48" 
                cy="48" 
                r="40" 
                stroke="url(#tealGradient)" 
                strokeWidth="8" 
                fill="transparent" 
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * stepPercentage) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute text-center flex flex-col items-center">
              <span className="text-sm font-bold">{Math.round(stepPercentage)}%</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-400">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Calories</span>
              <span className="text-base font-bold text-white">{calories} kcal</span>
            </div>
          </div>
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400">
              <Navigation className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Distance</span>
              <span className="text-base font-bold text-white">{(steps * 0.00075).toFixed(2)} km</span>
            </div>
          </div>
        </div>

        {/* Heart Rate Visualizer */}
        <div className="bg-slate-900/40 p-6 rounded-2xl border border-rose-500/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-current animate-pulse" />
              <span className="text-sm font-semibold text-slate-200">Live Heart Rate</span>
            </div>
            <span className="text-xl font-bold font-mono text-rose-400">{heartRate} BPM</span>
          </div>

          <div className="h-16 w-full relative overflow-hidden bg-slate-950 rounded-lg border border-slate-900/50 flex items-center justify-center">
            <svg className="w-full h-full stroke-rose-500/80 stroke-[2] fill-none">
              <path d="M 0 32 L 60 32 L 70 16 L 80 48 L 90 20 L 100 32 L 180 32 L 190 12 L 200 52 L 210 24 L 220 32 L 300 32 L 320 32" strokeLinecap="round" className="animate-[heartbeatLine_1.5s_linear_infinite]" />
            </svg>
          </div>
        </div>

        {/* Hydration Tracker */}
        <div className="bg-slate-900/40 p-6 rounded-2xl border border-blue-500/10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-blue-400 block tracking-wider uppercase">Hydration Monitor</span>
            <span className="text-lg font-bold text-slate-100">{water} of 8 glasses</span>
            <div className="flex gap-1 mt-2">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i} 
                  className={\`w-2 h-4 rounded-sm transition-colors \${i < water ? 'bg-blue-500 shadow shadow-blue-500/30' : 'bg-slate-800'}\`}
                ></div>
              ))}
            </div>
          </div>
          <button 
            onClick={addWater}
            className="w-12 h-12 rounded-xl bg-blue-600 hover:bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-white"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

      </div>

      {/* Native Bottom Bar Navigation */}
      <footer className="absolute bottom-0 left-0 right-0 h-16 bg-slate-950/80 border-t border-slate-900/80 backdrop-blur-md px-12 flex items-center justify-between z-20">
        <button className="flex flex-col items-center gap-1 text-teal-400">
          <Zap className="w-5 h-5" />
          <span className="text-[9px] font-semibold">Today</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-200 transition-colors">
          <TrendingUp className="w-5 h-5" />
          <span className="text-[9px]">Trends</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-200 transition-colors">
          <Trophy className="w-5 h-5" />
          <span className="text-[9px]">Goals</span>
        </button>
      </footer>
    </div>
  );
}`,
      "styles.css": `/* Custom heart rate tracker keyframes */
@layer base {
  @keyframes heartbeatLine {
    0% { transform: translateX(-10%); }
    100% { transform: translateX(50%); }
  }
}
`,
      "index.html": `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>FitPulse Tracker</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`
    }
  }
};
