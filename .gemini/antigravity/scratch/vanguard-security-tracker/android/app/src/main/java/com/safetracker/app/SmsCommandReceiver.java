package com.safetracker.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.location.LocationManager;
import android.os.Bundle;
import android.telephony.SmsManager;
import android.telephony.SmsMessage;
import android.util.Log;

public class SmsCommandReceiver extends BroadcastReceiver {
    private static final String TAG = "SmsCommandReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if ("android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            android.content.SharedPreferences prefs = context.getSharedPreferences("SafeTrackerPrefs", Context.MODE_PRIVATE);
            boolean active = prefs.getBoolean("vg_protection_active", true);
            if (!active) {
                Log.d(TAG, "Vanguard protection is paused. Ignoring SMS command.");
                return;
            }

            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                if (pdus != null) {
                    String secretWord = prefs.getString("vg_sms_word", "FIND ME");
                    for (Object pdu : pdus) {
                        SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                        String senderNum = smsMessage.getOriginatingAddress();
                        String messageBody = smsMessage.getMessageBody();

                        if (messageBody != null && messageBody.trim().equalsIgnoreCase(secretWord)) {
                            Log.d(TAG, "Secret command received from " + senderNum);
                            sendLocationReply(context, senderNum);
                        }
                    }
                }
            }
        }
    }

    private void sendLocationReply(Context context, String recipient) {
        LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
        try {
            // Get last known location for a quick reply
            Location location = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            if (location == null) {
                location = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
            }

            String replyText;
            if (location != null) {
                double lat = location.getLatitude();
                double lng = location.getLongitude();
                replyText = "SafeTracker: Current Location is https://maps.google.com/?q=" + lat + "," + lng;
            } else {
                replyText = "SafeTracker: GPS Location currently unavailable, but phone is online via cellular.";
            }

            SmsManager smsManager = SmsManager.getDefault();
            smsManager.sendTextMessage(recipient, null, replyText, null, null);
            Log.d(TAG, "Reply sent to " + recipient);
        } catch (SecurityException e) {
            Log.e(TAG, "Missing location permissions", e);
        }
    }
}
