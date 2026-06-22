package com.safetracker.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.telephony.SmsManager;
import android.telephony.TelephonyManager;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";
    private static final String PREFS_NAME = "SafeTrackerPrefs";
    private static final String KEY_SAVED_SIM_ID = "saved_sim_id";
    private static final String KEY_TRUSTED_NUMBER = "trusted_number"; // Should be set via the UI in Capacitor

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Log.d(TAG, "Boot completed detected. Checking SIM status.");
            checkSimChange(context);
        }
    }

    private void checkSimChange(Context context) {
        try {
            TelephonyManager telephonyManager = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
            // Warning: getSimSerialNumber() is deprecated/restricted in Android 10+, but we use it as a basic check if permissions allow
            String currentSimId = telephonyManager.getSimSerialNumber(); 
            
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String savedSimId = prefs.getString(KEY_SAVED_SIM_ID, null);
            String trustedNumber = prefs.getString(KEY_TRUSTED_NUMBER, null);

            if (currentSimId != null && savedSimId != null && trustedNumber != null) {
                if (!currentSimId.equals(savedSimId)) {
                    Log.w(TAG, "SIM CHANGE DETECTED! Alerting trusted number.");
                    sendSimChangeAlert(context, trustedNumber);
                    
                    // Update saved SIM to prevent spamming on every reboot
                    prefs.edit().putString(KEY_SAVED_SIM_ID, currentSimId).apply();
                } else {
                    Log.d(TAG, "SIM card matches. No theft detected.");
                }
            } else if (currentSimId != null && savedSimId == null) {
                // First time setup: Save the current SIM
                prefs.edit().putString(KEY_SAVED_SIM_ID, currentSimId).apply();
            }

        } catch (SecurityException e) {
            Log.e(TAG, "Missing READ_PHONE_STATE permission to check SIM", e);
        }
    }

    private void sendSimChangeAlert(Context context, String trustedNumber) {
        String alertText = "URGENT: SafeTracker detected a SIM card change on your device! The new phone number is whoever sent this text.";
        try {
            SmsManager smsManager = SmsManager.getDefault();
            smsManager.sendTextMessage(trustedNumber, null, alertText, null, null);
            Log.d(TAG, "SIM Change SMS sent to " + trustedNumber);
        } catch (Exception e) {
            Log.e(TAG, "Failed to send SIM change alert", e);
        }
    }
}
