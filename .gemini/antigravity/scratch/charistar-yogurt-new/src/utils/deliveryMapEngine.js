/* ================================================================
   Charistar Yogurt – Smart Location Detection Engine
   Tier 1: Kalman Filter GPS smoothing
   Tier 2: Smart Location Detection (primary, always runs)
   Tier 3: Mapbox + Nominatim consensus (parallel fallback)
   ================================================================ */

export const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiY2hhcmlzdGFyIiwiYSI6ImNsajE4NXR2YTAxdHQzZ215eG1jMXBvNjYifQ.X9031n_ZlB41d2L4W4P2oA';
const GEMINI_KEY    = 'AIzaSyAhG9cez96SgeXOnTSu4Ri5k_aWHYDHbwM';
const GEMINI_URL    = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_KEY;

// Default Dispatch Lagos Kitchen: Ikeja City Mall area
export const KITCHEN_COORDS = [3.3516, 6.6120];

/* ================================================================
   TIER 1 — Kalman Filter (GPS Signal Smoother)
   ================================================================ */
class KalmanFilter {
  constructor() {
    this.lat       = null;
    this.lng       = null;
    this.variance  = -1;     // -1 = uninitialized
    this.timestamp = null;
    this.PROCESS_NOISE = 4;  // assume user can move ~2m/s
  }

  process(lat, lng, accuracy, timestampMs) {
    const acc = Math.max(accuracy, 1);

    if (this.variance < 0) {
      this.lat       = lat;
      this.lng       = lng;
      this.variance  = acc * acc;
      this.timestamp = timestampMs;
      return { lat, lng, filteredAccuracy: acc };
    }

    const dt = Math.max((timestampMs - this.timestamp) / 1000, 0);
    this.timestamp = timestampMs;

    this.variance += dt * this.PROCESS_NOISE * this.PROCESS_NOISE;
    const K = this.variance / (this.variance + acc * acc);

    this.lat += K * (lat - this.lat);
    this.lng += K * (lng - this.lng);
    this.variance = (1 - K) * this.variance;

    const filteredAccuracy = Math.sqrt(this.variance);
    return { lat: this.lat, lng: this.lng, filteredAccuracy };
  }

  reset() {
    this.variance = -1;
    this.lat = null;
    this.lng = null;
  }
}

/* ================================================================
   GPS Watch — uses Kalman filter on every fix
   ================================================================ */
export function watchGPS(onUpdate, onError) {
  if (!navigator.geolocation) {
    onError('Geolocation not supported by this browser.');
    return () => {};
  }

  const filter   = new KalmanFilter();
  let best       = Infinity;
  let watchId    = null;
  let resolved   = false;
  let fixCount   = 0;
  const MAX_FIXES = 8;

  const stop = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  };

  const bail = setTimeout(() => {
    stop();
    if (!resolved) {
      onError('GPS signal too weak. Move outdoors or search your address manually.');
    }
  }, 25000);

  const handle = (pos) => {
    const { latitude: lat, longitude: lng, accuracy } = pos.coords;

    if (accuracy > 200) {
      console.log(`[GPS] Skipping coarse fix: ${Math.round(accuracy)}m — waiting for GPS lock`);
      return;
    }

    const filtered = filter.process(lat, lng, accuracy, Date.now());
    const fAcc     = filtered.filteredAccuracy;

    if (fAcc >= best && fixCount > 0) return;
    best = fAcc;
    resolved = true;
    fixCount++;

    let label;
    if      (fAcc <= 10) label = `Excellent GPS · ${Math.round(fAcc)}m`;
    else if (fAcc <= 30) label = `Good GPS · ${Math.round(fAcc)}m`;
    else if (fAcc <= 80) label = `Fair GPS · ${Math.round(fAcc)}m`;
    else                 label = `Low GPS · ${Math.round(fAcc)}m — try moving outside`;

    clearTimeout(bail);
    onUpdate({ lat: filtered.lat, lng: filtered.lng, accuracy: fAcc, accuracyLabel: label });

    if (fAcc <= 15 || fixCount >= MAX_FIXES) stop();
  };

  const fail = (err) => {
    stop(); clearTimeout(bail);
    let msg = 'GPS error. Please search your address manually.';
    if (err.code === 1) msg = 'Location permission denied. Allow location access and try again.';
    if (err.code === 2) msg = 'GPS signal unavailable. Try moving outdoors.';
    if (err.code === 3) msg = 'GPS timed out. Move to an open area and retry.';
    if (!resolved) onError(msg);
  };

  const opts = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
  navigator.geolocation.getCurrentPosition(handle, () => {}, opts);
  watchId = navigator.geolocation.watchPosition(handle, fail, opts);
  return stop;
}

/* ================================================================
   TIER 2 — Smart Location Detection & FallbackreverseGeocode
   ================================================================ */
const geoCache = new Map();

export async function reverseGeocode(lng, lat, accuracy = 50) {
  const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (geoCache.has(cacheKey)) {
    return sanitizeResult(geoCache.get(cacheKey));
  }

  const [smartRes, mbRes, nomRes] = await Promise.allSettled([
    _geminiGeocode(lat, lng, accuracy, null, null),
    _geocodeMapbox(lng, lat),
    _geocodeNominatim(lat, lng)
  ]);

  const smart     = smartRes.status === 'fulfilled' ? smartRes.value : null;
  const mapbox    = mbRes.status    === 'fulfilled' ? mbRes.value    : null;
  const nominatim = nomRes.status   === 'fulfilled' ? nomRes.value   : null;

  const mbScore  = _scoreResult(mapbox,    lng, lat);
  const nomScore = _scoreResult(nominatim, lng, lat);

  let best = null;

  if (smart && smart.placeName) {
    best = smart;
  } else if (mbScore >= 60 || nomScore >= 60) {
    if (mapbox && nominatim) {
      best = mbScore >= nomScore ? mapbox : nominatim;
    } else {
      best = mapbox || nominatim;
    }
  } else {
    best = mapbox || nominatim;
  }

  if (!best) {
    best = { placeName: 'Within Lagos', fullAddress: 'Lagos, Nigeria', landmark: 'None' };
  }

  geoCache.set(cacheKey, best);
  return sanitizeResult(best);
}

/* ── Internal: Mapbox geocoder ── */
async function _geocodeMapbox(lng, lat) {
  const url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'
    + lng + ',' + lat
    + '.json?access_token=' + MAPBOX_ACCESS_TOKEN
    + '&types=poi,address,neighborhood,locality,place&limit=10&language=en&country=NG';

  const res = await fetch(url);
  if (!res.ok) throw new Error('Mapbox HTTP ' + res.status);

  const { features = [] } = await res.json();
  if (!features.length) return null;

  const scored = features.map(f => {
    const type = f.place_type[0];
    const cat  = ((f.properties && f.properties.category) || '').toLowerCase();
    let s = type === 'poi'
      ? (/building|house|estate|tower|court|villa|compound|residence|school|hospital|church|mosque|bank|mall|hotel|market|restaurant|shop/.test(cat) ? 100 : 78)
      : type === 'address'      ? (f.address ? 85 : 58)
      : type === 'neighborhood' ? 42
      : type === 'locality'     ? 28
      : type === 'place'        ? 18 : 8;

    const c = f.center || (f.geometry && f.geometry.coordinates);
    if (c) s -= _dist(lng, lat, c[0], c[1]) * 0.35;
    return { f, s, type };
  }).sort((a, b) => b.s - a.s);

  const { f, s, type } = scored[0];
  const name = f.text || f.place_name.split(',')[0].trim();
  const poi  = scored.find(x => x.type === 'poi' && x.s > 30);
  const isExact = (type === 'poi' || type === 'address') && s > 40;

  const rawFull  = f.place_name || '';
  const cleanFull = rawFull.replace(/,?\s*Nigeria\s*$/, '').trim();

  return {
    placeName:   isExact ? name : 'Near ' + name,
    fullAddress: cleanFull || rawFull,
    landmark:    poi ? poi.f.text : 'None',
    score:       s
  };
}

/* ── Internal: Nominatim geocoder ── */
async function _geocodeNominatim(lat, lng) {
  const url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2'
    + '&lat=' + lat + '&lon=' + lng + '&zoom=18&addressdetails=1';
  const res = await fetch(url, { headers: { 'User-Agent': 'Charistar/1.0' } });
  if (!res.ok) throw new Error('Nominatim HTTP ' + res.status);

  const d = await res.json();
  const a = d.address || {};

  const exact  = a.amenity || a.building || a.shop || a.restaurant
               || a.cafe   || a.fast_food || a.hospital || a.school || a.place_of_worship;
  const street = a.road ? (a.house_number ? a.house_number + ' ' + a.road : a.road) : null;
  const area   = a.neighbourhood || a.suburb || a.city_district || a.city;
  const name   = exact || street || area || 'Your Location';
  const ok     = !!(exact || (a.house_number && a.road));

  const parts    = [exact || street, a.neighbourhood || a.suburb, a.city || a.town].filter(Boolean);
  const fullAddr = parts.join(', ') || 'Lagos, Nigeria';

  return {
    placeName:   ok ? name : 'Near ' + name,
    fullAddress: fullAddr,
    landmark:    exact || 'None'
  };
}

/* ── Smart Location Detection via Gemini API ── */
async function _geminiGeocode(lat, lng, accuracy, mapboxHint, nominatimHint) {
  try {
    const mb  = mapboxHint  ? `"${mapboxHint.placeName}" / "${mapboxHint.fullAddress}"` : 'unavailable';
    const nom = nominatimHint ? `"${nominatimHint.placeName}" / "${nominatimHint.fullAddress}"` : 'unavailable';

    const prompt = `You are a local address expert for Lagos, Nigeria, helping a yogurt delivery app.
   
GPS coordinates: latitude ${lat.toFixed(6)}, longitude ${lng.toFixed(6)}
GPS accuracy radius: ~${Math.round(accuracy)} meters

Two map services gave these results:
- Mapbox: ${mb}
- OpenStreetMap: ${nom}

Your task: Identify the most accurate, human-friendly delivery address for this location.
Rules:
- Use recognisable Lagos landmarks, estates, streets, or areas (e.g. "Ikeja City Mall", "Victoria Island", "Lekki Phase 1", "Maryland", "Surulere")
- NEVER include raw GPS coordinates or decimal numbers in the address
- Keep placeName short (max 4 words), fullAddress more complete
- If truly uncertain, use the nearest well-known Lagos area name

Respond ONLY with valid JSON — no markdown, no explanation:
{"placeName": "short place name", "fullAddress": "full human-readable address"}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 150
      }
    };

    const res = await fetch(GEMINI_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body)
    });

    if (!res.ok) {
      console.warn('[SmartLoc] HTTP error:', res.status);
      return null;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return null;

    const clean = text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(clean);

    if (parsed.placeName && parsed.fullAddress) {
      return {
        placeName:   String(parsed.placeName).trim(),
        fullAddress: String(parsed.fullAddress).trim(),
        landmark:    'None',
        source:      'Smart Location Detection'
      };
    }
  } catch(e) {
    console.warn('[SmartLoc] geocode failed:', e.message);
  }
  return null;
}

/* ── Score a geocoder result for quality ── */
function _scoreResult(r, lng, lat) {
  if (!r || !r.placeName) return 0;
  let s = 50; 

  const p = r.placeName.toLowerCase();
  const f = (r.fullAddress || '').toLowerCase();

  if (!p.startsWith('near ')) s += 20;
  if (p.includes('estate') || p.includes('market') || p.includes('school')
   || p.includes('hospital') || p.includes('church') || p.includes('mosque')
   || p.includes('hotel') || p.includes('mall') || p.includes('tower')) s += 25;

  if (p === 'within lagos' || p === 'your location' || p === 'lagos') s -= 40;
  if (p.includes('unnamed') || p.includes('unknown')) s -= 30;
  if (!f || f.length < 10) s -= 20;

  if (f.includes(',') && f.split(',').length >= 3) s += 10;

  return Math.max(0, s);
}

/* ================================================================
   Address autocomplete (Mapbox, Nigeria-biased)
   ================================================================ */
export async function searchAddress(query, nearCoords) {
  if (!query || query.trim().length < 2) return [];
  const prox = nearCoords ? (nearCoords[0] + ',' + nearCoords[1]) : `${KITCHEN_COORDS[0]},${KITCHEN_COORDS[1]}`;
  try {
    const url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'
      + encodeURIComponent(query)
      + '.json?access_token=' + MAPBOX_ACCESS_TOKEN
      + '&limit=5&country=NG&language=en&proximity=' + prox;
    const res = await fetch(url);
    if (res.ok) {
      const { features = [] } = await res.json();
      return features.map(f => ({
        title:       f.text || f.place_name.split(',')[0],
        description: f.place_name.replace(/,?\s*Nigeria\s*$/, '').trim(),
        coordinates: f.center
      }));
    }
  } catch(e) { console.warn('[Search] Failed:', e.message); }
  return [];
}

/* ================================================================
   Delivery fee / ETA based on distance from Lagos kitchen
   ================================================================ */
export function isOutOfZone(lng, lat) {
  return _dist(KITCHEN_COORDS[0], KITCHEN_COORDS[1], lng, lat) / 1000 > 45;
}

export function getDeliveryFee(lng, lat) {
  const km = _dist(KITCHEN_COORDS[0], KITCHEN_COORDS[1], lng, lat) / 1000;
  if (km > 45) return 0;
  if (km <= 5)  return 800;
  if (km <= 10) return 1200;
  if (km <= 20) return 1800;
  if (km <= 35) return 2500;
  return 3500;
}

export function getETA(lng, lat) {
  const km   = _dist(KITCHEN_COORDS[0], KITCHEN_COORDS[1], lng, lat) / 1000;
  const base = Math.round(15 + km * 2.5);
  return base + '–' + (base + 10) + ' mins';
}

function sanitizeResult(res) {
  if (!res) return res;
  const coordPat = /^-?\d+\.\d{3,}|[-\d.]{3,},\s*[-\d.]+|\bGPS\s*\(|\bLocation\s*\(/i;
  if (!res.placeName   || coordPat.test(res.placeName.trim()))   res.placeName   = 'Within Lagos';
  if (!res.fullAddress || coordPat.test(res.fullAddress.trim())) res.fullAddress = 'Lagos, Nigeria';
  return res;
}

function _dist(lon1, lat1, lon2, lat2) {
  const R    = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    = Math.sin(dLat/2)**2
             + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
