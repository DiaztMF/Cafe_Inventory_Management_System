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
            ->with(['cashier', 'user', 'details.product'])
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
        return response()->json($transaction->load(['cashier', 'user', 'details.product']));
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

    /**
     * Update order status from admin dashboard.
     */
    public function updateStatus(Request $request, Transaction $transaction): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:pending,waiting_payment,paid,processing,completed,cancelled'],
        ]);

        $previousStatus = $transaction->status;
        $newStatus = $validated['status'];

        $transaction->update([
            'status' => $newStatus,
        ]);

        // If marking as paid (cash payment confirmed by admin)
        if ($newStatus === Transaction::STATUS_PAID && $previousStatus !== Transaction::STATUS_PAID) {
            $transaction->update([
                'paid_at' => now(),
            ]);
        }

        // Restore stock if cancelled
        if ($newStatus === Transaction::STATUS_CANCELLED && $previousStatus !== Transaction::STATUS_CANCELLED) {
            foreach ($transaction->details as $detail) {
                $detail->product->increment('stock', $detail->qty);
            }
        }

        return response()->json($transaction->fresh()->load(['cashier', 'user', 'details.product']));
    }
}
