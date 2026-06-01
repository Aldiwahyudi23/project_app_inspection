//src/main/java/com/cekmobil/online/MainActivity.java
package com.example.app;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.Nullable;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    public static WebView webViewRef;
    private ActivityResultLauncher<Intent> cameraLauncher;
    private String pendingItemId;      // Simpan ID item yang memanggil
    private String pendingItemName;    // Simpan nama item yang memanggil
    private String pendingAspectRatio; // Simpan aspect ratio yang dipilih

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webViewRef = this.bridge.getWebView();

        // Register activity result launcher untuk CameraX
        cameraLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                    String photoPath = result.getData().getStringExtra("photoPath");
                    String itemId = result.getData().getStringExtra("itemId");
                    String itemName = result.getData().getStringExtra("itemName");
                    
                    if (photoPath != null && !photoPath.isEmpty()) {
                        // Kirim path beserta ID dan nama item ke Vue
                        sendToVue(photoPath, itemId, itemName);
                    } else {
                        sendErrorToVue("No photo path received");
                    }
                } 
                // else if (result.getResultCode() == RESULT_CANCELED) {
                //     sendErrorToVue("Camera cancelled");
                // }
            }
        );

        this.bridge.getWebView().addJavascriptInterface(new AndroidBridge(), "Android");
    }

    public class AndroidBridge {
        @JavascriptInterface
        public void openCameraX(String itemId, String itemName, String aspectRatio) {
            // Simpan ID, nama, dan aspect ratio yang memanggil
            pendingItemId = itemId;
            pendingItemName = itemName;
            pendingAspectRatio = aspectRatio;
            
            runOnUiThread(() -> {
                Intent intent = new Intent(MainActivity.this, CameraXActivity.class);
                // Kirim data ke CameraXActivity
                intent.putExtra("itemId", itemId);
                intent.putExtra("itemName", itemName);
                intent.putExtra("aspectRatio", aspectRatio); // Kirim aspect ratio
                cameraLauncher.launch(intent);
            });
        }
    }

    // Kirim path file ke Vue dengan itemId dan itemName
    private void sendToVue(String path, String itemId, String itemName) {
        if (webViewRef == null) return;

        webViewRef.post(() -> {
            // Escape string untuk JavaScript
            String escapedPath = path.replace("'", "\\'");
            String escapedItemId = itemId.replace("'", "\\'");
            String escapedItemName = itemName.replace("'", "\\'");
            
            String jsCode = String.format(
                "window.onCameraXResult({ success: true, path: '%s', itemId: '%s', itemName: '%s' })",
                escapedPath, escapedItemId, escapedItemName
            );
            webViewRef.evaluateJavascript(jsCode, null);
        });
    }

    private void sendErrorToVue(String error) {
        if (webViewRef == null) return;

        webViewRef.post(() -> {
            String jsCode = String.format(
                "window.onCameraXResult({ success: false, error: '%s' })",
                error.replace("'", "\\'")
            );
            webViewRef.evaluateJavascript(jsCode, null);
        });
    }
}