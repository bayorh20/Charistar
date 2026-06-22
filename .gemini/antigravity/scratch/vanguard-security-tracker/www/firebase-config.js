// Firebase config stub — Vanguard runs fully in demo mode via local server sync.
// Real Firebase can be enabled by adding the SDK scripts and proper config below.

(function() {
    if (typeof firebase !== 'undefined') {
        try {
            const firebaseConfig = {
                apiKey: "demo",
                authDomain: "vanguard.firebaseapp.com",
                projectId: "vanguard",
                storageBucket: "vanguard.appspot.com",
                messagingSenderId: "000000",
                appId: "1:000000:web:000000"
            };
            firebase.initializeApp(firebaseConfig);
        } catch(e) {
            // Already initialized or config invalid — safe to ignore
            console.info('Firebase init skipped (demo mode).');
        }
    } else {
        console.info('Firebase SDK not loaded — running in demo sync mode.');
    }
})();
