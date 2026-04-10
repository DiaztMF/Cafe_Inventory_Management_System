<?php

namespace App\Http\Controllers;

use App\Models\TransactionDetail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionDetailController extends Controller
{
    public function index(): JsonResponse
    {
        $details = TransactionDetail::query()
            ->with(['transaction', 'product'])
            ->latest()
            ->get();

        return response()->json($details);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'transaction_id' => ['required', 'integer', 'exists:transactions,id'],
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'qty' => ['required', 'integer', 'min:1'],
        ]);

        $detail = TransactionDetail::query()->create($validated);

        return response()->json($detail, 201);
    }

    public function show(TransactionDetail $transactionDetail): JsonResponse
    {
        return response()->json($transactionDetail->load(['transaction', 'product']));
    }

    public function update(Request $request, TransactionDetail $transactionDetail): JsonResponse
    {
        $validated = $request->validate([
            'transaction_id' => ['required', 'integer', 'exists:transactions,id'],
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'qty' => ['required', 'integer', 'min:1'],
        ]);

        $transactionDetail->update($validated);

        return response()->json($transactionDetail);
    }

    public function destroy(TransactionDetail $transactionDetail): JsonResponse
    {
        $transactionDetail->delete();

        return response()->json(null, 204);
    }
}
