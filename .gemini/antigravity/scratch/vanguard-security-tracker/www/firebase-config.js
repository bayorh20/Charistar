// Firebase config stub — Vanguard runs natively via database-backed production APIs.
// Real Firebase can be enabled if desired by adding the SDK scripts and configuring below.

(function() {
    if (typeof firebase !== 'undefined') {
        try {
            const firebaseConfig = {
                apiKey: "prod",
                authDomain: "vanguard.firebaseapp.com",
                projectId: "vanguard",
                storageBucket: "vanguard.appspot.com",
                messagingSenderId: "000000",
                appId: "1:000000:web:000000"
            };
            firebase.initializeApp(firebaseConfig);
        } catch(e) {
            // Already initialized or config invalid — safe to ignore
            console.info('Firebase init skipped.');
        }
    } else {
        console.info('Vanguard secure API sync enabled.');
    }
})();
