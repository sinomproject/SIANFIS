<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login admin.
     */
    public function login(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);
        } catch (ValidationException $e) {
            \Log::info('Login validation failed', $e->errors());
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        }

        $email = trim($request->email);
        $password = $request->password;
        
        \Log::info('Login attempt', ['email' => $email, 'password_length' => strlen($password)]);

        $user = User::where('email', $email)->first();

        if (!$user) {
            \Log::info('User not found', ['email' => $email]);
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah',
            ], 401);
        }

        \Log::info('User found', ['id' => $user->id, 'email' => $user->email, 'role' => $user->role]);

        if (!Hash::check($password, $user->password)) {
            \Log::info('Password check failed');
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah',
            ], 401);
        }
        
        \Log::info('Password check passed');

        if (!$user->isAdmin() && !$user->isStaff()) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak.',
            ], 403);
        }

        $token = $user->createToken('admin-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data' => [
                'user' => [
                    'id'           => $user->id,
                    'name'         => $user->name,
                    'email'        => $user->email,
                    'role'         => $user->role,
                    'counter_id'   => $user->counter_id,
                    'counter_name' => $user->counter?->name,
                ],
                'token' => $token,
            ],
        ]);
    }

    /**
     * Logout admin.
     */
    public function logout(Request $request): JsonResponse
    {
        /** @var \Laravel\Sanctum\PersonalAccessToken $token */
        $token = $request->user()->currentAccessToken();
        $token->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil',
        ]);
    }

    /**
     * Get current authenticated admin.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('counter');
        return response()->json([
            'success' => true,
            'data' => [
                'id'           => $user->id,
                'name'         => $user->name,
                'email'        => $user->email,
                'role'         => $user->role,
                'counter_id'   => $user->counter_id,
                'counter_name' => $user->counter?->name,
            ],
        ]);
    }
}