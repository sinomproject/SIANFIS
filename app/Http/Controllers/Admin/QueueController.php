<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\QueueService;
use App\Models\Queue;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class QueueController extends Controller
{
    protected QueueService $queueService;

    public function __construct(QueueService $queueService)
    {
        $this->queueService = $queueService;
    }

    /**
     * Get today's queues.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Queue::with(['visitor', 'service'])
            ->today();

        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Filter by service
        if ($request->has('service_id') && $request->service_id) {
            $query->where('service_id', $request->service_id);
        }

        $queues = $query->orderBy('queue_number')->get();

        return response()->json([
            'success' => true,
            'data' => $queues->map(function ($queue) {
                return [
                'id' => $queue->id,
                    'queue_number' => $queue->formatted_number,
                    'ticket_code' => $queue->ticket_code,
                    'status' => $queue->status,
                    'counter_number' => $queue->counter_number,
                    'counter_name' => $queue->counter?->name,
                    'called_at' => $queue->called_at?->format('H:i'),
                    'finished_at' => $queue->finished_at?->format('H:i'),
                    'created_at' => $queue->created_at->format('H:i'),
                    'visitor' => [
                        'name' => $queue->visitor->name,
                        'phone' => $queue->visitor->phone,
                        'agency' => $queue->visitor->agency,
                        'alamat' => $queue->visitor->alamat,
                        'purpose' => $queue->visitor->purpose,
                        'photo' => $queue->visitor->photo,
                        'identity_photo' => $queue->visitor->identity_photo,
                        'location_lat' => $queue->visitor->location_lat,
                        'location_lng' => $queue->visitor->location_lng,
                    ],
                    'service' => [
                        'id' => $queue->service->id,
                        'name' => $queue->service->name,
                        'prefix' => $queue->service->prefix,
                    ],
                ];
            }),
        ]);
    }

    /**
     * Call a queue.
     */
    public function call(Request $request): JsonResponse
    {
        $request->validate([
            'queue_id' => 'required|exists:queues,id',
            'counter_number' => 'required|integer|min:1',
        ]);

        try {
            $queue = $this->queueService->callQueue(
                $request->queue_id,
                $request->counter_number
            );

            // Generate audio TTS jika file belum ada
            $this->generateTtsIfNeeded(
                $queue->formatted_number,
                $queue->counter_number
            );

            return response()->json([
                'success' => true,
                'message' => 'Antrian berhasil dipanggil',
                'data' => [
                    'queue_id' => $queue->id,
                    'queue_number' => $queue->formatted_number,
                    'counter_number' => $queue->counter_number,
                    'visitor_name' => $queue->visitor->name,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memanggil antrian',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate TTS audio untuk antrian jika file belum ada.
     * Tidak memblok response jika gagal.
     */
    private function generateTtsIfNeeded(string $kode, int $loket): void
    {
        $filename = "{$kode}_loket{$loket}.mp3";
        $path     = storage_path("app/public/audio/{$filename}");

        if (file_exists($path)) {
            return;
        }

        // Pastikan direktori ada
        $dir = storage_path('app/public/audio');
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $python = PHP_OS_FAMILY === 'Windows' ? 'python' : 'python3';
        $script = base_path('generate_tts.py');

        $cmd = sprintf(
            '%s %s %s %s',
            escapeshellcmd($python),
            escapeshellarg($script),
            escapeshellarg($kode),
            escapeshellarg((string) $loket)
        );

        exec($cmd . ' 2>&1', $output, $exitCode);

        if ($exitCode !== 0) {
            \Log::warning('[TTS] Gagal generate audio antrian', [
                'kode'      => $kode,
                'loket'     => $loket,
                'cmd'       => $cmd,
                'output'    => implode("\n", $output),
                'exit_code' => $exitCode,
            ]);
        }
    }

    /**
     * Mark queue as done.
     */
    public function done(int $id): JsonResponse
    {
        try {
            $queue = $this->queueService->doneQueue($id);

            return response()->json([
                'success' => true,
                'message' => 'Antrian selesai',
                'data' => [
                    'queue_id' => $queue->id,
                    'queue_number' => $queue->formatted_number,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyelesaikan antrian',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Skip a queue.
     */
    public function skip(int $id): JsonResponse
    {
        try {
            $queue = $this->queueService->skipQueue($id);

            return response()->json([
                'success' => true,
                'message' => 'Antrian dilewati',
                'data' => [
                    'queue_id' => $queue->id,
                    'queue_number' => $queue->formatted_number,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal melewatkan antrian',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Recall a queue.
     */
    public function recall(int $id): JsonResponse
    {
        try {
            $queue = $this->queueService->recallQueue($id);

            return response()->json([
                'success' => true,
                'message' => 'Antrian dikembalikan ke waiting',
                'data' => [
                    'queue_id' => $queue->id,
                    'queue_number' => $queue->formatted_number,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal recall antrian',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get dashboard stats.
     */
    public function stats(): JsonResponse
    {
        $stats = $this->queueService->getTodayStats();
        $services = Service::active()->get();

        $serviceStats = $services->map(function ($service) {
            return [
                'id' => $service->id,
                'name' => $service->name,
                'prefix' => $service->prefix,
                'waiting' => Queue::today()->waiting()->where('service_id', $service->id)->count(),
                'called' => Queue::today()->called()->where('service_id', $service->id)->count(),
                'done' => Queue::today()->done()->where('service_id', $service->id)->count(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $stats,
                'by_service' => $serviceStats,
            ],
        ]);
    }

    /**
     * Get queue history with filters.
     */
    public function history(Request $request): JsonResponse
    {
        $query = Queue::with(['visitor', 'service']);

        // Filter by date range
        if ($request->has('start_date') && $request->start_date) {
            $query->where('queue_date', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->where('queue_date', '<=', $request->end_date);
        }

        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Filter by service
        if ($request->has('service_id') && $request->service_id) {
            $query->where('service_id', $request->service_id);
        }

        // Search by name or ticket code
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('visitor', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            })->orWhere('ticket_code', 'like', "%{$search}%");
        }

        $queues = $query->orderBy('queue_date', 'desc')
            ->orderBy('queue_number', 'desc')
            ->limit(500)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $queues->map(function ($queue) {
                return [
                    'id' => $queue->id,
                    'queue_number' => $queue->formatted_number,
                    'ticket_code' => $queue->ticket_code,
                    'status' => $queue->status,
                    'counter_number' => $queue->counter_number,
                    'queue_date' => $queue->queue_date->format('Y-m-d'),
                    'called_at' => $queue->called_at?->format('H:i'),
                    'finished_at' => $queue->finished_at?->format('H:i'),
                    'created_at' => $queue->created_at->format('H:i'),
                    'visitor' => [
                        'name' => $queue->visitor->name,
                        'phone' => $queue->visitor->phone,
                        'agency' => $queue->visitor->agency,
                        'alamat' => $queue->visitor->alamat,
                        'purpose' => $queue->visitor->purpose,
                    ],
                    'service' => [
                        'id' => $queue->service->id,
                        'name' => $queue->service->name,
                        'prefix' => $queue->service->prefix,
                    ],
                ];
            }),
        ]);
    }
}