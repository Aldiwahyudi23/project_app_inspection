// src/main/java/com/example/app/CameraXActivity.java
package com.example.app;

import android.Manifest;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.PorterDuff;
import android.media.ExifInterface;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.View;
import android.view.ViewTreeObserver;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Button;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.AspectRatio;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.FocusMeteringAction;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.ImageCaptureException;
import androidx.camera.core.MeteringPoint;
import androidx.camera.core.MeteringPointFactory;
import androidx.camera.core.Preview;
import androidx.camera.core.ZoomState;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.google.common.util.concurrent.ListenableFuture;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class CameraXActivity extends AppCompatActivity {

    // ─── Konstanta ───────────────────────────────────────────────
    private static final int    REQUEST_CODE_PERMISSIONS = 1001;
    private static final String PREFS_NAME               = "CameraXPrefs";
    private static final String PREFS_KEY_GLOBAL_RATIO   = "global_aspect_ratio";
    // Key per-item: "item_ratio_<itemId>"  (dibuat dinamis di kode)

    private static final String[] REQUIRED_PERMISSIONS = {
            Manifest.permission.CAMERA,
            Manifest.permission.WRITE_EXTERNAL_STORAGE,
            Manifest.permission.READ_EXTERNAL_STORAGE
    };
    private static final String[] REQUIRED_PERMISSIONS_33 = {
            Manifest.permission.CAMERA,
            Manifest.permission.READ_MEDIA_IMAGES
    };

    // ─── View ────────────────────────────────────────────────────
    private PreviewView  previewView;
    private ImageButton  btnCapture, btnClose, btnFlash;
    private Button       btnAspectRatio;
    private View         focusRing;
    private View         overlayTop, overlayBottom;

    // ─── CameraX ─────────────────────────────────────────────────
    private ImageCapture imageCapture;
    private Camera       camera;
    private Executor     executor;

    // ─── State ───────────────────────────────────────────────────
    private boolean isFlashOn      = false;
    private boolean isCapturing    = false;
    private File    photoFile;

    private String  itemId;
    private String  itemName;

    /**
     * Aspect ratio yang datang dari DATABASE (Intent).
     * Null  → tidak ada data dari DB → pakai local / default.
     * "flexible" atau "1:2" → user boleh pilih sendiri.
     */
    private String  dbAspectRatio;

    /**
     * Aspect ratio yang sedang aktif di kamera.
     * Ini yang bisa berubah saat user menekan tombol toggle.
     */
    private String  chosenAspectRatio;

    /**
     * true  → tidak ada data DB → tampilkan tombol toggle & simpan ke local.
     * false → ikut data dari DB, tombol toggle disembunyikan.
     */
    private boolean isFlexibleMode = false;

    // Koordinat overlay 1:1 (px)
    private int squareTop  = 0;
    private int squareSize = 0;

    // Zoom & focus
    private ScaleGestureDetector scaleGestureDetector;
    private float currentZoomRatio = 1f;
    private final Handler  handler          = new Handler(Looper.getMainLooper());
    private       Runnable hideFocusRunnable;

    // ─────────────────────────────────────────────────────────────
    // LIFECYCLE
    // ─────────────────────────────────────────────────────────────

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_camerax);

        // ── 1. Ambil data dari Intent (dari DB / bridge) ──────────
        itemId         = getIntent().getStringExtra("itemId");
        itemName       = getIntent().getStringExtra("itemName");
        dbAspectRatio  = getIntent().getStringExtra("aspectRatio");

        if (itemName == null) itemName = "Item";

        // ── 2. Tentukan mode & chosenAspectRatio ─────────────────
        //
        //   Prioritas:
        //     a) DB punya nilai konkret (1:1 / 4:3) → pakai itu, lock (no toggle)
        //     b) DB null / "flexible" / "1:2"       → flexible mode:
        //          i.  Cek local storage (per-item jika ada itemId, else global)
        //          ii. Kalau local kosong → default 1:1
        //
        if (dbAspectRatio != null
                && !dbAspectRatio.isEmpty()
                && !"flexible".equals(dbAspectRatio)
                && !"1:2".equals(dbAspectRatio)) {

            // Kasus (a): DB sudah tentukan ratio → ikut DB, tidak bisa diubah user
            isFlexibleMode    = false;
            chosenAspectRatio = dbAspectRatio;

        } else {

            // Kasus (b): Flexible — baca dari local, fallback ke "1:1"
            isFlexibleMode    = true;
            chosenAspectRatio = loadAspectRatioFromLocal();   // "1:1" jika belum tersimpan
        }

        // ── 3. Bind views ─────────────────────────────────────────
        previewView    = findViewById(R.id.previewView);
        btnCapture     = findViewById(R.id.btnCapture);
        btnClose       = findViewById(R.id.btnClose);
        btnFlash       = findViewById(R.id.btnFlash);
        btnAspectRatio = findViewById(R.id.btnAspectRatio);
        focusRing      = findViewById(R.id.focusRing);
        overlayTop     = findViewById(R.id.overlayTop);
        overlayBottom  = findViewById(R.id.overlayBottom);
        TextView tvItemName = findViewById(R.id.tvItemName);

        cleanupOldPhotos();

        tvItemName.setText(itemName);
        btnClose.setColorFilter(Color.WHITE, PorterDuff.Mode.SRC_IN);
        setFlashIcon(false);

        executor = Executors.newSingleThreadExecutor();

        // FIT_CENTER → preview tidak di-crop; apa yang terlihat = yang difoto
        previewView.setImplementationMode(PreviewView.ImplementationMode.COMPATIBLE);
        previewView.setScaleType(PreviewView.ScaleType.FIT_CENTER);

        // ── 4. Tombol toggle aspect ratio ─────────────────────────
        if (isFlexibleMode) {
            btnAspectRatio.setVisibility(View.VISIBLE);
            btnAspectRatio.setOnClickListener(v -> toggleAspectRatio());
            updateAspectRatioButtonIcon();
        } else {
            btnAspectRatio.setVisibility(View.GONE);
        }

        // ── 5. Terapkan overlay sesuai chosenAspectRatio ─────────
        applyOverlayForCurrentRatio();

        // ── 6. Touch (zoom + focus) ───────────────────────────────
        scaleGestureDetector = new ScaleGestureDetector(this, new PinchZoomListener());
        previewView.setOnTouchListener((v, event) -> {
            scaleGestureDetector.onTouchEvent(event);
            if (event.getAction() == MotionEvent.ACTION_UP
                    && !scaleGestureDetector.isInProgress()) {
                performTapToFocus(event.getX(), event.getY());
            }
            return true;
        });

        btnCapture.setOnClickListener(v -> takePhoto());
        btnClose.setOnClickListener(v -> { setResult(RESULT_CANCELED); finish(); });
        btnFlash.setOnClickListener(v -> toggleFlash());

        // ── 7. Minta izin / mulai kamera ─────────────────────────
        if (allPermissionsGranted()) {
            startCamera();
        } else {
            String[] perms = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                    ? REQUIRED_PERMISSIONS_33 : REQUIRED_PERMISSIONS;
            ActivityCompat.requestPermissions(this, perms, REQUEST_CODE_PERMISSIONS);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // LOCAL STORAGE  (SharedPreferences)
    // ─────────────────────────────────────────────────────────────

    /**
     * Baca aspect ratio dari SharedPreferences.
     * Urutan lookup:
     *   1. Key per-item  "item_ratio_<itemId>"  (jika itemId tersedia)
     *   2. Key global    "global_aspect_ratio"
     *   3. Default       "1:1"
     */
    private String loadAspectRatioFromLocal() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);

        // Cek per-item dulu
        if (itemId != null && !itemId.isEmpty()) {
            String perItemKey = "item_ratio_" + itemId;
            String saved = prefs.getString(perItemKey, null);
            if (saved != null) return saved;
        }

        // Cek global
        return prefs.getString(PREFS_KEY_GLOBAL_RATIO, "1:1");  // default 1:1
    }

    /**
     * Simpan aspect ratio ke SharedPreferences.
     * - Selalu update key GLOBAL.
     * - Jika itemId tersedia, juga update key per-item.
     */
    private void saveAspectRatioToLocal(String ratio) {
        SharedPreferences.Editor editor =
                getSharedPreferences(PREFS_NAME, MODE_PRIVATE).edit();

        editor.putString(PREFS_KEY_GLOBAL_RATIO, ratio);

        if (itemId != null && !itemId.isEmpty()) {
            editor.putString("item_ratio_" + itemId, ratio);
        }

        editor.apply();
    }

    // ─────────────────────────────────────────────────────────────
    // TOGGLE ASPECT RATIO
    // ─────────────────────────────────────────────────────────────

    private void toggleAspectRatio() {
        if (isCapturing) {
            Toast.makeText(this, "Tunggu hingga foto selesai", Toast.LENGTH_SHORT).show();
            return;
        }

        // Toggle antara 1:1 ↔ 4:3
        chosenAspectRatio = "1:1".equals(chosenAspectRatio) ? "4:3" : "1:1";

        // Simpan ke local
        saveAspectRatioToLocal(chosenAspectRatio);

        // Update overlay
        applyOverlayForCurrentRatio();

        // Update ikon tombol
        updateAspectRatioButtonIcon();

        Toast.makeText(this, "Aspect Ratio: " + chosenAspectRatio, Toast.LENGTH_SHORT).show();
    }

    private void updateAspectRatioButtonIcon() {
        // Tombol menampilkan ratio yang akan DITUJU jika ditekan
        btnAspectRatio.setText("1:1".equals(chosenAspectRatio) ? "4:3" : "1:1");
    }

    // ─────────────────────────────────────────────────────────────
    // OVERLAY HELPER
    // ─────────────────────────────────────────────────────────────

    private void applyOverlayForCurrentRatio() {
        if ("1:1".equals(chosenAspectRatio)) {
            // Pasang overlay hitam setelah layout selesai diukur
            if (previewView.getWidth() == 0) {
                previewView.getViewTreeObserver().addOnGlobalLayoutListener(
                        new ViewTreeObserver.OnGlobalLayoutListener() {
                            @Override
                            public void onGlobalLayout() {
                                previewView.getViewTreeObserver()
                                        .removeOnGlobalLayoutListener(this);
                                applySquareOverlay();
                            }
                        });
            } else {
                applySquareOverlay();
            }
        } else {
            // 4:3 — sembunyikan overlay
            if (overlayTop    != null) overlayTop.setVisibility(View.GONE);
            if (overlayBottom != null) overlayBottom.setVisibility(View.GONE);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // SQUARE OVERLAY  (strip hitam atas & bawah untuk mode 1:1)
    // ─────────────────────────────────────────────────────────────

    private void applySquareOverlay() {
        if (overlayTop == null || overlayBottom == null) return;

        if (previewView.getWidth() == 0 || previewView.getHeight() == 0) {
            previewView.post(this::applySquareOverlay);
            return;
        }

        int pvW = previewView.getWidth();
        int pvH = previewView.getHeight();

        float imageH_pv = pvW * 4f / 3f;
        float letterbox = Math.max((pvH - imageH_pv) / 2f, 0f);

        squareSize = pvW;
        squareTop  = (int)(letterbox + (imageH_pv - squareSize) / 2f);

        int bottomH = pvH - squareTop - squareSize;
        if (bottomH < 0) bottomH = 0;

        FrameLayout.LayoutParams lpTop =
                (FrameLayout.LayoutParams) overlayTop.getLayoutParams();
        lpTop.height = squareTop;
        overlayTop.setLayoutParams(lpTop);
        overlayTop.setVisibility(squareTop > 0 ? View.VISIBLE : View.GONE);

        FrameLayout.LayoutParams lpBot =
                (FrameLayout.LayoutParams) overlayBottom.getLayoutParams();
        lpBot.height    = bottomH;
        lpBot.topMargin = squareTop + squareSize;
        overlayBottom.setLayoutParams(lpBot);
        overlayBottom.setVisibility(bottomH > 0 ? View.VISIBLE : View.GONE);
    }

    // ─────────────────────────────────────────────────────────────
    // CAMERA
    // ─────────────────────────────────────────────────────────────

    private void startCamera() {
        ListenableFuture<ProcessCameraProvider> future =
                ProcessCameraProvider.getInstance(this);

        future.addListener(() -> {
            try {
                ProcessCameraProvider provider = future.get();

                Preview preview = new Preview.Builder()
                        .setTargetAspectRatio(AspectRatio.RATIO_4_3)
                        .build();
                preview.setSurfaceProvider(previewView.getSurfaceProvider());

                imageCapture = new ImageCapture.Builder()
                        .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                        .setTargetAspectRatio(AspectRatio.RATIO_4_3)
                        .setTargetRotation(
                                getWindowManager().getDefaultDisplay().getRotation())
                        .build();

                provider.unbindAll();
                camera = provider.bindToLifecycle(
                        this,
                        CameraSelector.DEFAULT_BACK_CAMERA,
                        preview,
                        imageCapture);

                camera.getCameraInfo().getZoomState()
                        .observe(this, s -> currentZoomRatio = s.getZoomRatio());

            } catch (ExecutionException | InterruptedException e) {
                e.printStackTrace();
                runOnUiThread(() -> {
                    Toast.makeText(this, "Gagal memulai kamera", Toast.LENGTH_SHORT).show();
                    finish();
                });
            }
        }, ContextCompat.getMainExecutor(this));
    }

    // ─────────────────────────────────────────────────────────────
    // TAP TO FOCUS
    // ─────────────────────────────────────────────────────────────

    private void performTapToFocus(float x, float y) {
        if (camera == null) return;

        int ringPx = (int)(72 * getResources().getDisplayMetrics().density);
        int w = focusRing.getWidth();
        if (w == 0) w = ringPx;

        focusRing.setX(x - w / 2f);
        focusRing.setY(y - w / 2f);
        focusRing.setVisibility(View.VISIBLE);
        focusRing.setAlpha(1f);
        focusRing.setScaleX(1.4f);
        focusRing.setScaleY(1.4f);
        focusRing.animate().scaleX(1f).scaleY(1f).setDuration(200).start();

        if (hideFocusRunnable != null) handler.removeCallbacks(hideFocusRunnable);
        hideFocusRunnable = () -> focusRing.animate()
                .alpha(0f).setDuration(300)
                .withEndAction(() -> focusRing.setVisibility(View.INVISIBLE))
                .start();
        handler.postDelayed(hideFocusRunnable, 1500);

        MeteringPointFactory factory = previewView.getMeteringPointFactory();
        MeteringPoint        point   = factory.createPoint(x, y);
        FocusMeteringAction  action  = new FocusMeteringAction.Builder(
                point, FocusMeteringAction.FLAG_AF | FocusMeteringAction.FLAG_AE)
                .setAutoCancelDuration(3, TimeUnit.SECONDS)
                .build();
        camera.getCameraControl().startFocusAndMetering(action);
    }

    // ─────────────────────────────────────────────────────────────
    // PINCH TO ZOOM
    // ─────────────────────────────────────────────────────────────

    private class PinchZoomListener
            extends ScaleGestureDetector.SimpleOnScaleGestureListener {
        @Override
        public boolean onScale(ScaleGestureDetector detector) {
            if (camera == null) return true;
            ZoomState s = camera.getCameraInfo().getZoomState().getValue();
            if (s == null) return true;
            float newZoom = Math.max(
                    s.getMinZoomRatio(),
                    Math.min(currentZoomRatio * detector.getScaleFactor(),
                            s.getMaxZoomRatio()));
            camera.getCameraControl().setZoomRatio(newZoom);
            return true;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // FLASH
    // ─────────────────────────────────────────────────────────────

    private void toggleFlash() {
        if (camera == null) return;
        isFlashOn = !isFlashOn;
        camera.getCameraControl().enableTorch(isFlashOn);
        setFlashIcon(isFlashOn);
    }

    private void setFlashIcon(boolean on) {
        btnFlash.setImageResource(on ? R.drawable.ic_flash_on : R.drawable.ic_flash_off);
        btnFlash.setColorFilter(
                on ? Color.parseColor("#FFD600") : Color.WHITE,
                PorterDuff.Mode.SRC_IN);
    }

    // ─────────────────────────────────────────────────────────────
    // CAPTURE
    // ─────────────────────────────────────────────────────────────

    private void takePhoto() {
        if (imageCapture == null || isCapturing) return;
        isCapturing = true;
        btnCapture.setAlpha(0.5f);

        File dir = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                ? new File(getExternalFilesDir(Environment.DIRECTORY_PICTURES), "MyApp")
                : new File(Environment.getExternalStoragePublicDirectory(
                        Environment.DIRECTORY_PICTURES), "MyApp");

        if (!dir.exists() && !dir.mkdirs()) {
            Toast.makeText(this, "Gagal membuat folder", Toast.LENGTH_SHORT).show();
            resetCapture();
            return;
        }

        String ts       = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date());
        String fileName = "IMG_" + ts + ".jpg";
        photoFile = new File(dir, fileName);

        imageCapture.takePicture(
                new ImageCapture.OutputFileOptions.Builder(photoFile).build(),
                executor,
                new ImageCapture.OnImageSavedCallback() {
                    @Override
                    public void onImageSaved(@NonNull ImageCapture.OutputFileResults r) {
                        if (!photoFile.exists() || photoFile.length() == 0) {
                            runOnUiThread(() -> {
                                Toast.makeText(CameraXActivity.this,
                                        "Gagal menyimpan", Toast.LENGTH_SHORT).show();
                                resetCapture();
                            });
                            return;
                        }

                        // Crop jika mode 1:1
                        if ("1:1".equals(chosenAspectRatio)) {
                            File croppedFile = cropToSquare(photoFile, dir, ts);
                            if (croppedFile != null) {
                                photoFile.delete();
                                photoFile = croppedFile;
                            }
                        }

                        runOnUiThread(() -> {
                            Intent out = new Intent();
                            out.putExtra("photoPath", photoFile.getAbsolutePath());
                            out.putExtra("itemId",    itemId);
                            out.putExtra("itemName",  itemName);
                            if (isFlexibleMode) {
                                out.putExtra("selectedAspectRatio", chosenAspectRatio);
                            }
                            setResult(RESULT_OK, out);
                            finish();
                        });
                    }

                    @Override
                    public void onError(@NonNull ImageCaptureException e) {
                        runOnUiThread(() -> {
                            Toast.makeText(CameraXActivity.this,
                                    "Error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                            resetCapture();
                        });
                    }
                });
    }

    // ─────────────────────────────────────────────────────────────
    // CROP TO SQUARE  (WYSIWYG)
    // ─────────────────────────────────────────────────────────────

    private File cropToSquare(File original, File dir, String timestamp) {
        try {
            ExifInterface exif = new ExifInterface(original.getAbsolutePath());
            int exifOri = exif.getAttributeInt(
                    ExifInterface.TAG_ORIENTATION,
                    ExifInterface.ORIENTATION_NORMAL);

            Bitmap bitmap = BitmapFactory.decodeFile(original.getAbsolutePath());
            if (bitmap == null) return null;

            bitmap = rotateBitmapByExif(bitmap, exifOri);

            int bmpW = bitmap.getWidth();
            int bmpH = bitmap.getHeight();

            int cropX = 0;
            int cropY = (int)(bmpH / 8f);   // 12.5% dari atas — sesuai overlay
            int cropW = bmpW;
            int cropH = bmpW;

            if (cropY < 0) cropY = 0;
            if (cropY + cropH > bmpH) cropH = bmpH - cropY;
            if (cropH <= 0 || cropW <= 0) { bitmap.recycle(); return null; }

            Bitmap cropped = Bitmap.createBitmap(bitmap, cropX, cropY, cropW, cropH);
            bitmap.recycle();

            File outFile = new File(dir, "IMG_" + timestamp + "_sq.jpg");
            try (FileOutputStream fos = new FileOutputStream(outFile)) {
                cropped.compress(Bitmap.CompressFormat.JPEG, 92, fos);
            }
            cropped.recycle();
            return outFile;

        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // ROTASI BITMAP BERDASARKAN EXIF
    // ─────────────────────────────────────────────────────────────

    private Bitmap rotateBitmapByExif(Bitmap bitmap, int exifOrientation) {
        Matrix matrix = new Matrix();
        switch (exifOrientation) {
            case ExifInterface.ORIENTATION_ROTATE_90:       matrix.postRotate(90);   break;
            case ExifInterface.ORIENTATION_ROTATE_180:      matrix.postRotate(180);  break;
            case ExifInterface.ORIENTATION_ROTATE_270:      matrix.postRotate(270);  break;
            case ExifInterface.ORIENTATION_FLIP_HORIZONTAL: matrix.postScale(-1, 1); break;
            case ExifInterface.ORIENTATION_FLIP_VERTICAL:   matrix.postScale(1, -1); break;
            default: return bitmap;
        }
        Bitmap rotated = Bitmap.createBitmap(
                bitmap, 0, 0, bitmap.getWidth(), bitmap.getHeight(), matrix, true);
        bitmap.recycle();
        return rotated;
    }

    private void resetCapture() {
        isCapturing = false;
        btnCapture.setAlpha(1f);
    }

    // ─────────────────────────────────────────────────────────────
    // PERMISSIONS
    // ─────────────────────────────────────────────────────────────

    private boolean allPermissionsGranted() {
        String[] perms = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                ? REQUIRED_PERMISSIONS_33 : REQUIRED_PERMISSIONS;
        for (String p : perms)
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED)
                return false;
        return true;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode,
                                           @NonNull String[] permissions,
                                           @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != REQUEST_CODE_PERMISSIONS) return;
        boolean ok = true;
        for (int r : grantResults)
            if (r != PackageManager.PERMISSION_GRANTED) { ok = false; break; }
        if (ok) startCamera();
        else {
            Toast.makeText(this, "Izin kamera diperlukan", Toast.LENGTH_LONG).show();
            setResult(RESULT_CANCELED);
            finish();
        }
    }

    // ─────────────────────────────────────────────────────────────
    // CLEANUP FOTO LAMA (> 14 hari)
    // ─────────────────────────────────────────────────────────────

    private void cleanupOldPhotos() {
        Executors.newSingleThreadExecutor().execute(() -> {
            File dir = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                    ? new File(getExternalFilesDir(Environment.DIRECTORY_PICTURES), "MyApp")
                    : new File(Environment.getExternalStoragePublicDirectory(
                            Environment.DIRECTORY_PICTURES), "MyApp");

            if (!dir.exists()) return;
            File[] files = dir.listFiles();
            if (files == null) return;

            long cutoffTime = System.currentTimeMillis() - (14L * 24 * 60 * 60 * 1000);

            for (File file : files) {
                if (file.isFile() && file.lastModified() < cutoffTime) {
                    file.delete();
                }
            }
        });
    }
}