package com.example.app;

import android.content.Intent;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;
import android.util.Log;


@CapacitorPlugin(name = "CameraX")
public class CameraXPlugin extends Plugin {

   @PluginMethod
    public void open(PluginCall call) {
        Log.d("CameraXPlugin", "OPEN CAMERA DIPANGGIL 🔥");
        Intent intent = new Intent(getActivity(), CameraXActivity.class);
        getActivity().startActivity(intent);
        call.resolve();
    }
}