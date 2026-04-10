<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(): JsonResponse
    {
        $transactions = Transaction::query()
            ->with(['cashier', 'details.product'])
            ->latest()
            ->get();

        return response()->json($transactions);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'total_price' => ['required', 'numeric', 'min:0'],
            'buyer_name' => ['required', 'string', 'max:255'],
            'cashier_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $transaction = Transaction::query()->create($validated);

        return response()->json($transaction, 201);
    }

    public function show(Transaction $transaction): JsonResponse
    {
        return response()->json($transaction->load(['cashier', 'details.product']));
    }

    public function update(Request $request, Transaction $transaction): JsonResponse
    {
        $validated = $request->validate([
            'total_price' => ['required', 'numeric', 'min:0'],
            'buyer_name' => ['required', 'string', 'max:255'],
            'cashier_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $transaction->update($validated);

        return response()->json($transaction);
    }

    public function destroy(Transaction $transaction): JsonResponse
    {
        $transaction->delete();

        return response()->json(null, 204);
    }
}
