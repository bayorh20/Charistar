import React, { useEffect, useRef, useState } from 'react';
import { 
  X, Search, MapPin, Navigation, Sparkles, Mic, MicOff, 
  AlertTriangle, CheckCircle, ShieldCheck, Landmark, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MAPBOX_ACCESS_TOKEN, KITCHEN_COORDS, 
  reverseGeocode, searchAddress, watchGPS, getDeliveryFee, getETA 
} from '../utils/deliveryMapEngine';

export default function MapPicker({ isOpen, onClose, onConfirm, initialCoords, initialAddress }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const pinRef = useRef(null);

  // Core Location State
  const [selectedCoords, setSelectedCoords] = useState(initialCoords || KITCHEN_COORDS);
  const [resolvedPlaceName, setResolvedPlaceName] = useState('Locating address...');
  const [resolvedAddress, setResolvedAddress] = useState(initialAddress || '');
  const [deliveryNote, setDeliveryNote] = useState('');
  
  // Interactive UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // AI Assistant States
  const [aiReport, setAiReport] = useState({
    landmarks: [],
    conflicts: [],
    score: 25,
    rating: 'Medium Accuracy'
  });

  // 1. Web Audio click feedback
  const playHapticSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(70, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (err) {
      console.warn("Haptic synth failed:", err);
    }
  };

  // Run AI address checklist checks
  const runAICheck = (address, note) => {
    const text = (address + ' ' + note).toLowerCase();
    const landmarks = [];
    const conflicts = [];
    
    // Landmark extraction
    if (text.includes('republic')) landmarks.push('Chicken Republic');
    if (text.includes('mall') || text.includes('shoprite')) landmarks.push('Ikeja City Mall / Shoprite');
    if (text.includes('fuel') || text.includes('filling station') || text.includes('total') || text.includes('mobil') || text.includes('ap')) landmarks.push('Fuel Station');
    if (text.includes('gate') || text.includes('estate') || text.includes('crescent')) landmarks.push('Estate Security Gate');
    if (text.includes('bank') || text.includes('atm') || text.includes('zenith') || text.includes('gtb') || text.includes('access')) landmarks.push('Commercial Bank');
    if (text.includes('church') || text.includes('mosque') || text.includes('parish')) landmarks.push('Place of Worship');

    // Conflict warnings
    if (note.includes('opposite') && note.includes('inside')) {
      conflicts.push("Ambigious: has both 'opposite' and 'inside' instructions.");
    }
    if (note.toLowerCase().includes('call') && note.toLowerCase().length < 8) {
      conflicts.push("Unclear dispatcher instructions: 'call me' without parking details.");
    }

    // Completeness rating
    let score = 25;
    if (address.length > 10) score += 25;
    if (note.trim().length > 6) score += 25;
    if (landmarks.length > 0) score += 25;

    let rating = 'Low Accuracy';
    if (score >= 75) rating = 'Excellent Accuracy';
    else if (score >= 50) rating = 'High Accuracy';
    else if (score >= 25) rating = 'Medium Accuracy';

    setAiReport({ landmarks, conflicts, score, rating });
  };

  // Update position reverse-geocoding
  const handlePositionChange = async (lng, lat) => {
    setResolvedPlaceName('Locating...');
    try {
      const details = await reverseGeocode(lng, lat);
      setResolvedPlaceName(details.placeName);
      setResolvedAddress(details.fullAddress);
      runAICheck(details.fullAddress, deliveryNote);
    } catch (e) {
      setResolvedPlaceName('Lagos Delivery Spot');
      setResolvedAddress('Lagos, Nigeria');
    }
  };

  // 2. Initialize Mapbox map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    const initMap = () => {
      if (!mapContainerRef.current) return;
      const map = new window.mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: selectedCoords,
        zoom: 16.5,
        accessToken: MAPBOX_ACCESS_TOKEN
      });

      mapRef.current = map;

      map.on('dragstart', () => {
        setIsDragging(true);
      });

      map.on('dragend', async () => {
        setIsDragging(false);
        playHapticSound();
        const center = map.getCenter();
        setSelectedCoords([center.lng, center.lat]);
        await handlePositionChange(center.lng, center.lat);
      });

      map.on('load', () => {
        // Geolocate immediately on init
        handlePositionChange(selectedCoords[0], selectedCoords[1]);
      });
    };

    if (!window.mapboxgl) {
      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.js';
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOpen]);

  // 3. Geolocate via GPS
  const handleGPSGeolocate = () => {
    setGpsLoading(true);
    setGpsAccuracy('Syncing GPS...');
    
    watchGPS(
      (gps) => {
        setGpsLoading(false);
        setGpsAccuracy(gps.accuracyLabel);
        
        const coords = [gps.lng, gps.lat];
        setSelectedCoords(coords);
        
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: coords,
            zoom: 17.5,
            speed: 1.2
          });
        }
        
        handlePositionChange(gps.lng, gps.lat);
        playHapticSound();
      },
      (err) => {
        setGpsLoading(false);
        setGpsAccuracy('GPS Weak — search manually');
        alert(err);
      }
    );
  };

  // 4. Voice Speech Autocomplete search
  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search not supported on this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-NG';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = async (e) => {
      const query = e.results[0][0].transcript;
      setSearchQuery(query);
      
      const results = await searchAddress(query, selectedCoords);
      setSearchResults(results);
      if (results.length > 0) setIsSearching(true);
    };
    recognition.start();
  };

  // Manual search trigger
  const handleManualSearch = async (val) => {
    setSearchQuery(val);
    if (val.trim().length > 1) {
      const results = await searchAddress(val, selectedCoords);
      setSearchResults(results);
      setIsSearching(true);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (res) => {
    const coords = res.coordinates;
    setSelectedCoords(coords);
    setResolvedPlaceName(res.title);
    setResolvedAddress(res.description);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: coords,
        zoom: 17,
        speed: 1.3
      });
    }

    runAICheck(res.description, deliveryNote);
    playHapticSound();
  };

  // Confirmation trigger
  const handleConfirmLocation = () => {
    onConfirm({
      latitude: selectedCoords[1],
      longitude: selectedCoords[0],
      placeName: resolvedPlaceName,
      formattedAddress: resolvedAddress,
      deliveryNote: deliveryNote,
      deliveryFee: getDeliveryFee(selectedCoords[0], selectedCoords[1]),
      eta: getETA(selectedCoords[0], selectedCoords[1])
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-end bg-black/80 backdrop-blur-xs font-sans">
          
          {/* Modal portal backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 cursor-pointer"
            onClick={onClose}
          />

          {/* Dynamic Mobile Layout Panel */}
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="w-full max-w-[480px] h-[92vh] bg-charistar-dark border-t border-white/10 rounded-t-[2.5rem] relative flex flex-col overflow-hidden shadow-[0_-15px_40px_rgba(0,0,0,0.4)]"
          >
            
            {/* Header Toolbar */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 flex-shrink-0 z-30 bg-charistar-dark/80 backdrop-blur-lg">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-charistar-green animate-pulse"></span>
                <span className="text-xs font-black text-white uppercase tracking-widest">Secure Delivery Spot</span>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/5 transition-colors text-white"
              >
                <X size={15} />
              </button>
            </div>

            {/* Central Interactive map container */}
            <div className="flex-1 relative w-full overflow-hidden bg-charistar-dark">
              
              {/* Map Canvas Ref */}
              <div ref={mapContainerRef} className="w-full h-full" />

              {/* Draggable central smart pin indicator */}
              <div 
                ref={pinRef}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center z-20"
                style={{ marginTop: '-24px' }} // anchor offset
              >
                {/* Geocoded confirmation address tooltip bubble */}
                <div 
                  className={`bg-black/90 backdrop-blur-md border border-charistar-green/30 text-white font-extrabold text-[10px] px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-1.5 transition-all duration-150 transform uppercase tracking-wide truncate max-w-[200px] mb-2.5 ${
                    isDragging ? 'opacity-0 scale-90 translate-y-3' : 'opacity-100 scale-100'
                  }`}
                >
                  <MapPin size={11} className="text-charistar-green" />
                  <span className="truncate">{resolvedPlaceName}</span>
                </div>

                {/* Highly styled visual pointer pin core */}
                <div className={`relative flex items-center justify-center transition-transform duration-100 ${isDragging ? 'scale-125 -translate-y-3' : 'scale-100'}`}>
                  <div className="w-7 h-7 bg-charistar-green rounded-full border-4 border-charistar-dark shadow-sm flex items-center justify-center" />
                  <div className="absolute top-[26px] w-[3px] h-3 bg-charistar-green shadow-md" />
                  <div className="absolute top-[38px] w-2.5 h-1.5 bg-black/60 rounded-full blur-[1px]" />
                </div>
              </div>

              {/* Floating Translucent Autocomplete Search Widget */}
              <div className="absolute top-4 left-4 right-4 z-30 space-y-2">
                <div className="glass-panel p-1 rounded-2xl flex items-center border border-white/10 shadow-lg">
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 text-gray-500">
                    <Search size={16} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search address or estate in Lagos..." 
                    value={searchQuery}
                    onChange={(e) => handleManualSearch(e.target.value)}
                    className="bg-transparent border-none outline-none text-white font-bold text-[13px] w-full pr-2 placeholder:text-gray-500"
                  />
                  
                  {/* Microphone Voice Search Button */}
                  <button 
                    onClick={handleVoiceSearch}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-charistar-green hover:bg-white/10'
                    }`}
                  >
                    {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                  </button>
                </div>

                {/* Predictive autocomplete results dropdown card */}
                {isSearching && searchResults.length > 0 && (
                  <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 divide-y divide-white/5 shadow-xl bg-charistar-dark/95 backdrop-blur-md max-h-[220px] overflow-y-auto no-scrollbar">
                    {searchResults.map((res, i) => (
                      <div 
                        key={i}
                        onClick={() => handleSelectSearchResult(res)}
                        className="p-3.5 hover:bg-white/5 cursor-pointer text-left transition-colors flex gap-3 items-start animate-scaleUp"
                      >
                        <MapPin size={15} className="text-charistar-green flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-white text-xs font-black leading-tight uppercase tracking-wide">{res.title}</h4>
                          <p className="text-gray-500 text-[10px] font-semibold leading-normal mt-0.5">{res.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Floating Live GPS Puck Geolocator */}
              <div className="absolute bottom-4 right-4 z-30 flex flex-col gap-2">
                <button 
                  onClick={handleGPSGeolocate}
                  disabled={gpsLoading}
                  className="w-12 h-12 bg-charistar-green text-black border-2 border-charistar-dark rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                >
                  <Navigation size={18} className={`stroke-[2.5px] ${gpsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Floating GPS Accuracy Badge Label */}
              {gpsAccuracy && (
                <div className="absolute bottom-4 left-4 z-30 bg-black/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/5 text-[9px] font-black text-gray-500 uppercase tracking-widest pointer-events-none">
                  {gpsAccuracy}
                </div>
              )}

            </div>

            {/* Bottom sheet info detail panel */}
            <div className="glass-panel border-t border-white/10 z-30 p-6 flex flex-col gap-5 flex-shrink-0 bg-charistar-dark/95 backdrop-blur-xl">
              
              {/* Geocoding text */}
              <div className="space-y-1.5 text-left">
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest pl-0.5">Resolved Haven</p>
                <div className="flex items-start gap-2.5">
                  <MapPin size={16} className="text-charistar-green flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-white text-sm font-black uppercase tracking-wider leading-tight">
                      {resolvedPlaceName.startsWith('Near') ? `Near: ${resolvedPlaceName.substring(5)}` : `At: ${resolvedPlaceName}`}
                    </h3>
                    <p className="text-gray-400 text-xs mt-0.5 font-semibold leading-relaxed">{resolvedAddress || 'Lagos, Nigeria'}</p>
                  </div>
                </div>
              </div>

              {/* Delivery instructions note text area */}
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest pl-0.5">Dispatcher Notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Red security gate opposite zenith bank lobby, call when arriving..."
                  value={deliveryNote}
                  onChange={(e) => {
                    setDeliveryNote(e.target.value);
                    runAICheck(resolvedAddress, e.target.value);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-white outline-none focus:border-charistar-green focus:ring-1 focus:ring-charistar-green transition-all placeholder:text-gray-600 resize-none"
                />
              </div>

              {/* Dynamic client side AI location assistant card */}
              <div className="bg-[#A3C644]/5 border border-[#A3C644]/15 p-4 rounded-[1.8rem] text-left space-y-2 animate-scaleUp">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-charistar-green tracking-widest flex items-center gap-1.5">
                    <Sparkles size={12} className="animate-pulse" /> AI Location Assistant
                  </span>
                  <span className="text-[9px] bg-charistar-green/10 text-charistar-green border border-charistar-green/20 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wide">
                    {aiReport.rating}
                  </span>
                </div>

                {/* Landmarks detected */}
                {aiReport.landmarks.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {aiReport.landmarks.map((land, i) => (
                      <span key={i} className="text-[9px] font-black uppercase text-white bg-white/5 px-2 py-0.5 rounded border border-white/5 flex items-center gap-1">
                        <Landmark size={9} className="text-charistar-green" /> {land}
                      </span>
                    ))}
                  </div>
                )}

                {/* Conflicts detected */}
                {aiReport.conflicts.length > 0 ? (
                  <div className="space-y-1 pt-1">
                    {aiReport.conflicts.map((conf, i) => (
                      <p key={i} className="text-[10px] font-semibold text-red-400 flex items-center gap-1.5">
                        <AlertTriangle size={11} className="text-red-400 flex-shrink-0" /> {conf}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 font-semibold flex items-center gap-1.5 pt-0.5">
                    <CheckCircle size={11} className="text-charistar-green flex-shrink-0" /> Route optimized correctly. Insulated carrier box confirmed.
                  </p>
                )}
              </div>

              {/* Confirmation CTA button */}
              <button
                onClick={handleConfirmLocation}
                disabled={resolvedPlaceName === 'Locating...'}
                className="w-full bg-charistar-green text-black font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 text-xs tracking-wider uppercase"
              >
                <Check size={16} strokeWidth={3} /> Save Delivery Haven
              </button>

            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


