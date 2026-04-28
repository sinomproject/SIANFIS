<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\QueueService;
use Illuminate\Http\JsonResponse;

class DisplayController extends Controller
{
    protected QueueService $queueService;

    public function __construct(QueueService $queueService)
    {
        $this->queueService = $queueService;
    }

    /**
     * Get current display data (for polling).
     */
    public function current(): JsonResponse
    {
        $recentCalled = $this->queueService->getRecentCalled(5);
        $nextWaiting = $this->queueService->getNextWaiting(5);
        $stats = $this->queueService->getTodayStats();

        return response()->json([
            'success' => true,
            'data' => [
                'current' => $recentCalled->map(fn($q) => [
                    'queue_id'           => $q->id,
                    'queue_number'       => $q->formatted_number,
                    'counter_number'     => $q->counter_number,
                    'counter_name'       => $q->counter?->name,
                    'service_name'       => $q->service->name,
                    'visitor_name'       => $q->visitor->name,
                    'called_at'          => $q->called_at?->format('H:i'),
                    'called_at_timestamp'=> $q->called_at?->timestamp,
                ])->values()->all(),
                'next_waiting' => array_map(function ($queue) {
                    return [
                        'queue_id' => $queue['id'],
                        'queue_number' => $queue['service']['prefix'] . '-' . str_pad($queue['queue_number'], 3, '0', STR_PAD_LEFT),
                        'service_name' => $queue['service']['name'],
                    ];
                }, $nextWaiting),
                'stats' => $stats,
            ],
        ]);
    }
}