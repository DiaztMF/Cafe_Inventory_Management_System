<?php

namespace App\Services;

use App\Models\Transaction;
use Midtrans\Config;
use Midtrans\Snap;

class MidtransService
{
    public function __construct()
    {
        Config::$serverKey = config('midtrans.server_key');
        Config::$clientKey = config('midtrans.client_key');
        Config::$isProduction = config('midtrans.is_production');
        Config::$isSanitized = config('midtrans.is_sanitized');
        Config::$is3ds = config('midtrans.is_3ds');
    }

    /**
     * Generate a Midtrans Snap token and redirect URL for the given transaction.
     *
     * @return array{token: string, redirect_url: string}
     */
    public function createSnapToken(Transaction $transaction): array
    {
        $orderId = 'LUNAR-' . $transaction->id . '-' . time();

        $transaction->update([
            'midtrans_order_id' => $orderId,
        ]);

        $itemDetails = [];
        $transaction->loadMissing('details.product');

        foreach ($transaction->details as $detail) {
            $itemDetails[] = [
                'id' => (string) $detail->product_id,
                'price' => (int) $detail->product->price,
                'quantity' => $detail->qty,
                'name' => mb_substr($detail->product->name, 0, 50),
            ];
        }

        $params = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int) $transaction->total_price,
            ],
            'item_details' => $itemDetails,
            'customer_details' => [
                'first_name' => $transaction->buyer_name,
                'email' => $transaction->user?->email ?? 'guest@lunarcoffee.com',
            ],
            'enabled_payments' => ['gopay', 'shopeepay', 'other_qris'],
        ];

        $midtransResponse = Snap::createTransaction($params);
        $snapToken = $midtransResponse->token;
        $redirectUrl = $midtransResponse->redirect_url;

        $transaction->update([
            'midtrans_snap_token' => $snapToken,
            'status' => Transaction::STATUS_WAITING_PAYMENT,
        ]);

        return [
            'token' => $snapToken,
            'redirect_url' => $redirectUrl,
        ];
    }

    /**
     * Get the Midtrans client key for frontend usage.
     */
    public static function getClientKey(): string
    {
        return config('midtrans.client_key', '');
    }
}
