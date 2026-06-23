/* ══════════════════════════════════════════════════
   VANGUARD — CLEAN REBUILD APP.JS
   ══════════════════════════════════════════════════ */

'use strict';

// ─────────────────────────────────────────────────────
// MAPBOX CONFIG
// ─────────────────────────────────────────────────────
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmF5b25sZTEiLCJhIjoiY21wZjd3b2N4MDF6ODJ0c2VwOXhjYjh3OSJ9.ACkq2SJ6sGvaKTCZjfq_eQ';
let commanderMap = null;
let commanderMarker = null;

// ─────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────
const State = {
    role: localStorage.getItem('vg_role') || null,          // 'tracker' | 'commander'
    user: JSON.parse(localStorage.getItem('vg_user') || 'null'),
    deviceId: localStorage.getItem('vg_device_id') || generateId(),
    linkedDevices: JSON.parse(localStorage.getItem('vg_devices') || '[]'),
    stolen: false,
    alarmActive: false,
    alarmCtx: null,
    alarmOsc: null,
    alarmLfo: null,
    watchId: null,
    lastLocation: null,
    protectionActive: localStorage.getItem('vg_protection_active') !== 'false',
    pinEnabled: localStorage.getItem('vg_pin_enabled') === 'true',
    pinHash: localStorage.getItem('vg_pin_hash') || null,
    pinLockSettings: localStorage.getItem('vg_pin_lock_settings') === 'true',
    pinLockToggle: localStorage.getItem('vg_pin_lock_toggle') === 'true',
};

function generateId() {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('vg_device_id', id);
    return id;
}

function save(key, val) {
    try {
        localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
    } catch (e) {
        console.error("Storage save error:", e);
        if (e.name === 'QuotaExceededError') {
            // If storage is full, clear the heaviest item (photos) and retry
            localStorage.removeItem('vg_evidence_photos');
            try {
                localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
            } catch (err) {
                console.error("Still unable to save after clearing photos:", err);
            }
        }
    }
}

// ─────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }
function show(id) { const el = $(id); if (el) el.style.display = 'flex'; }
function hide(id) { const el = $(id); if (el) el.style.display = 'none'; }
function showBlock(id) { const el = $(id); if (el) el.style.display = 'block'; }

// ─────────────────────────────────────────────────────
// NOTIFICATION SYSTEM
// ─────────────────────────────────────────────────────
const NOTIF_ICONS = {
    success: 'fa-circle-check',
    danger:  'fa-triangle-exclamation',
    warning: 'fa-bell',
    info:    'fa-circle-info',
    default: 'fa-shield-halved',
};
const NOTIF_TITLES = {
    success: 'Success',
    danger:  'Alert',
    warning: 'Warning',
    info:    'Info',
    default: 'Vanguard',
};

/**
 * Show a premium stacking notification.
 * @param {string} msg      — The message body
 * @param {string} type     — 'success' | 'danger' | 'warning' | 'info' | 'default'
 * @param {number} duration — ms before auto-dismiss (default 3500)
 * @param {string} title    — Optional override for card title
 */
function notify(msg, type = 'default', duration = 3500, title = null) {
    const stack = document.getElementById('notif-stack');
    if (!stack) return;

    const icon  = NOTIF_ICONS[type]  || NOTIF_ICONS.default;
    const label = title || NOTIF_TITLES[type] || NOTIF_TITLES.default;

    const card = document.createElement('div');
    card.className = `notif-card notif-${type}`;
    card.innerHTML = `
        <div class="notif-icon"><i class="fa-solid ${icon}"></i></div>
        <div class="notif-body">
            <span class="notif-title">${label}</span>
            <span class="notif-msg">${msg}</span>
        </div>
        <button class="notif-close" aria-label="Dismiss"><i class="fa-solid fa-xmark"></i></button>
        <div class="notif-bar" style="animation-duration:${duration}ms;"></div>`;

    stack.prepend(card);

    // Trigger enter animation on next frame
    requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('notif-show')));

    // Auto-dismiss
    let timer = setTimeout(() => dismissNotif(card), duration);

    // Click card or close button → dismiss immediately
    card.addEventListener('click', () => { clearTimeout(timer); dismissNotif(card); });
    card.querySelector('.notif-close').addEventListener('click', (e) => {
        e.stopPropagation();
        clearTimeout(timer);
        dismissNotif(card);
    });

    // Keep at most 4 visible
    const cards = stack.querySelectorAll('.notif-card');
    if (cards.length > 4) {
        const oldest = cards[cards.length - 1];
        dismissNotif(oldest);
    }
}

function dismissNotif(card) {
    if (!card || card.classList.contains('notif-exit')) return;
    card.classList.remove('notif-show');
    card.classList.add('notif-exit');
    setTimeout(() => card.remove(), 340);
}

/**
 * Legacy shim: toast(msg, duration?) auto-detects type by emoji prefix.
 * ✓ → success, ⚠ / 🚨 → warning / danger, ℹ → info, else default.
 */
function toast(msg, duration = 3000) {
    let type = 'default';
    const first = (msg || '').trimStart()[0];
    if (first === '✓' || first === '✅') type = 'success';
    else if (first === '⚠' || msg.startsWith('⚠️')) type = 'warning';
    else if (first === '🚨' || first === '❌') type = 'danger';
    else if (first === 'ℹ') type = 'info';
    // Strip leading emoji for cleaner display
    const clean = msg.replace(/^[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}✓✅⚠❌ℹ]+\s*/u, '');
    notify(clean || msg, type, duration);
}

function timestamp() {
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function addTrackerEvent(text, type = '') {
    const feed = $('tracker-event-feed');
    if (!feed) return;
    // Remove empty state
    const empty = feed.querySelector('.empty-state');
    if (empty) empty.remove();

    const icons = { danger: 'fa-triangle-exclamation', success: 'fa-circle-check', '': 'fa-circle-dot' };
    const icon = icons[type] || 'fa-circle-dot';

    const item = document.createElement('div');
    item.className = `event-item ${type}`;
    item.innerHTML = `
        <i class="fa-solid ${icon} event-icon"></i>
        <div class="event-text">
            <strong>${text}</strong>
            <small>${timestamp()}</small>
        </div>`;
    feed.prepend(item);
}

// ─────────────────────────────────────────────────────
// BACKEND-BACKED AUTHENTICATION (KV PROD)
// ─────────────────────────────────────────────────────
async function firebaseLogin(email, password) {
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Login failed.');
    }
    const data = await res.json();
    return { user: { email: data.user.email, name: data.user.name, uid: data.user.uid } };
}

async function firebaseRegister(email, password) {
    const name = $('reg-name') ? $('reg-name').value : email.split('@')[0];
    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Registration failed.');
    }
    const data = await res.json();
    return { user: { email: data.user.email, name: data.user.name, uid: data.user.uid } };
}

function firebaseLogout() {
    // Clear session cookies
    document.cookie = 'vg_email=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    return Promise.resolve();
}

// ─────────────────────────────────────────────────────
// ROUTING — SHOW THE RIGHT SCREEN
// ─────────────────────────────────────────────────────
function route() {
    // Hide all top-level screens
    ['screen-login', 'screen-role', 'app-tracker', 'app-commander'].forEach(id => {
        const el = $(id);
        if (el) el.style.display = 'none';
    });

    // Reset page scroll position to the top/header
    window.scrollTo(0, 0);
    const trackerBody = $('tracker-body');
    if (trackerBody) trackerBody.scrollTop = 0;
    const commanderBody = $('commander-body');
    if (commanderBody) commanderBody.scrollTop = 0;

    if (!State.user) {
        // Show login
        const el = $('screen-login');
        if (el) el.style.display = 'flex';
        return;
    }

    if (!State.role) {
        // Show role selection
        const el = $('screen-role');
        if (el) el.style.display = 'flex';
        return;
    }

    if (State.role === 'tracker') {
        const el = $('app-tracker');
        if (el) el.style.display = 'flex';
        initTracker();
    } else {
        const el = $('app-commander');
        if (el) el.style.display = 'flex';
        initCommander();
    }
}

// ─────────────────────────────────────────────────────
// AUTH SCREEN
// ─────────────────────────────────────────────────────
function initAuth() {
    // Tab toggle
    document.querySelectorAll('#auth-tab-toggle .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#auth-tab-toggle .tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            $('auth-panel-login').style.display = tab === 'login' ? 'block' : 'none';
            $('auth-panel-register').style.display = tab === 'register' ? 'block' : 'none';
        });
    });

    // Login
    $('btn-login').addEventListener('click', async () => {
        const email = $('login-email').value.trim();
        const pass = $('login-password').value;
        if (!email || !pass) { showAuthError('Please fill in all fields.'); return; }
        try {
            const result = await firebaseLogin(email, pass);
            State.user = { email: result.user.email, uid: result.user.uid };
            save('vg_user', State.user);
            $('auth-error').style.display = 'none';
            route();
        } catch (e) {
            showAuthError(e.message || 'Login failed.');
        }
    });

    // Register
    $('btn-register').addEventListener('click', async () => {
        const email = $('reg-email').value.trim();
        const pass = $('reg-password').value;
        if (!email || !pass) { showAuthError('Please fill in all fields.'); return; }
        if (pass.length < 6) { showAuthError('Password must be at least 6 characters.'); return; }
        try {
            const result = await firebaseRegister(email, pass);
            State.user = { email: result.user.email, uid: result.user.uid };
            save('vg_user', State.user);
            $('auth-error').style.display = 'none';
            route();
        } catch (e) {
            showAuthError(e.message || 'Registration failed.');
        }
    });

}

function showAuthError(msg) {
    const el = $('auth-error');
    el.textContent = msg;
    el.style.display = 'block';
}

// ─────────────────────────────────────────────────────
// ROLE SCREEN
// ─────────────────────────────────────────────────────
function initRoleScreen() {
    $('btn-role-tracker').addEventListener('click', () => {
        State.role = 'tracker';
        save('vg_role', 'tracker');
        route();
    });
    $('btn-role-commander').addEventListener('click', () => {
        State.role = 'commander';
        save('vg_role', 'commander');
        route();
    });
}

// ─────────────────────────────────────────────────────
// BOTTOM NAV
// ─────────────────────────────────────────────────────
function initNav(shellId) {
    const shell = $(shellId);
    if (!shell) return;
    shell.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = btn.dataset.tab;
            
            // PIN gate check for Tracker sensitive tabs
            if (shellId === 'app-tracker' && (tabId === 'tracker-tab-settings' || tabId === 'tracker-tab-permissions')) {
                if (State.pinLockSettings && State.pinEnabled && State.pinHash) {
                    requestPinAuthorization(() => {
                        switchTab(shell, btn, tabId);
                    });
                    return;
                }
            }

            switchTab(shell, btn, tabId);
        });
    });
}

function switchTab(shell, btn, tabId) {
    shell.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    shell.querySelectorAll('.tab-screen').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    const tab = $(tabId);
    if (tab) tab.classList.add('active');
    
    // Reset tab content scroll to starting header position
    const body = shell.querySelector('.app-body');
    if (body) {
        body.scrollTop = 0;
    }
}

// ─────────────────────────────────────────────────────
// TRACKER APP
// ─────────────────────────────────────────────────────
let trackerInitialized = false;
function initTracker() {
    if (trackerInitialized) {
        // Already initialized — just update live UI elements
        updateTrackerConnectionDot();
        setProtectionActive(State.protectionActive, true);
        return;
    }
    if (State.pinEnabled && State.pinHash) {
        requestPinAuthorization(() => {
            continueInitTracker();
        });
    } else {
        continueInitTracker();
    }
}

function continueInitTracker() {
    initNav('app-tracker');

    // Load device hardware specs remotely to sync with Commander
    loadDeviceForensics();

    // Suppress stale triggers from previous sessions
    window.suppressTriggers = true;
    setTimeout(() => { window.suppressTriggers = false; }, 3000);
    ['vg_trigger_siren', 'vg_trigger_photo', 'vg_trigger_network', 'vg_trigger_locate', 'vg_trigger_broken_screen', 'vg_trigger_audio', 'vg_trigger_wipe'].forEach(k => {
        save(k, 'false');
    });

    // Device ID
    const el = $('tracker-device-id');
    if (el) el.textContent = State.deviceId;

    // Battery
    if ('getBattery' in navigator) {
        navigator.getBattery().then(bat => {
            const pct = Math.round(bat.level * 100);
            const el = $('tracker-battery');
            if (el) el.textContent = pct + '%';
        });
    } else {
        const el = $('tracker-battery');
        if (el) el.textContent = 'N/A';
    }

    // Network
    const netEl = $('tracker-network');
    if (netEl) netEl.textContent = navigator.onLine ? 'Online' : 'Offline';

    // GPS Status
    const gpsEl = $('tracker-gps-status');
    if (gpsEl) {
        if ('geolocation' in navigator) {
            gpsEl.textContent = State.protectionActive ? 'Active' : 'Paused';
            if (State.protectionActive) {
                startLocationTracking();
            }
        } else {
            gpsEl.textContent = 'N/A';
        }
    }

    // Connection dot
    updateTrackerConnectionDot();
    window.addEventListener('online', () => { if (netEl) netEl.textContent = 'Online'; updateTrackerConnectionDot(); });
    window.addEventListener('offline', () => { if (netEl) netEl.textContent = 'Offline'; updateTrackerConnectionDot(); });

    if (!trackerInitialized) {
        // SMS settings
        loadSmsSettings();
        $('btn-save-sms').addEventListener('click', saveSmsSettings);
        $('sms-trigger-word').addEventListener('input', () => {
            const prev = $('sms-word-preview');
            if (prev) prev.textContent = $('sms-trigger-word').value || 'FIND ME';
        });

        // Contacts
        loadContacts();
        $('btn-save-contacts').addEventListener('click', saveContacts);

        // System Protection Toggle
        const toggle = $('tracker-protection-toggle');
        if (toggle) {
            toggle.checked = State.protectionActive;
            toggle.addEventListener('change', (e) => {
                setProtectionActive(e.target.checked);
            });
        }
        // Run initial UI state update
        setProtectionActive(State.protectionActive, true);

        // Permissions — all 6 cards
        checkPermissions();
        $('btn-req-camera').addEventListener('click', requestCamera);
        $('btn-req-location').addEventListener('click', requestLocation);
        $('btn-req-mic').addEventListener('click', requestMicrophone);
        $('btn-req-notif').addEventListener('click', requestNotifications);
        $('btn-req-sms').addEventListener('click', showSmsInfo);
        $('btn-req-admin').addEventListener('click', requestDeviceAdmin);
        $('btn-grant-all').addEventListener('click', grantAllPermissions);

        // Report safe
        $('btn-report-safe').addEventListener('click', () => {
            addTrackerEvent('Device reported safe by owner', 'success');
            toast('✓ Device marked as safe');
        });

        // Clear log
        $('btn-clear-tracker-log').addEventListener('click', () => {
            const feed = $('tracker-event-feed');
            feed.innerHTML = '<div class="empty-state"><i class="fa-solid fa-satellite-dish"></i><p>No events yet.<br>All activity will appear here.</p></div>';
        });

        // PIN settings listeners
        loadPinSettings();
        $('settings-pin-enable').addEventListener('change', (e) => {
            const active = e.target.checked;
            if (active) {
                if (!State.pinHash) {
                    showPinPad('setup_new', () => {
                        State.pinEnabled = true;
                        save('vg_pin_enabled', true);
                        loadPinSettings();
                    }, () => {
                        e.target.checked = false;
                    });
                } else {
                    State.pinEnabled = true;
                    save('vg_pin_enabled', true);
                    toast('✓ PIN lock enabled');
                }
            } else {
                requestPinAuthorization(() => {
                    State.pinEnabled = false;
                    save('vg_pin_enabled', false);
                    toast('PIN lock disabled');
                }, () => {
                    e.target.checked = true;
                });
            }
        });

        $('settings-pin-lock-settings').addEventListener('change', (e) => {
            const active = e.target.checked;
            State.pinLockSettings = active;
            save('vg_pin_lock_settings', active);
        });

        $('settings-pin-lock-toggle').addEventListener('change', (e) => {
            const active = e.target.checked;
            State.pinLockToggle = active;
            save('vg_pin_lock_toggle', active);
        });

        $('btn-change-pin').addEventListener('click', () => {
            if (State.pinHash) {
                requestPinAuthorization(() => {
                    showPinPad('setup_new');
                });
            } else {
                showPinPad('setup_new');
            }
        });

        // Switch mode / logout
        ['tracker-btn-logout', 'tracker-btn-logout2'].forEach(id => {
            const el = $(id);
            if (el) el.addEventListener('click', logout);
        });
        const switchBtn = $('tracker-btn-switch-mode');
        if (switchBtn) switchBtn.addEventListener('click', () => switchRole('commander'));

        trackerInitialized = true;
    }
}

function updateTrackerConnectionDot() {
    const dot = $('tracker-conn-dot');
    if (!dot) return;
    if (navigator.onLine) {
        dot.classList.add('online');
        dot.title = 'Connected';
    } else {
        dot.classList.remove('online');
        dot.title = 'Offline';
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

let lastGeocodedLat = 0;
let lastGeocodedLng = 0;
let lastGeocodeTime = 0;

function reverseGeocode(lat, lng, callback) {
    const now = Date.now();
    const distanceThreshold = 0.0003;
    const timeThreshold = 20000;
    
    if (lastGeocodeTime > 0 && 
        (now - lastGeocodeTime < timeThreshold) && 
        (Math.abs(lat - lastGeocodedLat) < distanceThreshold) && 
        (Math.abs(lng - lastGeocodedLng) < distanceThreshold)) {
        return;
    }
    
    lastGeocodedLat = lat;
    lastGeocodedLng = lng;
    lastGeocodeTime = now;

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    
    fetch(url, {
        headers: {
            'User-Agent': 'VanguardSecurityTracker/1.0'
        }
    })
    .then(r => r.json())
    .then(data => {
        if (data && data.display_name) {
            const addr = data.address;
            let cleanAddr = data.display_name;
            if (addr) {
                const parts = [];
                if (addr.road) parts.push(addr.road);
                if (addr.suburb) parts.push(addr.suburb);
                else if (addr.neighbourhood) parts.push(addr.neighbourhood);
                if (addr.city) parts.push(addr.city);
                else if (addr.town) parts.push(addr.town);
                if (addr.country) parts.push(addr.country);
                if (parts.length > 0) {
                    cleanAddr = parts.join(', ');
                }
            }
            callback(cleanAddr);
        } else {
            callback('Location acquired');
        }
    })
    .catch(err => {
        console.warn('Geocoding failed', err);
        callback('Location acquired');
    });
}

function startLocationTracking() {
    if (!State.protectionActive) return;
    if (State.watchId) return;
    State.watchId = navigator.geolocation.watchPosition(pos => {
        const { latitude: lat, longitude: lng, accuracy, speed } = pos.coords;
        const now = new Date();
        
        let calculatedSpeed = speed;
        if (State.lastLocation) {
            const lastLoc = State.lastLocation;
            const timeDiffSec = (now - new Date(lastLoc.time)) / 1000;
            if (timeDiffSec > 0) {
                const distMeters = calculateDistance(lastLoc.lat, lastLoc.lng, lat, lng);
                const derivedSpeed = distMeters / timeDiffSec;
                
                if (calculatedSpeed === null || calculatedSpeed === undefined) {
                    calculatedSpeed = derivedSpeed;
                }

                // Speeding detection (escapes in vehicles): > 33.3 m/s is 120 km/h
                if (derivedSpeed > 33.3) {
                    logBehaviorEvent({
                        title: '🚨 High-Speed Movement Detected',
                        detail: `Speed: ${(derivedSpeed * 3.6).toFixed(1)} km/h\nPossible vehicle escape in progress.`,
                        type: 'danger'
                    });
                }

                // Crash / Deceleration detection (sudden impact): deceleration > 8.0 m/s^2
                if (lastLoc.speed !== undefined && lastLoc.speed !== null) {
                    const accel = (calculatedSpeed - lastLoc.speed) / timeDiffSec;
                    if (accel < -8.0) {
                        logBehaviorEvent({
                            title: '💥 Sudden Deceleration / Impact Detected',
                            detail: `Deceleration: ${Math.abs(accel).toFixed(1)} m/s²\nPossible crash or sudden grab-and-stop.`,
                            type: 'danger'
                        });
                    }
                }
            }
        }

        // Pre-shutdown Battery Alert
        if ('getBattery' in navigator) {
            navigator.getBattery().then(bat => {
                const lvl = Math.round(bat.level * 100);
                if (lvl <= 5 && localStorage.getItem('vg_logged_battery_critical') !== 'true') {
                    logBehaviorEvent({
                        title: '🔋 Critical Battery Alert (Pre-Shutdown)',
                        detail: `Battery level is at ${lvl}%.\nDevice may power off soon. Last coordinates logged.`,
                        type: 'danger'
                    });
                    localStorage.setItem('vg_logged_battery_critical', 'true');
                } else if (lvl > 5) {
                    localStorage.setItem('vg_logged_battery_critical', 'false');
                }
            });
        }

        State.lastLocation = { lat, lng, speed: calculatedSpeed, time: now.toISOString() };
        save('vg_last_location', State.lastLocation);

        const locText = $('tracker-location-text');
        const locTime = $('tracker-location-time');
        
        if (locText) {
            locText.style.transition = 'opacity 0.2s';
            if (locText.textContent === 'Acquiring GPS…' || locText.textContent === '') {
                locText.textContent = 'Resolving location…';
            }
        }

        if (locTime) locTime.textContent = `Accuracy ±${Math.round(accuracy)}m · Updated ${timestamp()}`;
        const gpsEl = $('tracker-gps-status');
        if (gpsEl) gpsEl.textContent = 'Active';

        // Always reverse-geocode to get a readable place name
        reverseGeocode(lat, lng, (placeName) => {
            if (locText) {
                locText.style.opacity = '0';
                setTimeout(() => {
                    locText.textContent = placeName;
                    locText.style.opacity = '1';
                }, 200);
            }
        });

    }, err => {
        console.warn('GPS error', err);
        const gpsEl = $('tracker-gps-status');
        if (gpsEl) gpsEl.textContent = 'Denied';
    }, { enableHighAccuracy: true, maximumAge: 30000 });
}

function setProtectionActive(active, isInitial = false) {
    if (!active && !isInitial && State.pinLockToggle && State.pinEnabled && State.pinHash) {
        requestPinAuthorization(() => {
            applyProtectionToggle(false, false);
        }, () => {
            // Cancelled: restore checkbox
            const toggle = $('tracker-protection-toggle');
            if (toggle) toggle.checked = true;
        });
    } else {
        applyProtectionToggle(active, isInitial);
    }
}

function applyProtectionToggle(active, isInitial) {
    State.protectionActive = active;
    save('vg_protection_active', active);

    const toggle = $('tracker-protection-toggle');
    if (toggle) toggle.checked = active;

    const shieldGlow = $('tracker-shield-glow');
    const shieldIcon = $('tracker-shield-icon');
    const shieldStatus = $('tracker-shield-status');
    const shieldSub = $('tracker-shield-sub');
    const gpsEl = $('tracker-gps-status');
    const desc = $('tracker-protection-desc');

    if (active) {
        if (shieldGlow) shieldGlow.classList.remove('inactive');
        if (shieldIcon) shieldIcon.classList.remove('inactive');
        if (shieldStatus) {
            shieldStatus.classList.remove('inactive');
            shieldStatus.textContent = 'PROTECTED';
        }
        if (shieldSub) shieldSub.textContent = 'Device is being monitored';
        if (desc) desc.textContent = 'Active and monitoring device security';

        if (gpsEl) {
            if ('geolocation' in navigator) {
                gpsEl.textContent = 'Active';
                startLocationTracking();
            } else {
                gpsEl.textContent = 'N/A';
            }
        }

        if (!isInitial) {
            addTrackerEvent('Protection started — monitoring active', 'success');
            notify('Device is now being monitored and protected.', 'success', 4000, 'Protection Active');
        }
    } else {
        if (shieldGlow) shieldGlow.classList.add('inactive');
        if (shieldIcon) shieldIcon.classList.add('inactive');
        if (shieldStatus) {
            shieldStatus.classList.add('inactive');
            shieldStatus.textContent = 'INACTIVE';
        }
        if (shieldSub) shieldSub.textContent = 'Vanguard security is paused';
        if (desc) desc.textContent = 'Protection is paused. Tap switch to restart.';

        if (gpsEl) {
            if ('geolocation' in navigator) {
                gpsEl.textContent = 'Paused';
            } else {
                gpsEl.textContent = 'N/A';
            }
        }

        // Stop GPS watch
        if (State.watchId) {
            navigator.geolocation.clearWatch(State.watchId);
            State.watchId = null;
        }

        if (!isInitial) {
            addTrackerEvent('Protection paused by owner', 'danger');
            notify('Monitoring is paused. Device is unprotected.', 'warning', 5000, 'Protection Paused');
        }
    }

    // Sync to Android Native
    const nativePlugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.VanguardPlugin;
    if (nativePlugin && nativePlugin.setProtectionActive) {
        nativePlugin.setProtectionActive({ active })
            .catch(err => console.error('Failed to sync protection state to native:', err));
    }
}

// SMS Settings
function loadSmsSettings() {
    const word = localStorage.getItem('vg_sms_word') || 'FIND ME';
    const num  = localStorage.getItem('vg_sms_num')  || '';
    const wordEl = $('sms-trigger-word');
    const numEl  = $('sms-owner-number');
    const prev   = $('sms-word-preview');
    if (wordEl) wordEl.value = word;
    if (numEl)  numEl.value  = num;
    if (prev)   prev.textContent = word;

    // Load from Native SharedPreferences if available
    const nativePlugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.VanguardPlugin;
    if (nativePlugin && nativePlugin.getSmsSettings) {
        nativePlugin.getSmsSettings().then(res => {
            if (res.triggerWord) {
                if (wordEl) wordEl.value = res.triggerWord;
                if (prev) prev.textContent = res.triggerWord;
                save('vg_sms_word', res.triggerWord);
            }
            if (res.ownerNumber) {
                if (numEl) numEl.value = res.ownerNumber;
                save('vg_sms_num', res.ownerNumber);
            }
        }).catch(err => console.warn('Could not load native SMS settings:', err));
    }
}

function saveSmsSettings() {
    const word = $('sms-trigger-word').value.trim() || 'FIND ME';
    const num  = $('sms-owner-number').value.trim();
    save('vg_sms_word', word);
    save('vg_sms_num', num);
    const prev = $('sms-word-preview');
    if (prev) prev.textContent = word;

    // Save to Native SharedPreferences if available
    const nativePlugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.VanguardPlugin;
    if (nativePlugin && nativePlugin.saveSmsSettings) {
        nativePlugin.saveSmsSettings({ triggerWord: word, ownerNumber: num })
            .then(() => toast('✓ SMS settings saved & synced natively'))
            .catch(err => {
                console.error('Failed to sync SMS settings natively:', err);
                toast('✓ SMS settings saved (local only)');
            });
    } else {
        toast('✓ SMS settings saved');
    }
}

// Contacts
function loadContacts() {
    $('contact-name-1').value  = localStorage.getItem('vg_c1name')  || '';
    $('contact-phone-1').value = localStorage.getItem('vg_c1phone') || '';
    $('contact-name-2').value  = localStorage.getItem('vg_c2name')  || '';
    $('contact-phone-2').value = localStorage.getItem('vg_c2phone') || '';
}
function saveContacts() {
    save('vg_c1name',  $('contact-name-1').value);
    save('vg_c1phone', $('contact-phone-1').value);
    save('vg_c2name',  $('contact-name-2').value);
    save('vg_c2phone', $('contact-phone-2').value);
    toast('✓ Recovery contacts saved');
}

// ── PERMISSIONS ENGINE ─────────────────────────────
// Tracks which permissions are granted
const PermState = {
    camera:   false,
    location: false,
    mic:      false,
    notif:    false,
    sms:      false,
    admin:    false,
};

// Load saved perm state
function loadPermState() {
    const saved = JSON.parse(localStorage.getItem('vg_perms') || '{}');
    Object.assign(PermState, saved);
    Object.keys(PermState).forEach(key => {
        if (PermState[key]) applyPermGranted(key);
    });
}

function savePermState() {
    save('vg_perms', PermState);
}

function applyPermGranted(key) {
    PermState[key] = true;
    savePermState();

    const map = {
        camera:   { statusId: 'perm-camera-status',   btnId: 'btn-req-camera',   cardId: 'pcard-camera' },
        location: { statusId: 'perm-location-status', btnId: 'btn-req-location', cardId: 'pcard-location' },
        mic:      { statusId: 'perm-mic-status',      btnId: 'btn-req-mic',      cardId: 'pcard-mic' },
        notif:    { statusId: 'perm-notif-status',    btnId: 'btn-req-notif',    cardId: 'pcard-notif' },
        sms:      { statusId: 'perm-sms-status',      btnId: 'btn-req-sms',      cardId: 'pcard-sms' },
        admin:    { statusId: 'perm-admin-status',    btnId: 'btn-req-admin',    cardId: 'pcard-admin' },
    };

    const m = map[key];
    if (!m) return;

    const statusEl = $(m.statusId);
    const btnEl    = $(m.btnId);
    const cardEl   = $(m.cardId);

    if (statusEl) statusEl.textContent = '✓ Granted';
    if (btnEl)   { btnEl.textContent = '✓ Granted'; btnEl.classList.add('granted'); btnEl.disabled = true; }
    if (cardEl)  { cardEl.classList.add('granted'); cardEl.classList.remove('denied'); }

    updateProtectionScore();
    addTrackerEvent(`${key.charAt(0).toUpperCase() + key.slice(1)} permission granted`, 'success');
}

function applyPermDenied(key, message) {
    PermState[key] = false;
    const map = {
        camera:   { statusId: 'perm-camera-status',   cardId: 'pcard-camera' },
        location: { statusId: 'perm-location-status', cardId: 'pcard-location' },
        mic:      { statusId: 'perm-mic-status',      cardId: 'pcard-mic' },
        notif:    { statusId: 'perm-notif-status',    cardId: 'pcard-notif' },
    };
    const m = map[key];
    if (!m) return;
    const statusEl = $(m.statusId);
    const cardEl   = $(m.cardId);
    if (statusEl) statusEl.textContent = message || '✗ Denied';
    if (cardEl)  { cardEl.classList.add('denied'); cardEl.classList.remove('granted'); }
}

function updateProtectionScore() {
    // Count grantable permissions (exclude sms which is native-only)
    const keys = ['camera', 'location', 'mic', 'notif', 'admin'];
    const granted = keys.filter(k => PermState[k]).length;
    const total   = keys.length;
    const pct     = Math.round((granted / total) * 100);

    const ring  = $('perm-score-ring');
    const pctEl = $('perm-score-pct');
    const label = $('perm-score-label');

    if (pctEl)  pctEl.textContent  = pct + '%';
    if (label)  label.textContent  = `${granted} / ${total} permissions granted`;
    if (ring) {
        const color = pct === 100 ? 'var(--green)' : pct >= 60 ? 'var(--primary)' : 'var(--danger)';
        ring.style.background = `conic-gradient(${color} ${pct}%, var(--bg3) ${pct}%)`;
        ring.querySelector('span').style.color = color;
    }

    // Flash shield icon colour based on score
    const shield = $('tracker-shield-icon');
    if (shield) {
        shield.classList.toggle('danger', pct < 40);
    }
}

function checkPermissions() {
    loadPermState();
    navigator.permissions && navigator.permissions.query({ name: 'camera' }).then(r => {
        if (r.state === 'granted') applyPermGranted('camera');
        if (r.state === 'denied')  applyPermDenied('camera', '✗ Denied in browser');
    }).catch(() => {});
    navigator.permissions && navigator.permissions.query({ name: 'geolocation' }).then(r => {
        if (r.state === 'granted') applyPermGranted('location');
        if (r.state === 'denied')  applyPermDenied('location', '✗ Denied in browser');
    }).catch(() => {});
    navigator.permissions && navigator.permissions.query({ name: 'microphone' }).then(r => {
        if (r.state === 'granted') applyPermGranted('mic');
        if (r.state === 'denied')  applyPermDenied('mic', '✗ Denied in browser');
    }).catch(() => {});
    if (Notification.permission === 'granted') applyPermGranted('notif');
    if (Notification.permission === 'denied')  applyPermDenied('notif', '✗ Denied in browser');

    updateProtectionScore();
}

// ── INDIVIDUAL PERMISSION REQUESTS ──────────────────
function requestCamera() {
    const btn = $('btn-req-camera');
    if (btn) { btn.textContent = 'Requesting…'; btn.disabled = true; }
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            stream.getTracks().forEach(t => t.stop());
            applyPermGranted('camera');
            toast('✓ Camera access granted');
        })
        .catch(() => {
            applyPermDenied('camera', '✗ Denied — check browser settings');
            if (btn) { btn.textContent = 'Retry'; btn.disabled = false; }
            toast('⚠ Camera denied — check site permissions');
        });
}

function requestLocation() {
    const btn = $('btn-req-location');
    if (btn) { btn.textContent = 'Requesting…'; btn.disabled = true; }
    navigator.geolocation.getCurrentPosition(
        () => {
            applyPermGranted('location');
            startLocationTracking();
            toast('✓ Location access granted');
        },
        err => {
            applyPermDenied('location', err.code === 1 ? '✗ Denied — check browser settings' : '✗ Unavailable');
            if (btn) { btn.textContent = 'Retry'; btn.disabled = false; }
            toast('⚠ Location denied — check site permissions');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function requestMicrophone() {
    const btn = $('btn-req-mic');
    if (btn) { btn.textContent = 'Requesting…'; btn.disabled = true; }
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            stream.getTracks().forEach(t => t.stop());
            applyPermGranted('mic');
            toast('✓ Microphone access granted');
        })
        .catch(() => {
            applyPermDenied('mic', '✗ Denied — check browser settings');
            if (btn) { btn.textContent = 'Retry'; btn.disabled = false; }
            toast('⚠ Microphone denied — check site permissions');
        });
}

function requestNotifications() {
    const btn = $('btn-req-notif');
    if (btn) { btn.textContent = 'Requesting…'; btn.disabled = true; }
    Notification.requestPermission().then(p => {
        if (p === 'granted') {
            applyPermGranted('notif');
            // Send test notification
            new Notification('Vanguard Security', {
                body: '✓ Notifications are enabled. You will be alerted of theft attempts.',
                icon: 'icon.png'
            });
            toast('✓ Notifications enabled');
        } else {
            applyPermDenied('notif', '✗ Denied — check browser settings');
            if (btn) { btn.textContent = 'Retry'; btn.disabled = false; }
            toast('⚠ Notifications denied');
        }
    });
}

function showSmsInfo() {
    // SMS permission is Android-native only — show info toast + open Settings tab
    toast('SMS requires the native Android APK build', 3500);
    addTrackerEvent('SMS: Open Settings → SMS Trigger to configure', '');
    // Navigate to settings tab
    const settingsBtn = document.querySelector('[data-tab="tracker-tab-settings"]');
    if (settingsBtn) settingsBtn.click();
    // Mark as acknowledged (not truly granted)
    const smsStatus = $('perm-sms-status');
    if (smsStatus) smsStatus.textContent = 'Configured in Settings ↗';
    const smsCard = $('pcard-sms');
    if (smsCard) smsCard.style.borderColor = 'rgba(124,107,255,0.4)';
}

function requestDeviceAdmin() {
    const btn = $('btn-req-admin');
    const nativePlugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.VanguardPlugin;
    if (nativePlugin && nativePlugin.requestDeviceAdmin) {
        if (btn) { btn.textContent = 'Activating…'; btn.disabled = true; }
        nativePlugin.requestDeviceAdmin()
            .then(() => {
                applyPermGranted('admin');
                toast('✓ Anti-Uninstall lock activated');
            })
            .catch(err => {
                console.error('Device Admin activation failed:', err);
                if (btn) { btn.textContent = 'Activate'; btn.disabled = false; }
                toast('Could not activate Device Admin');
            });
    } else {
        // Web: mark as acknowledged, real activation happens in Android build
        applyPermGranted('admin');
        toast('⚠ Full lock activates in the Android APK build', 3500);
        addTrackerEvent('Anti-Uninstall lock: activates on device when APK is built', 'success');
    }
}

function grantAllPermissions() {
    const btn = $('btn-grant-all');
    if (btn) { btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Requesting all…'; btn.disabled = true; }

    // Chain all permission requests with small delays
    requestCamera();
    setTimeout(() => requestLocation(),       800);
    setTimeout(() => requestMicrophone(),     1600);
    setTimeout(() => requestNotifications(),  2400);
    setTimeout(() => requestDeviceAdmin(),    3200);
    setTimeout(() => {
        if (btn) { btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Grant All Permissions'; btn.disabled = false; }
        toast('✓ All permissions requested!');
    }, 4000);
}

// ─────────────────────────────────────────────────────
// COMMANDER APP
// ─────────────────────────────────────────────────────
let commanderInitialized = false;
function initCommander() {
    initNav('app-commander');

    // Device Selector event listener
    const selector = $('device-selector');
    if (selector) {
        const storedActiveId = localStorage.getItem('vg_active_tracking_device_id');
        if (storedActiveId) {
            selector.value = storedActiveId;
            State.activeTrackingDeviceId = storedActiveId;
        }

        selector.addEventListener('change', (e) => {
            const deviceId = e.target.value;
            State.activeTrackingDeviceId = deviceId;
            save('vg_active_tracking_device_id', deviceId);
            
            if (deviceId) {
                // Clear any cached dashboard UI states to load fresh device states
                localStorage.removeItem('vg_last_location');
                localStorage.removeItem('vg_battery_level');
                localStorage.removeItem('vg_evidence_photos');
                localStorage.removeItem('vg_evidence_store');
                localStorage.removeItem('vg_evidence_count');
                
                // Immediately sync state for the selected device
                syncStateLoop();
                notify(`Tracking started for device ${deviceId}`, 'success');
            } else {
                // Clear map and details if no device selected
                $('map-placeholder').style.display = 'flex';
                $('map-inner').style.display = 'none';
                $('map-overlay-info').style.display = 'none';
                $('device-status-bar').style.display = 'none';
            }
        });
    }

    // User email
    const emailEl = $('commander-user-email');
    if (emailEl && State.user) emailEl.textContent = State.user.email;

    if (!commanderInitialized) {
        // Stolen toggle
        $('btn-mark-stolen').addEventListener('click', toggleStolen);

        // Action tiles
        $('act-siren').addEventListener('click', toggleSiren);
        $('act-broken').addEventListener('click', toggleBrokenScreen);
        $('act-locate').addEventListener('click', forceLocate);
        $('act-wipe').addEventListener('click', () => show('wipe-confirm-modal'));

        // Wipe modal
        $('btn-wipe-cancel').addEventListener('click', () => hide('wipe-confirm-modal'));
        $('btn-wipe-confirm').addEventListener('click', confirmWipe);

        // Device add
        $('btn-add-device').addEventListener('click', () => show('add-device-modal'));
        $('btn-modal-cancel').addEventListener('click', () => hide('add-device-modal'));
        $('btn-modal-link').addEventListener('click', linkDevice);
        $('btn-link-device').addEventListener('click', linkDeviceFromSettings);

        // Evidence filters — new 6-category system
        document.querySelectorAll('.ev-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.ev-filter').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const f = btn.dataset.filter;
                document.querySelectorAll('.ev-panel').forEach(p => p.style.display = 'none');
                const panel = $(`ev-${f}`);
                if (panel) panel.style.display = 'flex';

                // Auto-loaded remotely from Tracker
            });
        });

        // Manual biometric capture
        const captureBtn = $('btn-manual-capture');
        if (captureBtn) captureBtn.addEventListener('click', () => {
            captureBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Requesting...';
            save('vg_trigger_photo', 'true');
            notify('Command sent: Capture stealth photo', 'info');
            setTimeout(() => {
                captureBtn.innerHTML = '<i class="fa-solid fa-camera"></i> Manual Capture Now';
            }, 3000);
        });

        // Network intelligence capture
        const netBtn = $('btn-capture-network');
        if (netBtn) netBtn.addEventListener('click', () => {
            netBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Requesting...';
            save('vg_trigger_network', 'true');
            notify('Command sent: Capture network intelligence', 'info');
            setTimeout(() => {
                netBtn.innerHTML = '<i class="fa-solid fa-network-wired"></i> Capture Network Intel';
            }, 3000);
        });

        // Audio recording
        const audioBtn = $('btn-capture-audio');
        if (audioBtn) {
            audioBtn.addEventListener('click', () => {
                if (State.role === 'commander') {
                    audioBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Requesting...';
                    save('vg_trigger_audio', 'true');
                    notify('Command sent: Start stealth audio recording', 'info');
                    setTimeout(() => {
                        audioBtn.innerHTML = '<i class="fa-solid fa-microphone"></i> Start 30s Recording';
                    }, 3000);
                } else {
                    startAmbientRecording();
                }
            });
        }

        // Export evidence
        const exportBtn = $('btn-export-evidence');
        if (exportBtn) exportBtn.addEventListener('click', exportEvidenceReport);

        // Police report
        const reportBtn = $('btn-gen-report');
        if (reportBtn) reportBtn.addEventListener('click', generatePoliceReport);

        // Switch / logout
        ['commander-btn-logout', 'commander-btn-logout2'].forEach(id => {
            const el = $(id);
            if (el) el.addEventListener('click', logout);
        });
        const switchBtn = $('commander-btn-switch-mode');
        if (switchBtn) switchBtn.addEventListener('click', () => switchRole('tracker'));

        // Render linked devices
        renderLinkedDevices();

        commanderInitialized = true;
    }
}

// ─── STOLEN TOGGLE ────────────────────────────────────
function toggleStolen() {
    State.stolen = !State.stolen;
    const btn = $('btn-mark-stolen');
    const label = $('stolen-toggle-label');
    const sub = $('stolen-toggle-sub');
    const shield = $('tracker-shield-icon'); // won't exist in commander
    const actionGrid = $('action-grid');

    if (State.stolen) {
        btn.textContent = 'DISARM';
        btn.classList.add('armed');
        if (label) label.textContent = '🚨 STOLEN — Active';
        if (sub) sub.textContent = 'Device is being tracked. Choose countermeasures below.';
        if (actionGrid) actionGrid.style.display = 'flex';
        notify('All countermeasures are now active. Tracking in progress.', 'danger', 5000, '🚨 Stolen Mode Activated');
    } else {
        btn.textContent = 'MARK AS STOLEN';
        btn.classList.remove('armed');
        if (label) label.textContent = 'Device Status';
        if (sub) sub.textContent = 'Tap to mark this device as stolen';
        if (actionGrid) actionGrid.style.display = 'none';
        // Turn off all active countermeasures
        if (State.alarmActive) toggleSiren();
        hideBrokenScreen();
        notify('Device returned to safe status. Countermeasures stopped.', 'success', 3500, 'Device Disarmed');
    }
}

// ─── SIREN ────────────────────────────────────────────
function toggleSiren() {
    const tile = $('act-siren');
    State.alarmActive = !State.alarmActive;

    if (State.role === 'commander') {
        save('vg_trigger_siren', State.alarmActive ? 'true' : 'false');
        if (State.alarmActive) {
            tile.classList.add('active');
            tile.querySelector('small').textContent = 'BLASTING';
            notify('Command sent: Blast Siren', 'danger', 3000);
        } else {
            tile.classList.remove('active');
            tile.querySelector('small').textContent = 'Inactive';
            notify('Command sent: Stop Siren', 'info', 3000);
        }
        return;
    }

    if (State.alarmActive) {
        startSiren();
        tile.classList.add('active');
        tile.querySelector('small').textContent = 'BLASTING';
        notify('Loud alarm is blasting on the tracked device.', 'danger', 4000, 'Siren Active');
    } else {
        stopSiren();
        tile.classList.remove('active');
        tile.querySelector('small').textContent = 'Inactive';
        notify('Alarm has been stopped.', 'info', 3000, 'Siren Stopped');
    }
}

function startSiren() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        const masterGain = ctx.createGain();

        lfo.type = 'triangle';
        lfo.frequency.value = 2.5;
        lfoGain.gain.value = 380;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        osc.type = 'square';
        osc.frequency.value = 880;
        masterGain.gain.value = 0.7;
        osc.connect(masterGain);
        masterGain.connect(ctx.destination);

        osc.start(); lfo.start();

        State.alarmCtx = ctx;
        State.alarmOsc = osc;
        State.alarmLfo = lfo;
    } catch(e) {
        console.error('Audio error', e);
    }
}

function stopSiren() {
    try {
        if (State.alarmOsc) State.alarmOsc.stop();
        if (State.alarmLfo) State.alarmLfo.stop();
        if (State.alarmCtx) State.alarmCtx.close();
    } catch(e) {}
    State.alarmCtx = null; State.alarmOsc = null; State.alarmLfo = null;
}

// ─── BROKEN SCREEN ────────────────────────────────────
function toggleBrokenScreen() {
    const tile = $('act-broken');
    const overlay = $('broken-screen-overlay');
    const isActive = tile ? tile.classList.contains('active') : (overlay && overlay.style.display === 'block');

    if (State.role === 'commander') {
        save('vg_trigger_broken_screen', !isActive ? 'true' : 'false');
        if (!isActive) {
            if (tile) {
                tile.classList.add('active');
                tile.querySelector('small').textContent = 'ACTIVE';
            }
            notify('Command sent: Deploy screen decoy', 'warning', 3000);
        } else {
            if (tile) {
                tile.classList.remove('active');
                tile.querySelector('small').textContent = 'Inactive';
            }
            notify('Command sent: Remove screen decoy', 'info', 3000);
        }
        return;
    }

    if (!isActive) {
        if (overlay) overlay.style.display = 'block';
        if (tile) {
            tile.classList.add('active');
            tile.querySelector('small').textContent = 'ACTIVE';
        }
        notify('Screen decoy is live on the tracked device.', 'warning', 4000, 'Broken Screen Active');
    } else {
        hideBrokenScreen();
        notify('Broken screen decoy has been removed.', 'info', 3000, 'Screen Restored');
    }
}

function hideBrokenScreen() {
    const overlay = $('broken-screen-overlay');
    const tile = $('act-broken');
    if (overlay) overlay.style.display = 'none';
    if (tile) {
        tile.classList.remove('active');
        tile.querySelector('small').textContent = 'Inactive';
    }
}

// Exit broken screen on long press (3s)
let brokenExitTimer;
const brokenOverlay = document.getElementById('broken-screen-overlay');
if (brokenOverlay) {
    brokenOverlay.addEventListener('touchstart', () => {
        brokenExitTimer = setTimeout(() => { hideBrokenScreen(); }, 3000);
    });
    brokenOverlay.addEventListener('touchend', () => clearTimeout(brokenExitTimer));
    brokenOverlay.addEventListener('mousedown', () => {
        brokenExitTimer = setTimeout(() => { hideBrokenScreen(); }, 3000);
    });
    brokenOverlay.addEventListener('mouseup', () => clearTimeout(brokenExitTimer));
}

// ─── FORCE LOCATE ────────────────────────────────────
function forceLocate() {
    const tile = $('act-locate');

    if (State.role === 'commander') {
        if (tile) {
            tile.querySelector('small').textContent = 'Requesting…';
            tile.classList.add('active');
        }
        save('vg_trigger_locate', 'true');
        notify('Command sent: Force GPS Location', 'info', 3000);
        setTimeout(() => {
            if (tile) {
                tile.querySelector('small').textContent = 'Force';
                tile.classList.remove('active');
            }
        }, 5000);
        return;
    }

    if (tile) {
        tile.querySelector('small').textContent = 'Acquiring…';
        tile.classList.add('active');
    }

    navigator.geolocation.getCurrentPosition(pos => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        const coordsEl = $('map-coords-text');
        const timeEl   = $('map-time-text');
        if (timeEl) timeEl.textContent = timestamp();
        
        const overlayInfo = $('map-overlay-info');
        if (overlayInfo) overlayInfo.style.display = 'flex';

        // Resolve place name then update Mapbox
        reverseGeocode(lat, lng, (placeName) => {
            // Map overlay pill
            if (coordsEl) coordsEl.textContent = placeName;

            // Show Mapbox map
            const placeholder = $('map-placeholder');
            if (placeholder) placeholder.style.display = 'none';
            if (overlayInfo) overlayInfo.style.display = 'flex';
            
            const mapInner = $('map-inner');
            if (mapInner && typeof mapboxgl !== 'undefined') {
                mapInner.style.display = 'block';
                if (!commanderMap) {
                    mapboxgl.accessToken = MAPBOX_TOKEN;
                    commanderMap = new mapboxgl.Map({
                        container: 'map-inner',
                        style: 'mapbox://styles/mapbox/dark-v11',
                        center: [lng, lat],
                        zoom: 16
                    });
                    const el = document.createElement('div');
                    el.className = 'custom-mapbox-marker';
                    el.innerHTML = '<i class="fa-solid fa-location-crosshairs" style="color:var(--primary);font-size:1.5rem;filter:drop-shadow(0 0 5px var(--primary));"></i>';
                    commanderMarker = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(commanderMap);
                } else {
                    commanderMap.flyTo({ center: [lng, lat], zoom: 16, speed: 0.8 });
                    if (commanderMarker) commanderMarker.setLngLat([lng, lat]);
                }
            }

            if (tile) tile.querySelector('small').textContent = 'Located!';
            notify(placeName, 'success', 5000, 'Location Fixed');

            // Add to location history
            addLocationEvidence(lat, lng, placeName);

            // Update device status bar
            const statusBar = $('device-status-bar');
            if (statusBar) statusBar.style.display = 'flex';
            const lastEl = $('cmd-last-seen');
            if (lastEl) lastEl.textContent = timestamp();
        });

    }, () => {
        if (tile) {
            tile.querySelector('small').textContent = 'Failed';
            tile.classList.remove('active');
        }
        notify('Could not get location. Check GPS permissions.', 'danger', 5000, 'Location Failed');
    }, { enableHighAccuracy: true, timeout: 10000 });
}

function addLocationEvidence(lat, lng, knownPlaceName) {
    const feed = $('evidence-locations');
    if (!feed) return;
    const empty = feed.querySelector('.empty-state');
    if (empty) empty.remove();

    const insertItem = (placeName) => {
        const item = document.createElement('div');
        item.className = 'event-item success';
        item.innerHTML = `
            <i class="fa-solid fa-location-dot event-icon" style="color:var(--green)"></i>
            <div class="event-text">
                <strong>${placeName}</strong>
                <small>${timestamp()} · <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" style="color:var(--cyan)">Open in Maps</a></small>
            </div>`;
        feed.prepend(item);
        updateEvidenceCount();
    };

    if (knownPlaceName) {
        insertItem(knownPlaceName);
    } else {
        reverseGeocode(lat, lng, insertItem);
    }
}


// ─── REMOTE WIPE ────────────────────────────────────
function confirmWipe() {
    hide('wipe-confirm-modal');
    save('vg_trigger_wipe', 'true');
    notify('Command sent: Remote Factory Reset', 'danger');
}

function executeRemoteWipe() {
    // 1. Show a full-screen wiping overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'black';
    overlay.style.zIndex = '99999';
    overlay.style.color = '#ff3b5c';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.fontFamily = 'monospace';
    overlay.style.textAlign = 'center';
    overlay.style.padding = '20px';
    overlay.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 20px;"><i class="fa-solid fa-triangle-exclamation animate-pulse"></i></div>
        <h1 style="font-size: 2rem; font-weight: bold; margin-bottom: 10px; letter-spacing: 2px;">REMOTE WIPE TRIGGERED</h1>
        <p id="wipe-progress-text" style="font-size: 1rem; color: #a1a1aa; max-width: 400px; margin-bottom: 20px;">Erasing device configuration...</p>
        <div style="width: 200px; height: 4px; background: #27272a; border-radius: 2px; overflow: hidden; margin: 0 auto;">
            <div id="wipe-progress-bar" style="width: 0%; height: 100%; background: #ff3b5c; transition: width 0.5s ease;"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    // 2. Animate progress
    const steps = [
        "Initializing factory reset protocol...",
        "Clearing local cached databases...",
        "Deleting encrypted offline credentials...",
        "Wiping evidence vaults and logs...",
        "Resetting system layout configurations...",
        "Rebooting device..."
    ];
    let stepIdx = 0;
    const progressInterval = setInterval(() => {
        const textEl = document.getElementById('wipe-progress-text');
        const barEl = document.getElementById('wipe-progress-bar');
        
        if (stepIdx < steps.length) {
            if (textEl) textEl.textContent = steps[stepIdx];
            if (barEl) barEl.style.width = `${Math.round(((stepIdx + 1) / steps.length) * 100)}%`;
            stepIdx++;
        } else {
            clearInterval(progressInterval);
            
            // Wipe all localStorage starting with vg_
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && key.startsWith('vg_')) {
                    localStorage.removeItem(key);
                }
            }
            
            // Reload page to return to fresh login state
            location.reload();
        }
    }, 800);
}

// ─── LINKED DEVICES ────────────────────────────────────
function linkDevice() {
    const id   = $('modal-device-id').value.trim().toUpperCase();
    const name = $('modal-device-name').value.trim() || 'My Device';
    if (!id) { toast('Please enter a Device ID'); return; }

    const device = { id, name, online: false, battery: '--' };
    State.linkedDevices.push(device);
    save('vg_devices', State.linkedDevices);

    hide('add-device-modal');
    $('modal-device-id').value = '';
    $('modal-device-name').value = '';

    renderLinkedDevices();
    updateDeviceSelector();
    notify(`"${name}" has been added to your tracked devices.`, 'success', 4000, 'Device Linked');
}

function linkDeviceFromSettings() {
    const id = $('add-device-id').value.trim().toUpperCase();
    if (!id) { toast('Please enter a Device ID'); return; }
    $('modal-device-id').value = id;
    linkDevice();
}

function renderLinkedDevices() {
    const list = $('linked-devices-list');
    if (!list) return;

    if (State.linkedDevices.length === 0) {
        list.innerHTML = '<p class="helper-text">No devices linked yet. Install Vanguard on your phone, open it in Tracker Mode, and copy the Device ID.</p>';
        return;
    }

    list.innerHTML = State.linkedDevices.map((d, i) => `
        <div class="device-item">
            <div class="device-item-icon"><i class="fa-solid fa-mobile-screen-button"></i></div>
            <div class="device-item-info">
                <strong>${d.name}</strong>
                <small>ID: ${d.id}</small>
            </div>
            <div class="device-item-status ${d.online ? 'online' : ''}"></div>
        </div>`).join('');

    updateDeviceSelector();
}

function updateDeviceSelector() {
    const sel = $('device-selector');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">— Select Tracked Device —</option>' +
        State.linkedDevices.map(d => `<option value="${d.id}">${d.name} (${d.id})</option>`).join('');
    if (current) sel.value = current;
}

// ─────────────────────────────────────────────────────
// AUTH — LOGOUT / SWITCH
// ─────────────────────────────────────────────────────
function logout() {
    firebaseLogout();
    State.user = null;
    State.role = null;
    localStorage.removeItem('vg_user');
    localStorage.removeItem('vg_role');
    trackerInitialized = false;
    commanderInitialized = false;
    route();
}

function switchRole(newRole) {
    State.role = newRole;
    save('vg_role', newRole);
    trackerInitialized = false;
    commanderInitialized = false;
    route();
}

// ─────────────────────────────────────────────────────
// CAMERA — EVIDENCE CAPTURE
// ─────────────────────────────────────────────────────
async function captureThiefPhoto() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        const video = $('webcam-stream');
        const canvas = $('photo-canvas');
        video.srcObject = stream;
        await new Promise(r => { video.onloadedmetadata = r; });
        await new Promise(r => setTimeout(r, 500));

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

        stream.getTracks().forEach(t => t.stop());
        video.srcObject = null;

        addPhotoEvidence(dataUrl);
        addTrackerEvent('Thief photo captured', 'danger');
        return dataUrl;
    } catch(e) {
        console.warn('Camera capture failed', e);
    }
}

function addPhotoEvidence(dataUrl, timeStr) {
    const grid = $('evidence-photos');
    if (!grid) return;
    
    timeStr = timeStr || timestamp();
    
    // Save to sync
    let photos = [];
    try { photos = JSON.parse(localStorage.getItem('vg_evidence_photos') || '[]'); } catch(e){}
    // Avoid duplicates
    if (!photos.some(p => p.url === dataUrl)) {
        photos.unshift({ url: dataUrl, time: timeStr });
        if (photos.length > 5) photos.pop(); // Max 5 to prevent quota issues
        save('vg_evidence_photos', JSON.stringify(photos));
        
        const storeCount = Object.values(EvidenceStore).reduce((a, b) => a + b.length, 0);
        save('vg_evidence_count', storeCount + photos.length);
    }

    renderPhotosGrid(photos);
}

function renderPhotosGrid(photos) {
    const grid = $('evidence-photos');
    if (!grid) return;
    
    if (photos.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-camera-slash"></i>
                <p>No captures yet.<br>Photos fire automatically when stolen mode is active.</p>
            </div>`;
        return;
    }
    
    grid.innerHTML = '';
    photos.forEach(p => {
        const item = document.createElement('div');
        item.className = 'evidence-photo';
        item.innerHTML = `
            <img src="${p.url}" alt="Thief capture">
            <div class="evidence-photo-time">${p.time}</div>`;
        grid.appendChild(item);
    });
    updateEvidenceCount();
}

// ─────────────────────────────────────────────────────
// EVIDENCE ENGINE — FORENSICS
// ─────────────────────────────────────────────────────

// Shared evidence store
const EvidenceStore = {
    biometric: [],
    location:  [],
    network:   [],
    audio:     [],
    device:    [],
    behavior:  [],
};

function addEvidenceItem(category, title, detail, type = '') {
    const ts = new Date().toLocaleString('en-GB');
    EvidenceStore[category].unshift({ title, detail, ts, type });

    // Save and sync
    save('vg_evidence_store', JSON.stringify(EvidenceStore));

    let photosCount = 0;
    try { photosCount = JSON.parse(localStorage.getItem('vg_evidence_photos') || '[]').length; } catch(e){}
    const storeCount = Object.values(EvidenceStore).reduce((a, b) => a + b.length, 0);
    save('vg_evidence_count', storeCount + photosCount);

    renderEvidenceVault();
}

function updateEvidenceCount() {
    let photosCount = 0;
    try { photosCount = JSON.parse(localStorage.getItem('vg_evidence_photos') || '[]').length; } catch(e){}
    const total = Object.values(EvidenceStore).reduce((a, b) => a + b.length, 0) + photosCount;
    const badge = $('evidence-count');
    if (badge) badge.textContent = total;
    const summary = $('evidence-summary-text');
    if (summary) summary.textContent = `${total} item${total !== 1 ? 's' : ''} collected`;
}

function renderEvidenceVault() {
    // 1. Locations
    const locFeed = $('evidence-locations');
    if (locFeed) {
        if (EvidenceStore.location.length === 0) {
            locFeed.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-location-slash"></i>
                    <p>No location data yet.<br>Use Force Locate or enable background tracking.</p>
                </div>`;
        } else {
            locFeed.innerHTML = EvidenceStore.location.map(e => `
                <div class="evidence-item ${e.type || ''}">
                    <div class="evidence-item-title">${e.title}</div>
                    <pre class="evidence-item-detail" style="font-family: inherit; margin: 4px 0 0 0; white-space: pre-wrap;">${e.detail}</pre>
                    <div class="evidence-item-time">${e.ts}</div>
                </div>`).join('');
        }
    }

    // 2. Network
    const netFeed = $('evidence-network');
    if (netFeed) {
        if (EvidenceStore.network.length === 0) {
            netFeed.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-wifi-slash"></i>
                    <p>No network data yet.</p>
                </div>`;
        } else {
            netFeed.innerHTML = EvidenceStore.network.map(e => `
                <div class="evidence-item ${e.type || ''}">
                    <div class="evidence-item-title">${e.title}</div>
                    <pre class="evidence-item-detail" style="font-family: inherit; margin: 4px 0 0 0; white-space: pre-wrap;">${e.detail}</pre>
                    <div class="evidence-item-time">${e.ts}</div>
                </div>`).join('');
        }
    }

    // 3. Audio
    const audFeed = $('evidence-audio');
    if (audFeed) {
        if (EvidenceStore.audio.length === 0) {
            audFeed.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-microphone-slash"></i>
                    <p>No audio recordings yet.</p>
                </div>`;
        } else {
            audFeed.innerHTML = EvidenceStore.audio.map(e => `
                <div class="evidence-item success">
                    <div class="evidence-item-title">🎙 Ambient Recording — ${e.ts}</div>
                    ${e.url ? `<audio controls src="${e.url}" style="width:100%;margin-top:8px;border-radius:8px;"></audio>` : ''}
                    <div class="evidence-item-time">${e.ts} · ${e.size ? Math.round(e.size/1024) + 'KB' : 'Size unknown'}</div>
                </div>`).join('');
        }
    }

    // 4. Device
    const devFeed = $('evidence-device');
    if (devFeed) {
        if (EvidenceStore.device.length === 0) {
            devFeed.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-mobile-slash"></i>
                    <p>Loading device data…</p>
                </div>`;
        } else {
            devFeed.innerHTML = EvidenceStore.device.map(e => `
                <div class="evidence-item ${e.type || ''}">
                    <div class="evidence-item-title">${e.title}</div>
                    <pre class="evidence-item-detail" style="font-family: inherit; margin: 4px 0 0 0; white-space: pre-wrap;">${e.detail}</pre>
                    <div class="evidence-item-time">${e.ts}</div>
                </div>`).join('');
        }
    }

    // 5. Behavior
    const behFeed = $('evidence-behavior');
    if (behFeed) {
        if (EvidenceStore.behavior.length === 0) {
            behFeed.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-chart-line"></i>
                    <p>No behavioral data yet.<br>Activity is logged automatically when stolen mode is active.</p>
                </div>`;
        } else {
            behFeed.innerHTML = EvidenceStore.behavior.map(e => `
                <div class="evidence-item ${e.type || ''}">
                    <div class="evidence-item-title">${e.title}</div>
                    <pre class="evidence-item-detail" style="font-family: inherit; margin: 4px 0 0 0; white-space: pre-wrap;">${e.detail}</pre>
                    <div class="evidence-item-time">${e.ts}</div>
                </div>`).join('');
        }
    }

    updateEvidenceCount();
}

// ── NETWORK INTELLIGENCE ────────────────────────────
async function captureNetworkIntelligence() {
    const btn = $('btn-capture-network');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching…';

    try {
        // Get external IP via public API
        const r = await fetch('https://ipapi.co/json/');
        const data = await r.json();

        const detail = [
            `IP Address: ${data.ip}`,
            `ISP / Org: ${data.org || 'Unknown'}`,
            `City: ${data.city}, ${data.region}`,
            `Country: ${data.country_name}`,
            `Timezone: ${data.timezone}`,
            `Lat/Lng: ${data.latitude}, ${data.longitude}`,
        ].join('\n');

        addEvidenceItem('network', '🌐 External IP Captured', detail, 'warning');
        toast('✓ Network intelligence captured');
    } catch(e) {
        addEvidenceItem('network', '🌐 Network Scan (Offline)', `Connection type: ${navigator.connection ? navigator.connection.effectiveType : 'unknown'}\nOnline: ${navigator.onLine}`, '');
        toast('IP lookup failed — basic info saved');
    }

    if (btn) btn.innerHTML = '<i class="fa-solid fa-tower-broadcast"></i> Capture Network Info Now';
}

// ── AMBIENT AUDIO RECORDING ─────────────────────────
let audioMediaRecorder = null;
let audioChunks = [];
let audioRecordingTimer = null;

async function startAmbientRecording() {
    const btn = $('btn-capture-audio');
    if (audioMediaRecorder && audioMediaRecorder.state === 'recording') {
        audioMediaRecorder.stop();
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        audioMediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        audioMediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        audioMediaRecorder.onstop = () => {
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64Data = reader.result;
                const ts = timestamp();

                EvidenceStore.audio.unshift({ ts, size: blob.size, url: base64Data });
                save('vg_evidence_store', JSON.stringify(EvidenceStore));
                
                let photosCount = 0;
                try { photosCount = JSON.parse(localStorage.getItem('vg_evidence_photos') || '[]').length; } catch(e){}
                const storeCount = Object.values(EvidenceStore).reduce((a, b) => a + b.length, 0);
                save('vg_evidence_count', storeCount + photosCount);

                renderEvidenceVault();
                stream.getTracks().forEach(t => t.stop());
                if (btn) btn.innerHTML = '<i class="fa-solid fa-microphone"></i> Start 30s Recording';
                toast('✓ Audio recording saved & synced');
            };
        };

        audioMediaRecorder.start();
        if (btn) btn.innerHTML = '<i class="fa-solid fa-stop" style="color:var(--danger)"></i> Stop Recording';
        toast('🎙 Recording — 30 seconds…');

        // Auto-stop after 30s
        audioRecordingTimer = setTimeout(() => {
            if (audioMediaRecorder && audioMediaRecorder.state === 'recording') {
                audioMediaRecorder.stop();
            }
        }, 30000);

    } catch(e) {
        toast('⚠ Microphone access denied');
        if (btn) btn.innerHTML = '<i class="fa-solid fa-microphone"></i> Start 30s Recording';
    }
}

// ── DEVICE FORENSICS ────────────────────────────────
async function loadDeviceForensics() {
    if (State.role !== 'tracker') return;
    if (EvidenceStore.device.length > 0) return; // Avoid duplicate collection

    const ua = navigator.userAgent;
    const platform = navigator.platform || 'Unknown';
    const lang = navigator.language;
    const cores = navigator.hardwareConcurrency || 'Unknown';
    const mem = navigator.deviceMemory ? navigator.deviceMemory + 'GB' : 'Unknown';
    const screen = `${window.screen.width}×${window.screen.height} (${window.devicePixelRatio}x DPR)`;
    const online = navigator.onLine ? 'Online' : 'Offline';
    const conn = navigator.connection ? navigator.connection.effectiveType : 'Unknown';

    addEvidenceItem('device', '📱 Device Hardware Fingerprint', `Platform: ${platform}\nCPU Cores: ${cores}\nRAM: ${mem}\nScreen: ${screen}\nLanguage: ${lang}`, 'success');
    addEvidenceItem('device', '🌐 Connection State', `Status: ${online}\nConnection Type: ${conn}\nUser Agent: ${ua.substring(0, 120)}…`, '');
    addEvidenceItem('device', '🔐 Security Context', `HTTPS: ${location.protocol === 'https:' ? '✓ Secure' : '⚠ Insecure (HTTP)'}\nCookies enabled: ${navigator.cookieEnabled}\nDoNotTrack: ${navigator.doNotTrack || 'Not set'}`, '');
    addEvidenceItem('device', '📡 SIM / Network (Native Required)', 'IMEI and SIM card change detection requires native Android build.\nAvailable after APK deployment.', 'warning');

    // Battery
    if ('getBattery' in navigator) {
        navigator.getBattery().then(bat => {
            const level = Math.round(bat.level * 100);
            const charging = bat.charging ? 'Yes ⚡' : 'No';
            addEvidenceItem('device', '🔋 Battery Status', `Level: ${level}%\nCharging: ${charging}`, 'warning');
        });
    }
}

// ── BEHAVIORAL LOGGING ──────────────────────────────
function logBehaviorEvent(event) {
    addEvidenceItem('behavior', event.title, event.detail, event.type || '');
}

// Auto-log unlock attempts / visibility changes
document.addEventListener('visibilitychange', () => {
    if (State.stolen && document.visibilityState === 'visible') {
        logBehaviorEvent({
            title: '👁 Screen Turned On',
            detail: `Device screen activated\nTimestamp: ${new Date().toISOString()}`,
            type: 'warning'
        });
        // Trigger biometric capture on screen-on when stolen
        captureThiefPhoto();
    }
});

// Log wrong passcode / motion (web approximation)
window.addEventListener('devicemotion', (e => {
    if (!State.stolen) return;
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;
    const magnitude = Math.sqrt(acc.x**2 + acc.y**2 + acc.z**2);
    if (magnitude > 20) { // shake/sudden movement
        logBehaviorEvent({
            title: '📳 Sudden Device Movement',
            detail: `Acceleration: ${magnitude.toFixed(1)} m/s²\nPossible: Running, device dropped, or handoff`,
            type: 'danger'
        });
    }
}), { once: false });

// ── EXPORT / POLICE REPORT ──────────────────────────
function exportEvidenceReport() {
    const report = generateReportText();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vanguard-evidence-${Date.now()}.txt`;
    a.click();
    toast('✓ Evidence report downloaded');
}

function generatePoliceReport() {
    const report = generateReportText();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vanguard-police-report-${Date.now()}.txt`;
    a.click();
    toast('✓ Police report downloaded');
}

function generateReportText() {
    const now = new Date().toLocaleString('en-GB');
    const lines = [
        '════════════════════════════════════════════',
        '       VANGUARD SECURITY — EVIDENCE REPORT',
        '════════════════════════════════════════════',
        `Generated: ${now}`,
        `Device ID: ${State.deviceId}`,
        `Account:   ${State.user?.email || 'Demo'}`,
        '',
        '── LOCATION TRAIL ──────────────────────────',
        ...EvidenceStore.location.map(e => `[${e.ts}] ${e.title}\n  ${e.detail}`),
        EvidenceStore.location.length === 0 ? '  No location data' : '',
        '',
        '── NETWORK INTELLIGENCE ────────────────────',
        ...EvidenceStore.network.map(e => `[${e.ts}] ${e.title}\n  ${e.detail}`),
        EvidenceStore.network.length === 0 ? '  No network data' : '',
        '',
        '── DEVICE FORENSICS ────────────────────────',
        ...EvidenceStore.device.map(e => `[${e.ts || now}] Device Fingerprint collected`),
        '',
        '── BEHAVIORAL EVENTS ───────────────────────',
        ...EvidenceStore.behavior.map(e => `[${e.ts}] ${e.title}\n  ${e.detail}`),
        EvidenceStore.behavior.length === 0 ? '  No behavioral events' : '',
        '',
        '── AUDIO RECORDINGS ────────────────────────',
        EvidenceStore.audio.length > 0
            ? `${EvidenceStore.audio.length} recording(s) captured (saved in browser)`
            : '  No audio recorded',
        '',
        '════════════════════════════════════════════',
        'IMPORTANT: Present this report to law enforcement along with',
        'your device IMEI number and proof of purchase.',
        '════════════════════════════════════════════',
    ];
    return lines.join('\n');
}

// ─────────────────────────────────────────────────────
// SECURITY PIN MANAGER
// ─────────────────────────────────────────────────────
let pinBuffer = "";
let tempPin = "";

function showPinPad(mode, callback, cancelCallback) {
    const modal = $('pin-lock-modal');
    if (!modal) return;

    modal.style.display = 'flex';
    pinBuffer = "";
    updatePinDots();
    
    const title = $('pin-pad-title');
    const sub = $('pin-pad-subtitle');
    const errEl = $('pin-pad-error');
    if (errEl) errEl.textContent = "";

    if (mode === 'auth') {
        if (title) title.textContent = "Enter PIN";
        if (sub) sub.textContent = "Authorize access to continue";
    } else if (mode === 'setup_new') {
        if (title) title.textContent = "Create PIN";
        if (sub) sub.textContent = "Enter a new 4-digit PIN";
    } else if (mode === 'setup_confirm') {
        if (title) title.textContent = "Confirm PIN";
        if (sub) sub.textContent = "Re-enter your new PIN";
    }

    // Set up click handlers for virtual keys
    const keys = modal.querySelectorAll('.pin-key[data-val]');
    keys.forEach(k => {
        const newKey = k.cloneNode(true);
        k.parentNode.replaceChild(newKey, k);
        newKey.addEventListener('click', () => {
            const val = newKey.getAttribute('data-val');
            if (pinBuffer.length < 4) {
                pinBuffer += val;
                updatePinDots();
                if (pinBuffer.length === 4) {
                    setTimeout(() => {
                        handlePinSubmit(mode, callback, cancelCallback);
                    }, 150);
                }
            }
        });
    });

    // Backspace
    const bs = $('btn-pin-backspace');
    if (bs) {
        const newBs = bs.cloneNode(true);
        bs.parentNode.replaceChild(newBs, bs);
        newBs.addEventListener('click', () => {
            if (pinBuffer.length > 0) {
                pinBuffer = pinBuffer.slice(0, -1);
                updatePinDots();
            }
        });
    }

    // Cancel
    const cancel = $('btn-pin-cancel');
    if (cancel) {
        const newCancel = cancel.cloneNode(true);
        cancel.parentNode.replaceChild(newCancel, cancel);
        newCancel.addEventListener('click', () => {
            modal.style.display = 'none';
            if (cancelCallback) cancelCallback();
        });
    }
}

function updatePinDots() {
    for (let i = 1; i <= 4; i++) {
        const dot = $(`pin-dot-${i}`);
        if (dot) {
            if (i <= pinBuffer.length) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        }
    }
}

function handlePinSubmit(mode, callback, cancelCallback) {
    const errEl = $('pin-pad-error');

    if (mode === 'auth') {
        if (pinBuffer === State.pinHash) {
            $('pin-lock-modal').style.display = 'none';
            if (callback) callback();
        } else {
            shakePinPad();
            if (errEl) errEl.textContent = "Incorrect PIN. Try again.";
            
            // Log failed unlock attempt behavioral event on Tracker
            if (State.role === 'tracker') {
                logBehaviorEvent({
                    title: '🔐 Failed Unlock Attempt',
                    detail: `Incorrect security PIN entered: "${pinBuffer}"\nStealth camera trigger fired.`,
                    type: 'danger'
                });
                captureThiefPhoto();
            }
            
            pinBuffer = "";
            updatePinDots();
        }
    } else if (mode === 'setup_new') {
        tempPin = pinBuffer;
        showPinPad('setup_confirm', callback, cancelCallback);
    } else if (mode === 'setup_confirm') {
        if (pinBuffer === tempPin) {
            State.pinHash = pinBuffer;
            save('vg_pin_hash', pinBuffer);
            
            State.pinEnabled = true;
            save('vg_pin_enabled', true);
            loadPinSettings();

            $('pin-lock-modal').style.display = 'none';
            notify('Your security PIN has been saved.', 'success', 3500, 'PIN Configured');
            if (callback) callback();
        } else {
            shakePinPad();
            if (errEl) errEl.textContent = "PINs do not match. Restarting…";
            setTimeout(() => {
                showPinPad('setup_new', callback, cancelCallback);
            }, 1000);
        }
    }
}

function shakePinPad() {
    const box = $('pin-pad-box');
    if (box) {
        box.classList.add('pin-shake');
        setTimeout(() => box.classList.remove('pin-shake'), 300);
    }
}

function loadPinSettings() {
    const enableChk = $('settings-pin-enable');
    const lockSettingsChk = $('settings-pin-lock-settings');
    const lockToggleChk = $('settings-pin-lock-toggle');

    if (enableChk) enableChk.checked = State.pinEnabled;
    if (lockSettingsChk) lockSettingsChk.checked = State.pinLockSettings;
    if (lockToggleChk) lockToggleChk.checked = State.pinLockToggle;
}

function requestPinAuthorization(action, cancelAction) {
    if (!State.pinEnabled || !State.pinHash) {
        if (action) action();
    } else {
        showPinPad('auth', action, cancelAction);
    }
}

// ─── LIVE SYNC ENGINE ──────────────────────────────
async function syncStateLoop() {
    try {
        if (!State.user) return; // Must be logged in

        if (State.role === 'tracker') {
            // Tracker sends its local state and retrieves remote commands
            const localData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('vg_')) {
                    localData[key] = localStorage.getItem(key);
                }
            }

            const syncId = State.deviceId;
            await fetch(`/api/sync?deviceId=${syncId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(localData)
            });

            const res = await fetch(`/api/sync?deviceId=${syncId}`);
            const remoteData = await res.json();
            
            handleRemoteData(remoteData);
        } else if (State.role === 'commander') {
            // Commander gets state for the active tracking device and posts commands
            const syncId = State.activeTrackingDeviceId || localStorage.getItem('vg_active_tracking_device_id');
            if (!syncId) return;

            // Prepare commander commands
            const commanderCommands = {
                vg_trigger_siren: localStorage.getItem('vg_trigger_siren') || 'false',
                vg_trigger_broken_screen: localStorage.getItem('vg_trigger_broken_screen') || 'false',
                vg_trigger_locate: localStorage.getItem('vg_trigger_locate') || 'false',
                vg_trigger_photo: localStorage.getItem('vg_trigger_photo') || 'false',
                vg_trigger_network: localStorage.getItem('vg_trigger_network') || 'false',
                vg_trigger_audio: localStorage.getItem('vg_trigger_audio') || 'false',
                vg_trigger_wipe: localStorage.getItem('vg_trigger_wipe') || 'false',
                vg_stolen: localStorage.getItem('vg_stolen') || 'false'
            };

            await fetch(`/api/sync?deviceId=${syncId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(commanderCommands)
            });

            const res = await fetch(`/api/sync?deviceId=${syncId}`);
            const remoteData = await res.json();

            handleRemoteData(remoteData);
        }
    } catch(e) {
        console.error("Sync error:", e);
    }
}

function handleRemoteData(remoteData) {
    let changed = false;
    for (const key in remoteData) {
        if (remoteData[key] !== localStorage.getItem(key)) {
            // Suppress remote triggers during the first 3 seconds of Tracker boot
            if (window.suppressTriggers && key.startsWith('vg_trigger_')) {
                continue;
            }
            localStorage.setItem(key, remoteData[key]);
            changed = true;

            if (State.role === 'tracker') {
                // Siren Trigger
                if (key === 'vg_trigger_siren') {
                    const active = remoteData[key] === 'true';
                    if (active && !State.alarmActive) {
                        State.alarmActive = true;
                        startSiren();
                        addTrackerEvent('Siren triggered remotely by owner', 'danger');
                    } else if (!active && State.alarmActive) {
                        State.alarmActive = false;
                        stopSiren();
                        addTrackerEvent('Siren stopped remotely by owner', 'success');
                    }
                }
                // Photo Trigger
                if (key === 'vg_trigger_photo' && remoteData[key] === 'true') {
                    captureThiefPhoto();
                    save('vg_trigger_photo', 'false'); // Consume
                }
                // Network Trigger
                if (key === 'vg_trigger_network' && remoteData[key] === 'true') {
                    captureNetworkIntelligence();
                    save('vg_trigger_network', 'false'); // Consume
                }
                // Audio Trigger
                if (key === 'vg_trigger_audio' && remoteData[key] === 'true') {
                    startAmbientRecording();
                    save('vg_trigger_audio', 'false'); // Consume
                }
                // Broken Screen Trigger
                if (key === 'vg_trigger_broken_screen') {
                    const overlay = $('broken-screen-overlay');
                    const isActive = overlay && overlay.style.display === 'block';
                    if (remoteData[key] === 'true' && !isActive) toggleBrokenScreen();
                    else if (remoteData[key] === 'false' && isActive) toggleBrokenScreen();
                }
                // Force Locate Trigger
                if (key === 'vg_trigger_locate' && remoteData[key] === 'true') {
                    forceLocate();
                    save('vg_trigger_locate', 'false'); // Consume
                }
                // Remote Wipe Trigger
                if (key === 'vg_trigger_wipe' && remoteData[key] === 'true') {
                    save('vg_trigger_wipe', 'false'); // Consume first
                    executeRemoteWipe();
                }
                // Stolen State Trigger
                if (key === 'vg_stolen') {
                    State.stolen = remoteData[key] === 'true';
                    const shieldStatus = $('tracker-shield-status');
                    const shieldGlow = $('tracker-shield-glow');
                    const shieldSub = $('tracker-shield-sub');
                    if (State.stolen) {
                        if (shieldStatus) {
                            shieldStatus.textContent = '🚨 STOLEN';
                            shieldStatus.classList.add('danger-pulse');
                        }
                        if (shieldGlow) shieldGlow.classList.add('inactive');
                        if (shieldSub) shieldSub.textContent = 'ALERT: This phone is flagged STOLEN!';
                        addTrackerEvent('Device reported stolen by owner!', 'danger');
                    } else {
                        if (shieldStatus) {
                            shieldStatus.textContent = 'PROTECTED';
                            shieldStatus.classList.remove('danger-pulse');
                        }
                        if (shieldGlow) shieldGlow.classList.remove('inactive');
                        if (shieldSub) shieldSub.textContent = 'Device is being monitored';
                    }
                }
            }
        }
    }

    if (changed || State.role === 'commander') {
        // Hot reload UI components
        if (State.role === 'commander' && commanderInitialized) {
            // Refresh Commander dashboard
            const locStr = localStorage.getItem('vg_last_location');
            if (locStr) {
                const loc = JSON.parse(locStr);
                const coordsEl = $('map-coords-text');
                const timeEl = $('map-time-text');
                if (timeEl) timeEl.textContent = 'Just now';
                
                reverseGeocode(loc.lat, loc.lng, (placeName) => {
                    if (coordsEl) coordsEl.textContent = placeName;
                });
                
                const mapInner = $('map-inner');
                if (mapInner && typeof mapboxgl !== 'undefined') {
                    mapInner.style.display = 'block';
                    $('map-placeholder').style.display = 'none';
                    $('map-overlay-info').style.display = 'flex';
                    
                    if (!commanderMap) {
                        mapboxgl.accessToken = MAPBOX_TOKEN;
                        commanderMap = new mapboxgl.Map({
                            container: 'map-inner',
                            style: 'mapbox://styles/mapbox/dark-v11',
                            center: [loc.lng, loc.lat],
                            zoom: 16
                        });
                        
                        const el = document.createElement('div');
                        el.className = 'custom-mapbox-marker';
                        el.innerHTML = '<i class="fa-solid fa-location-crosshairs" style="color:var(--primary);font-size:1.5rem;filter:drop-shadow(0 0 5px var(--primary));"></i>';
                        
                        commanderMarker = new mapboxgl.Marker(el)
                            .setLngLat([loc.lng, loc.lat])
                            .addTo(commanderMap);
                    } else {
                        commanderMap.flyTo({ center: [loc.lng, loc.lat], zoom: 16, speed: 0.8 });
                        if (commanderMarker) {
                            commanderMarker.setLngLat([loc.lng, loc.lat]);
                        }
                    }
                }
            }
            
            // Update battery
            const batStr = localStorage.getItem('vg_battery_level');
            if (batStr) {
                const bel = $('cmd-battery');
                if (bel) bel.textContent = batStr + '%';
            }
            
            // Evidence count
            const count = localStorage.getItem('vg_evidence_count');
            const badge = $('evidence-count');
            if (badge && count) badge.textContent = count;

            // Sync Photos
            const photosStr = localStorage.getItem('vg_evidence_photos');
            if (photosStr) {
                try {
                    const photos = JSON.parse(photosStr);
                    renderPhotosGrid(photos);
                } catch(e) {}
            }

            // Sync Evidence Vault
            const storeStr = localStorage.getItem('vg_evidence_store');
            if (storeStr) {
                try {
                    const parsed = JSON.parse(storeStr);
                    if (parsed) {
                        Object.assign(EvidenceStore, parsed);
                        renderEvidenceVault();
                    }
                } catch(e) {}
            }
        }
    }
}

setInterval(syncStateLoop, 1500);

// ─────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Load evidence store from localStorage if present on boot
    try {
        const savedStore = localStorage.getItem('vg_evidence_store');
        if (savedStore) {
            Object.assign(EvidenceStore, JSON.parse(savedStore));
        }
    } catch(e){}

    initAuth();
    initRoleScreen();
    
    // Draw evidence vault once on boot if we have cached items
    renderEvidenceVault();
    
    route();
});
