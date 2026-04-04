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
        $currentCalled = $this->queueService->getCurrentCalled();
        $nextWaiting = $this->queueService->getNextWaiting(5);
        $stats = $this->queueService->getTodayStats();

        return response()->json([
            'success' => true,
            'data' => [
                'current' => $currentCalled ? [
                    'queue_id' => $currentCalled->id,
                    'queue_number' => $currentCalled->formatted_number,
                    'counter_number' => $currentCalled->counter_number,
                    'counter_name' => $currentCalled->counter?->name,
                    'service_name' => $currentCalled->service->name,
                    'visitor_name' => $currentCalled->visitor->name,
                    'called_at' => $currentCalled->called_at?->format('H:i'),
                    'called_at_timestamp' => $currentCalled->called_at?->timestamp,
                ] : null,
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