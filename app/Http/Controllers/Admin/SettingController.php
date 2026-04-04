<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SettingController extends Controller
{
    /**
     * Get all location settings
     */
    public function getLocationSettings()
    {
        try {
            $settings = [
                'office_latitude' => Setting::get('office_latitude', '-5.411118'),
                'office_longitude' => Setting::get('office_longitude', '105.294829'),
                'max_distance' => Setting::get('max_distance', '10000'),
                'office_name' => Setting::get('office_name', 'Kantor FISIPOL UMA'),
            ];

            return response()->json([
                'success' => true,
                'data' => $settings
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil pengaturan lokasi',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all app settings (title, logo, etc)
     */
    public function getAppSettings()
    {
        try {
            $settings = [
                'app_title' => Setting::get('app_title', 'SIANFIS - Sistem Informasi Antrian Fisipol'),
                'app_subtitle' => Setting::get('app_subtitle', 'Buku Tamu Digital'),
                'logo_left' => Setting::get('logo_left', '/assets/LOGO_UMA.png'),
                'logo_right' => Setting::get('logo_right', '/assets/unggul.png'),
                'youtube_playlist_url' => Setting::get('youtube_playlist_url', ''),
            ];

            return response()->json([
                'success' => true,
                'data' => $settings
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil pengaturan aplikasi',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update app settings (Admin only)
     */
    public function updateAppSettings(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'app_title' => 'required|string|max:255',
            'app_subtitle' => 'required|string|max:255',
            'logo_left' => 'nullable|string|max:500',
            'logo_right' => 'nullable|string|max:500',
            'youtube_playlist_url' => 'nullable|string|max:500',
        ], [
            'app_title.required' => 'Judul aplikasi wajib diisi',
            'app_title.max' => 'Judul aplikasi maksimal 255 karakter',
            'app_subtitle.required' => 'Subjudul aplikasi wajib diisi',
            'app_subtitle.max' => 'Subjudul aplikasi maksimal 255 karakter',
            'logo_left.max' => 'Path logo kiri maksimal 500 karakter',
            'logo_right.max' => 'Path logo kanan maksimal 500 karakter',
            'youtube_playlist_url.max' => 'URL YouTube Playlist maksimal 500 karakter',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            Setting::set('app_title', $request->app_title);
            Setting::set('app_subtitle', $request->app_subtitle);

            if ($request->has('logo_left')) {
                Setting::set('logo_left', $request->logo_left);
            }

            if ($request->has('logo_right')) {
                Setting::set('logo_right', $request->logo_right);
            }

            if ($request->has('youtube_playlist_url')) {
                Setting::set('youtube_playlist_url', $request->youtube_playlist_url);
            }

            return response()->json([
                'success' => true,
                'message' => 'Pengaturan aplikasi berhasil disimpan',
                'data' => [
                    'app_title' => $request->app_title,
                    'app_subtitle' => $request->app_subtitle,
                    'logo_left' => $request->logo_left,
                    'logo_right' => $request->logo_right,
                    'youtube_playlist_url' => $request->youtube_playlist_url,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan pengaturan aplikasi',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get audio settings
     */
    public function getAudioSettings()
    {
        try {
            $settings = [
                'voice_volume' => Setting::get('voice_volume', '1.0'),
                'voice_rate' => Setting::get('voice_rate', '0.9'),
                'voice_pitch' => Setting::get('voice_pitch', '1.0'),
                'voice_repeat' => Setting::get('voice_repeat', '2'),
                'voice_language' => Setting::get('voice_language', 'id-ID'),
                'voice_template' => Setting::get('voice_template', 'Nomor antrian {nomor_antrian}. Silakan menuju loket {nomor_loket}, {nama_loket}'),
            ];

            return response()->json([
                'success' => true,
                'data' => $settings
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil pengaturan audio',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update audio settings (Admin only)
     */
    public function updateAudioSettings(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'voice_volume' => 'required|numeric|min:0|max:1',
            'voice_rate' => 'required|numeric|min:0.1|max:2',
            'voice_pitch' => 'required|numeric|min:0|max:2',
            'voice_repeat' => 'required|integer|min:1|max:5',
            'voice_language' => 'required|string|max:10',
            'voice_template' => 'required|string|max:500',
        ], [
            'voice_volume.required' => 'Volume wajib diisi',
            'voice_volume.min' => 'Volume minimal 0',
            'voice_volume.max' => 'Volume maksimal 1',
            'voice_rate.required' => 'Kecepatan bicara wajib diisi',
            'voice_rate.min' => 'Kecepatan minimal 0.1',
            'voice_rate.max' => 'Kecepatan maksimal 2',
            'voice_pitch.required' => 'Nada suara wajib diisi',
            'voice_pitch.min' => 'Nada minimal 0',
            'voice_pitch.max' => 'Nada maksimal 2',
            'voice_repeat.required' => 'Jumlah pengulangan wajib diisi',
            'voice_repeat.min' => 'Pengulangan minimal 1 kali',
            'voice_repeat.max' => 'Pengulangan maksimal 5 kali',
            'voice_language.required' => 'Bahasa wajib diisi',
            'voice_template.required' => 'Template suara wajib diisi',
            'voice_template.max' => 'Template suara maksimal 500 karakter',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            Setting::set('voice_volume', $request->voice_volume);
            Setting::set('voice_rate', $request->voice_rate);
            Setting::set('voice_pitch', $request->voice_pitch);
            Setting::set('voice_repeat', $request->voice_repeat);
            Setting::set('voice_language', $request->voice_language);
            Setting::set('voice_template', $request->voice_template);

            return response()->json([
                'success' => true,
                'message' => 'Pengaturan audio berhasil disimpan',
                'data' => [
                    'voice_volume' => $request->voice_volume,
                    'voice_rate' => $request->voice_rate,
                    'voice_pitch' => $request->voice_pitch,
                    'voice_repeat' => $request->voice_repeat,
                    'voice_language' => $request->voice_language,
                    'voice_template' => $request->voice_template,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan pengaturan audio',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update location settings (Admin only)
     */
    public function updateLocationSettings(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'office_latitude' => 'required|numeric|between:-90,90',
            'office_longitude' => 'required|numeric|between:-180,180',
            'max_distance' => 'required|integer|min:100|max:50000',
            'office_name' => 'required|string|max:255',
        ], [
            'office_latitude.required' => 'Latitude kantor wajib diisi',
            'office_latitude.numeric' => 'Latitude harus berupa angka',
            'office_latitude.between' => 'Latitude harus antara -90 sampai 90',
            'office_longitude.required' => 'Longitude kantor wajib diisi',
            'office_longitude.numeric' => 'Longitude harus berupa angka',
            'office_longitude.between' => 'Longitude harus antara -180 sampai 180',
            'max_distance.required' => 'Jarak maksimum wajib diisi',
            'max_distance.integer' => 'Jarak maksimum harus berupa angka bulat',
            'max_distance.min' => 'Jarak maksimum minimal 100 meter',
            'max_distance.max' => 'Jarak maksimum maksimal 50 km (50000 meter)',
            'office_name.required' => 'Nama kantor wajib diisi',
            'office_name.max' => 'Nama kantor maksimal 255 karakter',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            Setting::set('office_latitude', $request->office_latitude);
            Setting::set('office_longitude', $request->office_longitude);
            Setting::set('max_distance', $request->max_distance);
            Setting::set('office_name', $request->office_name);

            return response()->json([
                'success' => true,
                'message' => 'Pengaturan lokasi berhasil disimpan',
                'data' => [
                    'office_latitude' => $request->office_latitude,
                    'office_longitude' => $request->office_longitude,
                    'max_distance' => $request->max_distance,
                    'office_name' => $request->office_name,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan pengaturan lokasi',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
