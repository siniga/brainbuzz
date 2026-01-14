<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:15|unique:users',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name' => $validatedData['name'],
            'phone_number' => $validatedData['phone_number'],
            'password' => Hash::make($validatedData['password']),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function login(Request $request)
    {
        // Auth::attempt expects 'password' key to verify against hashed password in DB
        // We pass phone_number and password.
        if (!Auth::attempt($request->only('phone_number', 'password'))) {
            return response()->json([
                'message' => 'Invalid login details'
            ], 401);
        }

        $user = User::where('phone_number', $request['phone_number'])->firstOrFail();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function updateStandard(Request $request)
    {
        $request->validate([
            'standard_id' => 'required|exists:standards,id',
        ]);

        $user = $request->user();
        $user->update(['standard_id' => $request->standard_id]);

        return response()->json(['message' => 'Standard updated successfully', 'user' => $user->load('standard')]);
    }

    public function updateAge(Request $request)
    {
        $request->validate([
            'age' => 'required|integer|min:1|max:120',
        ]);

        $user = $request->user();
        $user->update(['age' => $request->age]);

        return response()->json(['message' => 'Age updated successfully', 'user' => $user]);
    }

    public function updateGender(Request $request)
    {
        $request->validate([
            'gender' => 'required|string|in:Male,Female,Other',
        ]);

        $user = $request->user();
        $user->update(['gender' => $request->gender]);

        return response()->json(['message' => 'Gender updated successfully', 'user' => $user]);
    }
}
