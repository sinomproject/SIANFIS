<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Queue;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class StaffController extends Controller
{
    /**
     * Change own password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required',
            'new_password'     => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Password lama tidak cocok.'], 422);
        }

        $user->update(['password' => Hash::make($request->new_password)]);

        return response()->json(['success' => true, 'message' => 'Password berhasil diubah']);
    }

    /**
     * Daily queue stats for last 7 days (staff sees own counter only).
     */
    public function dailyStats(Request $request): JsonResponse
    {
        $user      = $request->user();
        $counterId = $user->isStaff() ? $user->counter_id : null;

        $days = collect(range(6, 0))->map(function ($offset) use ($counterId) {
            $date  = Carbon::today()->subDays($offset);
            $query = Queue::whereDate('queue_date', $date);
            if ($counterId) {
                $query->where('counter_id', $counterId);
            }
            return [
                'date'  => $date->format('Y-m-d'),
                'label' => $date->locale('id')->isoFormat('ddd D/M'),
                'total' => $query->count(),
                'done'  => (clone $query)->where('status', 'done')->count(),
            ];
        });

        return response()->json(['success' => true, 'data' => $days]);
    }

    /**
     * Export report as CSV (staff sees own counter only).
     */
    public function exportReport(Request $request): \Illuminate\Http\Response
    {
        $user      = $request->user();
        $counterId = $user->isStaff() ? $user->counter_id : null;

        $query = Queue::with(['visitor', 'service', 'counter'])
            ->orderBy('queue_date', 'desc')
            ->orderBy('called_at', 'desc');

        if ($counterId) {
            $query->where('counter_id', $counterId);
        }

        if ($request->filled('start_date')) {
            $query->where('queue_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->where('queue_date', '<=', $request->end_date);
        }

        $queues = $query->limit(2000)->get();

        $header = ['No', 'Tanggal', 'No Antrian', 'Jam Dipanggil', 'Nama', 'Keperluan', 'Instansi', 'Loket', 'Status'];
        $rows   = [];
        foreach ($queues as $i => $q) {
            $rows[] = [
                $i + 1,
                $q->queue_date?->format('Y-m-d'),
                $q->formatted_number,
                $q->called_at?->format('H:i') ?? '-',
                $q->visitor->name,
                $q->visitor->purpose,
                $q->visitor->agency ?? '-',
                $q->counter?->name ?? '-',
                $q->status,
            ];
        }

        $csv = implode(',', array_map(fn($h) => '"' . $h . '"', $header)) . "\n";
        foreach ($rows as $row) {
            $csv .= implode(',', array_map(fn($v) => '"' . str_replace('"', '""', $v) . '"', $row)) . "\n";
        }

        $filename = 'laporan-antrian-' . now()->format('Ymd-His') . '.csv';

        return response($csv, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
