<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Counter;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * List all users (admin only).
     */
    public function index(Request $request): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $users = User::with('counter')->orderBy('name')->get()->map(fn($u) => [
            'id'           => $u->id,
            'name'         => $u->name,
            'email'        => $u->email,
            'role'         => $u->role,
            'counter_id'   => $u->counter_id,
            'counter_name' => $u->counter?->name,
            'created_at'   => $u->created_at->format('Y-m-d'),
        ]);

        return response()->json(['success' => true, 'data' => $users]);
    }

    /**
     * Create a new user (admin only).
     */
    public function store(Request $request): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|unique:users,email',
            'password'   => 'required|string|min:6',
            'role'       => ['required', Rule::in(['admin', 'staff'])],
            'counter_id' => 'nullable|exists:counters,id',
        ]);

        $user = User::create([
            'name'       => $validated['name'],
            'email'      => $validated['email'],
            'password'   => Hash::make($validated['password']),
            'role'       => $validated['role'],
            'counter_id' => $validated['counter_id'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User berhasil dibuat',
            'data'    => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $user->role],
        ], 201);
    }

    /**
     * Update user (admin only).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name'       => 'sometimes|string|max:255',
            'email'      => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($id)],
            'password'   => 'nullable|string|min:6',
            'role'       => ['sometimes', Rule::in(['admin', 'staff'])],
            'counter_id' => 'nullable|exists:counters,id',
        ]);

        $update = array_filter([
            'name'       => $validated['name'] ?? null,
            'email'      => $validated['email'] ?? null,
            'role'       => $validated['role'] ?? null,
            'counter_id' => array_key_exists('counter_id', $validated) ? $validated['counter_id'] : null,
        ], fn($v) => $v !== null);

        if (!empty($validated['password'])) {
            $update['password'] = Hash::make($validated['password']);
        }

        // Always allow counter_id to be set to null explicitly
        if (array_key_exists('counter_id', $validated)) {
            $update['counter_id'] = $validated['counter_id'];
        }

        $user->update($update);

        return response()->json(['success' => true, 'message' => 'User berhasil diupdate']);
    }

    /**
     * Delete user (admin only, cannot delete self).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        if ($request->user()->id === $id) {
            return response()->json(['success' => false, 'message' => 'Tidak bisa menghapus akun sendiri.'], 422);
        }

        User::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'User berhasil dihapus']);
    }
}
