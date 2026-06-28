import { getAnalytics, logEvent as fbLogEvent, isSupported } from 'firebase/analytics';
import { app } from '../firebase/config';

let firebaseAnalytics = null;

// Initialize Firebase Analytics
export const initFirebaseAnalytics = () => {
  if (!app) return;
  isSupported().then(supported => {
    if (supported) {
      firebaseAnalytics = getAnalytics(app);
      console.log('[Firebase Analytics] Initialized successfully.');
    }
  }).catch(err => {
    console.warn('[Firebase Analytics] Not supported in this browser:', err);
  });
};

// Dynamic PostHog Script Injection and Initialization
export const initPostHog = () => {
  if (typeof window === 'undefined') return;

  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY || 'phc_mockkey123';
  const apiHost = import.meta.env.VITE_POSTHOG_API_HOST || 'https://us.posthog.com';

  /* eslint-disable */
  (function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}var c=e;for(void 0!==a?c=e[a]=[]:a="posthog",c.people=c.people||[],c.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},c.people.toString=function(){return c.toString(1)+".people"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures onSessionId getSurveys getActiveMatchingSurveys".split(" "),n=0;n<o.length;n++)g(c,o[n]);e._i.push([i,s,a])},e.__SV=1.0,(o=t.createElement("script")).type="text/javascript",o.async=!0,o.src=apiHost+'/static/array.js',o.crossOrigin="anonymous",(n=t.getElementsByTagName("script")[0]).parentNode.insertBefore(o,n))})(document,window.posthog||[]);
  /* eslint-enable */

  if (window.posthog) {
    window.posthog.init(apiKey, {
      api_host: apiHost,
      person_profiles: 'identified_only',
      loaded: () => {
        console.log('[PostHog] Initialized successfully.');
      }
    });
  }
};

// Track Event on both Platforms
export const trackEvent = (eventName, params = {}) => {
  // 1. PostHog
  if (window.posthog && typeof window.posthog.capture === 'function') {
    window.posthog.capture(eventName, params);
  } else {
    console.log('[Analytics Mock - PostHog]', eventName, params);
  }

  // 2. Firebase Analytics
  if (firebaseAnalytics) {
    fbLogEvent(firebaseAnalytics, eventName, params);
  } else {
    console.log('[Analytics Mock - Firebase]', eventName, params);
  }
};

// Track Page View
export const trackPageView = (pathName) => {
  trackEvent('page_view', { page_path: pathName });
};

// Identify User
export const identifyUser = (userId, userProperties = {}) => {
  if (window.posthog && typeof window.posthog.identify === 'function') {
    window.posthog.identify(userId, userProperties);
  }
};
