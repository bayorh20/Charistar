package com.safetracker.app;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "VanguardPlugin")
public class VanguardPlugin extends Plugin {

    @PluginMethod
    public void requestDeviceAdmin(PluginCall call) {
        Context context = getContext();
        DevicePolicyManager dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
        ComponentName adminComponent = new ComponentName(context, AdminReceiver.class);

        if (!dpm.isAdminActive(adminComponent)) {
            Intent intent = new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
            intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent);
            intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Activating Device Administrator prevents thieves from uninstalling Vanguard or force-closing the background tracker.");
            
            // We need to start the activity. Since we're in a plugin, we use getActivity()
            getActivity().startActivity(intent);
            
            call.resolve();
        } else {
            // Already active
            call.reject("Device Admin is already active.");
        }
    }

    @PluginMethod
    public void saveSmsSettings(PluginCall call) {
        String triggerWord = call.getString("triggerWord", "FIND ME");
        String ownerNumber = call.getString("ownerNumber", "");
        
        Context context = getContext();
        android.content.SharedPreferences prefs = context.getSharedPreferences("SafeTrackerPrefs", Context.MODE_PRIVATE);
        prefs.edit()
            .putString("vg_sms_word", triggerWord)
            .putString("vg_sms_num", ownerNumber)
            .apply();
            
        call.resolve();
    }

    @PluginMethod
    public void getSmsSettings(PluginCall call) {
        Context context = getContext();
        android.content.SharedPreferences prefs = context.getSharedPreferences("SafeTrackerPrefs", Context.MODE_PRIVATE);
        String triggerWord = prefs.getString("vg_sms_word", "FIND ME");
        String ownerNumber = prefs.getString("vg_sms_num", "");
        
        com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
        ret.put("triggerWord", triggerWord);
        ret.put("ownerNumber", ownerNumber);
        call.resolve(ret);
    }

    @PluginMethod
    public void setProtectionActive(PluginCall call) {
        Boolean active = call.getBoolean("active", true);
        Context context = getContext();
        android.content.SharedPreferences prefs = context.getSharedPreferences("SafeTrackerPrefs", Context.MODE_PRIVATE);
        prefs.edit().putBoolean("vg_protection_active", active).apply();
        call.resolve();
    }

    @PluginMethod
    public void getProtectionActive(PluginCall call) {
        Context context = getContext();
        android.content.SharedPreferences prefs = context.getSharedPreferences("SafeTrackerPrefs", Context.MODE_PRIVATE);
        boolean active = prefs.getBoolean("vg_protection_active", true);
        com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
        ret.put("active", active);
        call.resolve(ret);
    }
}
