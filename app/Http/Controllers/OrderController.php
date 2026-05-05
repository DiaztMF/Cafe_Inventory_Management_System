<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
                'cashier_id' => null,
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
}
