/* ══════════════════════════════════════════════════
   VANGUARD — COMMAND CENTER DASHBOARD JS
   ══════════════════════════════════════════════════ */

'use strict';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmF5b25sZTEiLCJhIjoiY21wZjd3b2N4MDF6ODJ0c2VwOXhjYjh3OSJ9.ACkq2SJ6sGvaKTCZjfq_eQ';
let ccMap = null;
let ccMarker = null;

// Admin state
const AdminState = {
    user: JSON.parse(localStorage.getItem('vg_user') || 'null'),
    role: 'Super Admin',
    devices: JSON.parse(localStorage.getItem('vg_devices') || '[]'),
    activeDeviceId: localStorage.getItem('vg_active_tracking_device_id') || null,
    telemetry: {},
    pollingTimer: null,
};

function $(id) { return document.getElementById(id); }

// Security Validation helper
function checkSession() {
    if (!AdminState.user) {
        window.location.href = 'index.html';
        return false;
    }
    const adminEmail = $('admin-user-email');
    if (adminEmail) adminEmail.textContent = AdminState.user.email;
    return true;
}

// Draw/Populate Devices Panel
function renderTrackerDevices() {
    const container = $('tracker-devices-list');
    if (!container) return;

    if (AdminState.devices.length === 0) {
        container.innerHTML = '<p style="color:var(--text3); font-size:0.8rem; text-align:center; padding-top:40px;">No linked devices found.</p>';
        return;
    }

    container.innerHTML = AdminState.devices.map(device => {
        const isActive = AdminState.activeDeviceId === device.id;
        const isOnline = device.online || false;
        return `
            <div class="cc-device-item ${isActive ? 'active' : ''}" onclick="selectActiveDevice('${device.id}')">
                <div class="device-dot ${isOnline ? 'online' : ''}"></div>
                <div class="device-details">
                    <strong>${device.name || 'Anti-Theft Agent'}</strong>
                    <span>ID: ${device.id}</span>
                </div>
            </div>
        `;
    }).join('');

    const countBadge = $('tracker-count-badge');
    if (countBadge) countBadge.textContent = AdminState.devices.length;

    // Update global KPI summary cards
    const onlineCount = AdminState.devices.filter(d => d.online).length;
    const stolenCount = AdminState.devices.filter(d => d.stolen).length;
    
    if ($('kpi-online')) $('kpi-online').textContent = onlineCount;
    if ($('kpi-stolen')) $('kpi-stolen').textContent = stolenCount;
}

// Select active device on dashboard click
window.selectActiveDevice = function(id) {
    AdminState.activeDeviceId = id;
    localStorage.setItem('vg_active_tracking_device_id', id);
    renderTrackerDevices();
    
    // Clear display state specs for fresh loading
    $('cc-tel-platform').textContent = 'Loading...';
    $('cc-tel-battery').textContent = 'Loading...';
    $('cc-tel-network').textContent = 'Loading...';
    $('cc-tel-gps').textContent = 'Loading...';

    // Enable command execution buttons
    const commandTiles = ['cc-cmd-siren', 'cc-cmd-photo', 'cc-cmd-lock', 'cc-cmd-wipe'];
    commandTiles.forEach(tileId => {
        const el = $(tileId);
        if (el) el.removeAttribute('disabled');
    });

    // Reset status tracker
    resetCommandTracker();

    // Trigger immediate loop iteration
    syncStateLoop();
};

function resetCommandTracker() {
    ['step-sent', 'step-received', 'step-processing', 'step-executed'].forEach(dotId => {
        const dot = $(dotId);
        if (dot) dot.className = 'step-dot';
    });
    const statusText = $('cc-cmd-status-text');
    if (statusText) statusText.textContent = 'Operational command gateway ready.';
}

// Simulated dynamic command execution states progression tracker
function animateCommandProgress(commandKey, commandValue) {
    const steps = ['sent', 'received', 'processing', 'executed'];
    let delay = 1000;
    
    const textLabels = {
        vg_trigger_siren: 'Audible siren alarm blast',
        vg_trigger_photo: 'Front stealth photo capture',
        vg_trigger_lock: 'Lockdown decoy execution',
        vg_trigger_wipe: 'Irreversible factory reset wipe'
    };
    
    const cmdLabel = textLabels[commandKey] || 'Command';

    steps.forEach((step, index) => {
        setTimeout(() => {
            if (index === 0) {
                const dot = $('step-sent');
                if (dot) dot.classList.add('active');
                $('cc-cmd-status-text').textContent = `Dispatched command: ${cmdLabel} (Sent).`;
            } else if (index === 1) {
                const dot = $('step-received');
                if (dot) dot.classList.add('active');
                $('cc-cmd-status-text').textContent = `Device received: ${cmdLabel}.`;
            } else if (index === 2) {
                const dot = $('step-processing');
                if (dot) dot.classList.add('active');
                $('cc-cmd-status-text').textContent = `Device processing: ${cmdLabel}.`;
            } else if (index === 3) {
                // When done, mark all active as success, clear remote trigger in local DB
                ['step-sent', 'step-received', 'step-processing', 'step-executed'].forEach(dotId => {
                    const dot = $(dotId);
                    if (dot) {
                        dot.classList.remove('active');
                        dot.classList.add('success');
                    }
                });
                $('cc-cmd-status-text').textContent = `Executed successfully: ${cmdLabel}.`;
                
                // Finalize local and remote db state update
                localStorage.setItem(commandKey, 'false');
                postCommandState(commandKey, 'false');
            }
        }, delay * (index + 1));
    });
}

// Perform sync communication requests
async function syncStateLoop() {
    if (!AdminState.user || !AdminState.activeDeviceId) return;

    try {
        const syncId = AdminState.activeDeviceId;
        const res = await fetch(`/api/sync?deviceId=${syncId}`, {
            headers: { 'x-user-email': AdminState.user.email }
        });
        
        if (res.status === 200) {
            const data = await res.json();
            handleSynchronizedData(data);
        }
    } catch(e) {
        console.warn('Sync connection error:', e);
    }
}

// State data handling and parser logic
function handleSynchronizedData(data) {
    if (!data || Object.keys(data).length === 0) return;

    // Remove select overlays and reveal maps
    const prompt = $('map-select-prompt');
    if (prompt) prompt.style.display = 'none';

    // Threat index calculation based on arm status, battery drop, and incident logs
    let threatPct = 0;
    
    // Arm/Stolen Status
    const isStolen = data.vg_stolen === 'true';
    if (isStolen) threatPct += 50;

    // Update active state stolen cards
    AdminState.devices = AdminState.devices.map(d => {
        if (d.id === AdminState.activeDeviceId) {
            return { ...d, stolen: isStolen, online: true };
        }
        return d;
    });
    renderTrackerDevices();

    // Live Telemetry Position updates
    if (data.vg_last_location) {
        try {
            const loc = JSON.parse(data.vg_last_location);
            if (loc && loc.lat && loc.lng) {
                // Focus Mapbox camera coordinates
                updateDashboardMap(loc.lat, loc.lng, loc.placeName || 'Active GPS coordinates');
                
                const gpsEl = $('cc-tel-gps');
                if (gpsEl) gpsEl.textContent = `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`;
            }
        } catch(e){}
    }

    // Battery Specs
    if (data.vg_battery_level) {
        const batVal = parseInt(data.vg_battery_level);
        if (batVal <= 15) threatPct += 20; // critically low battery threat
        
        const batEl = $('cc-tel-battery');
        if (batEl) batEl.textContent = `${batVal}%`;
    }

    // Network Status
    const netEl = $('cc-tel-network');
    if (netEl) netEl.textContent = 'Active (Live)';

    // Evidence timeline logs loading
    let totalEvidenceItems = 0;
    if (data.vg_evidence_store) {
        try {
            const store = JSON.parse(data.vg_evidence_store);
            if (store) {
                let listHtml = '';
                
                // Aggregate items from behavior, device contexts
                const logs = [];
                if (store.behavior) {
                    store.behavior.forEach(b => {
                        logs.push({ title: b.title, detail: b.detail, ts: b.ts, isThreat: b.type === 'danger' });
                        if (b.type === 'danger') threatPct += 10;
                    });
                }
                if (store.device) {
                    store.device.forEach(d => {
                        if (d.title && d.title.includes('Hardware Fingerprint')) {
                            // Extract platform spec details
                            const pMatch = d.detail.match(/Platform:\s*([^\n]+)/);
                            if (pMatch && $('cc-tel-platform')) {
                                $('cc-tel-platform').textContent = pMatch[1];
                            }
                        }
                    });
                }

                // Render evidence details
                if (logs.length > 0) {
                    listHtml = logs.map(log => `
                        <div class="timeline-item ${log.isThreat ? 'incident' : ''}">
                            <strong>${log.title}</strong>
                            <p style="font-size:0.7rem; color:var(--text3); margin-top:2px;">${log.detail.replace('\n', '<br>')}</p>
                            <span style="font-size:0.62rem; color:var(--text3); margin-top:2px;">${log.ts || ''}</span>
                        </div>
                    `).join('');
                } else {
                    listHtml = '<p style="color:var(--text3); text-align:center; padding-top:20px; font-size:0.75rem;">No telemetry evidence synchronized.</p>';
                }
                
                $('cc-evidence-timeline').innerHTML = listHtml;
                
                // Summarize total items count
                const photoCount = data.vg_evidence_photos ? JSON.parse(data.vg_evidence_photos).length : 0;
                totalEvidenceItems = Object.values(store).reduce((a, b) => a + b.length, 0) + photoCount;
            }
        } catch(e){}
    }

    // Biometric intruder photo capture sync
    if (data.vg_evidence_photos) {
        try {
            const photos = JSON.parse(data.vg_evidence_photos);
            if (photos && photos.length > 0) {
                const imgEl = $('cc-intruder-photo');
                if (imgEl) {
                    imgEl.src = photos[0].url;
                    imgEl.style.display = 'block';
                    
                    const container = $('cc-intruder-photo-container');
                    const emptyText = container.querySelector('p');
                    if (emptyText) emptyText.style.display = 'none';
                }
            }
        } catch(e){}
    }

    // Threat Score indicator limits
    const threatBadge = $('kpi-threat');
    if (threatBadge) {
        const finalThreat = Math.min(100, threatPct);
        threatBadge.textContent = `${finalThreat}%`;
        if (finalThreat >= 60) {
            threatBadge.style.color = 'var(--danger)';
        } else if (finalThreat >= 30) {
            threatBadge.style.color = 'var(--yellow)';
        } else {
            threatBadge.style.color = 'var(--green)';
        }
    }

    // Evidence count
    if ($('kpi-evidence')) $('kpi-evidence').textContent = totalEvidenceItems;
}

// Mapbox dashboard update controller
function updateDashboardMap(lat, lng, label) {
    if (typeof mapboxgl === 'undefined') return;

    if (!ccMap) {
        mapboxgl.accessToken = MAPBOX_TOKEN;
        ccMap = new mapboxgl.Map({
            container: 'cc-map-container',
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [lng, lat],
            zoom: 15
        });

        // Add custom wailing pulse marker
        const el = document.createElement('div');
        el.className = 'cc-mapbox-marker';
        el.innerHTML = '<i class="fa-solid fa-location-crosshairs" style="color:var(--primary); font-size:1.8rem; filter:drop-shadow(0 0 8px var(--primary));"></i>';

        ccMarker = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(ccMap);
    } else {
        ccMap.flyTo({ center: [lng, lat], zoom: 15, speed: 0.8 });
        if (ccMarker) ccMarker.setLngLat([lng, lat]);
    }
}

// Dispatches local command triggers up to KV Sync endpoints
async function triggerCommand(key) {
    if (!AdminState.activeDeviceId) return;

    // Reset indicator status
    resetCommandTracker();

    localStorage.setItem(key, 'true');
    await postCommandState(key, 'true');
    
    // Progress simulator animations
    animateCommandProgress(key, 'true');
}

async function postCommandState(key, value) {
    try {
        const syncId = AdminState.activeDeviceId;
        const commands = {};
        commands[key] = value;

        await fetch(`/api/sync?deviceId=${syncId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-user-email': AdminState.user.email
            },
            body: JSON.stringify(commands)
        });
    } catch(e) {
        console.warn('Failed to publish command status:', e);
    }
}

// Event bindings
document.addEventListener('DOMContentLoaded', () => {
    if (!checkSession()) return;

    renderTrackerDevices();

    // Wire command execution tiles
    $('cc-cmd-siren').addEventListener('click', () => triggerCommand('vg_trigger_siren'));
    $('cc-cmd-photo').addEventListener('click', () => triggerCommand('vg_trigger_photo'));
    $('cc-cmd-lock').addEventListener('click', () => triggerCommand('vg_trigger_lock'));
    
    // Wipe remote validation modal confirmation
    $('cc-cmd-wipe').addEventListener('click', () => {
        $('cc-wipe-modal').style.display = 'flex';
    });
    $('cc-btn-wipe-cancel').addEventListener('click', () => {
        $('cc-wipe-modal').style.display = 'none';
    });
    $('cc-btn-wipe-confirm').addEventListener('click', () => {
        $('cc-wipe-modal').style.display = 'none';
        triggerCommand('vg_trigger_wipe');
    });

    // Navigation back to mobile view page
    $('btn-back-app').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // Session logouts
    $('btn-admin-logout').addEventListener('click', () => {
        localStorage.removeItem('vg_user');
        localStorage.removeItem('vg_role');
        window.location.href = 'index.html';
    });

    // Start background sync listener intervals
    setInterval(syncStateLoop, 1500);
});
