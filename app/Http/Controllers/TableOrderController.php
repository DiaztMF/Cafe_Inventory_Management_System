<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TableOrderController extends Controller
{
    /**
     * Show the table ordering page (guest-accessible via QR scan).
     */
    public function show(int $tableNumber): Response
    {
        abort_if($tableNumber < 1 || $tableNumber > 50, 404);

        $products = Product::query()
            ->with('category')
            ->where('stock', '>', 0)
            ->latest()
            ->get();

        return Inertia::render('table-order', [
            'tableNumber' => $tableNumber,
            'products' => $products,
        ]);
    }

    /**
     * Place a guest order for a specific table (no auth required).
     */
    public function store(Request $request, int $tableNumber): JsonResponse
    {
        abort_if($tableNumber < 1 || $tableNumber > 50, 404);

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.qty' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        return DB::transaction(function () use ($validated, $tableNumber): JsonResponse {
            $totalPrice = 0;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                $product = Product::query()->findOrFail($item['product_id']);

                if ($product->stock < $item['qty']) {
                    abort(422, "Stok tidak cukup untuk {$product->name}. Tersisa: {$product->stock}");
                }

                $subtotal = $product->price * $item['qty'];
                $totalPrice += $subtotal;

                $itemsData[] = [
                    'product' => $product,
                    'qty' => $item['qty'],
                ];
            }

            $transaction = Transaction::query()->create([
                'total_price' => $totalPrice,
                'buyer_name' => "Meja {$tableNumber}",
                'user_id' => null,
                'cashier_id' => null,
                'status' => Transaction::STATUS_PENDING,
            ]);

            foreach ($itemsData as $data) {
                TransactionDetail::query()->create([
                    'transaction_id' => $transaction->id,
                    'product_id' => $data['product']->id,
                    'qty' => $data['qty'],
                ]);

                $data['product']->decrement('stock', $data['qty']);
            }

            return response()->json(
                $transaction->load('details.product'),
                201,
            );
        });
    }

    /**
     * Process payment for a table guest order.
     */
    public function pay(Request $request, int $tableNumber, Transaction $transaction): JsonResponse
    {
        abort_if($transaction->buyer_name !== "Meja {$tableNumber}", 403);
        abort_if($transaction->status !== Transaction::STATUS_PENDING, 422, 'Transaksi sudah diproses.');

        $validated = $request->validate([
            'payment_method' => ['required', 'string', 'in:qris,cash'],
        ]);

        $paymentMethod = $validated['payment_method'];

        if ($paymentMethod === Transaction::PAYMENT_CASH) {
            $transaction->update([
                'payment_method' => Transaction::PAYMENT_CASH,
                'status' => Transaction::STATUS_WAITING_PAYMENT,
            ]);

            return response()->json([
                'payment_method' => 'cash',
                'message' => 'Pesanan diterima. Silakan bayar di kasir.',
                'transaction' => $transaction->fresh()->load('details.product'),
            ]);
        }

        // QRIS via Midtrans
        $transaction->update([
            'payment_method' => Transaction::PAYMENT_QRIS,
        ]);

        $midtransService = app(MidtransService::class);
        $snapData = $midtransService->createSnapToken($transaction->load('details.product'));

        return response()->json([
            'payment_method' => 'qris',
            'snap_token' => $snapData['token'],
            'redirect_url' => $snapData['redirect_url'],
            'transaction' => $transaction->fresh()->load('details.product'),
        ]);
    }

    /**
     * Check payment status for a table guest order (for polling).
     */
    public function status(int $tableNumber, Transaction $transaction): JsonResponse
    {
        abort_if($transaction->buyer_name !== "Meja {$tableNumber}", 403);

        return response()->json([
            'status' => $transaction->status,
            'payment_method' => $transaction->payment_method,
            'paid_at' => $transaction->paid_at?->toISOString(),
        ]);
    }
}
