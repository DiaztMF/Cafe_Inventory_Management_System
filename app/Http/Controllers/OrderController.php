<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\User;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    /**
     * Get menu products for the landing page.
     */
    public function menu(): JsonResponse
    {
        $products = Product::query()
            ->with('category')
            ->where('stock', '>', 0)
            ->latest()
            ->get();

        return response()->json($products);
    }

    /**
     * Show the checkout page for a given transaction.
     */
    public function checkout(Transaction $transaction): Response
    {
        /** @var User|null $user */
        $user = request()->user();

        if (! $user || $transaction->user_id !== $user->id) {
            abort(403);
        }

        if ($transaction->status !== Transaction::STATUS_PENDING) {
            abort(403, 'Order sudah diproses.');
        }

        $transaction->load('details.product');

        return Inertia::render('checkout', [
            'transaction' => $transaction,
            'midtransClientKey' => MidtransService::getClientKey(),
        ]);
    }

    /**
     * Place a customer order (creates transaction + details).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.qty' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        return DB::transaction(function () use ($validated, $request): JsonResponse {
            $totalPrice = 0;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                $product = Product::query()->findOrFail($item['product_id']);

                if ($product->stock < $item['qty']) {
                    abort(422, "Insufficient stock for {$product->name}. Available: {$product->stock}");
                }

                $subtotal = $product->price * $item['qty'];
                $totalPrice += $subtotal;

                $itemsData[] = [
                    'product' => $product,
                    'qty' => $item['qty'],
                ];
            }

            /** @var User $user */
            $user = $request->user();

            $transaction = Transaction::query()->create([
                'total_price' => $totalPrice,
                'buyer_name' => $user->name,
                'user_id' => $user->id,
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
     * Process payment for a transaction.
     */
    public function pay(Request $request, Transaction $transaction): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($transaction->user_id !== $user->id) {
            abort(403);
        }

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
     * Handle Midtrans webhook notifications.
     */
    public function midtransCallback(Request $request): JsonResponse
    {
        $serverKey = config('midtrans.server_key');
        $payload = $request->all();

        $orderId = $payload['order_id'] ?? null;
        $statusCode = $payload['status_code'] ?? null;
        $grossAmount = $payload['gross_amount'] ?? null;
        $transactionStatus = $payload['transaction_status'] ?? null;
        $fraudStatus = $payload['fraud_status'] ?? null;

        $signatureKey = hash('sha512', $orderId.$statusCode.$grossAmount.$serverKey);

        if ($signatureKey !== ($payload['signature_key'] ?? '')) {
            Log::warning('Midtrans callback: invalid signature', ['order_id' => $orderId]);

            return response()->json(['message' => 'Invalid signature'], 403);
        }

        $transaction = Transaction::query()
            ->where('midtrans_order_id', $orderId)
            ->first();

        if (! $transaction) {
            Log::warning('Midtrans callback: transaction not found', ['order_id' => $orderId]);

            return response()->json(['message' => 'Transaction not found'], 404);
        }

        if ($transactionStatus === 'capture' || $transactionStatus === 'settlement') {
            if ($fraudStatus === 'accept' || $fraudStatus === null) {
                $transaction->update([
                    'status' => Transaction::STATUS_PAID,
                    'paid_at' => now(),
                ]);
            }
        } elseif (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
            $transaction->update([
                'status' => Transaction::STATUS_CANCELLED,
            ]);

            // Restore stock on cancellation
            foreach ($transaction->details as $detail) {
                $detail->product->increment('stock', $detail->qty);
            }
        } elseif ($transactionStatus === 'pending') {
            $transaction->update([
                'status' => Transaction::STATUS_WAITING_PAYMENT,
            ]);
        }

        Log::info('Midtrans callback processed', [
            'order_id' => $orderId,
            'status' => $transactionStatus,
        ]);

        return response()->json(['message' => 'OK']);
    }

    /**
     * Check payment status of a transaction (for polling from frontend).
     */
    public function status(Transaction $transaction): JsonResponse
    {
        /** @var User|null $user */
        $user = request()->user();

        if (! $user || $transaction->user_id !== $user->id) {
            abort(403);
        }

        return response()->json([
            'status' => $transaction->status,
            'payment_method' => $transaction->payment_method,
            'paid_at' => $transaction->paid_at?->toISOString(),
        ]);
    }
}
