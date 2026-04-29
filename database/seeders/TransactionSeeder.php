<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $cashier = User::query()
            ->where('email', 'kasir@cafe.test')
            ->firstOrFail();

        $orders = [
            [
                'buyer_name' => 'Budi Santoso',
                'items' => [
                    ['product' => 'Latte', 'qty' => 1],
                    ['product' => 'French Fries', 'qty' => 1],
                    ['product' => 'Mineral Water', 'qty' => 1],
                ],
            ],
            [
                'buyer_name' => 'Siti Aminah',
                'items' => [
                    ['product' => 'Espresso', 'qty' => 2],
                    ['product' => 'Chocolate Milk', 'qty' => 1],
                ],
            ],
        ];

        foreach ($orders as $order) {
            DB::transaction(function () use ($cashier, $order): void {
                $transaction = Transaction::query()->create([
                    'buyer_name' => $order['buyer_name'],
                    'cashier_id' => $cashier->id,
                    'total_price' => 0,
                ]);

                $totalPrice = 0;

                foreach ($order['items'] as $item) {
                    $product = Product::query()
                        ->where('name', $item['product'])
                        ->firstOrFail();

                    $transaction->details()->create([
                        'product_id' => $product->id,
                        'qty' => $item['qty'],
                    ]);

                    $totalPrice += $product->price * $item['qty'];
                }

                $transaction->update([
                    'total_price' => $totalPrice,
                ]);
            });
        }
    }
}