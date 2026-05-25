<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\User;

beforeEach(function () {
    $this->customer = User::factory()->create(['role' => 'customer']);
    $this->admin = User::factory()->admin()->create();

    $category = Category::create(['name' => 'Coffee']);

    $this->product = Product::create([
        'category_id' => $category->id,
        'name' => 'Lunar Latte',
        'price' => 35000,
        'stock' => 10,
    ]);
});

test('customer can place an order', function () {
    $response = $this->actingAs($this->customer)
        ->postJson('/orders', [
            'items' => [
                ['product_id' => $this->product->id, 'qty' => 2],
            ],
        ]);

    $response->assertCreated()
        ->assertJsonPath('buyer_name', $this->customer->name)
        ->assertJsonPath('status', 'pending')
        ->assertJsonPath('total_price', '70000.00');

    $this->assertDatabaseHas('transactions', [
        'user_id' => $this->customer->id,
        'status' => 'pending',
        'total_price' => 70000,
    ]);

    expect($this->product->fresh()->stock)->toBe(8);
});

test('customer can pay with cash', function () {
    $transaction = Transaction::create([
        'total_price' => 35000,
        'buyer_name' => $this->customer->name,
        'user_id' => $this->customer->id,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($this->customer)
        ->postJson("/orders/{$transaction->id}/pay", [
            'payment_method' => 'cash',
        ]);

    $response->assertSuccessful()
        ->assertJsonPath('payment_method', 'cash');

    expect($transaction->fresh())
        ->status->toBe('waiting_payment')
        ->payment_method->toBe('cash');
});

test('customer can view checkout page', function () {
    $transaction = Transaction::create([
        'total_price' => 35000,
        'buyer_name' => $this->customer->name,
        'user_id' => $this->customer->id,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($this->customer)
        ->get("/checkout/{$transaction->id}");

    $response->assertSuccessful();
});

test('customer cannot view checkout for another user order', function () {
    $otherCustomer = User::factory()->create(['role' => 'customer']);

    $transaction = Transaction::create([
        'total_price' => 35000,
        'buyer_name' => $otherCustomer->name,
        'user_id' => $otherCustomer->id,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($this->customer)
        ->get("/checkout/{$transaction->id}");

    $response->assertForbidden();
});

test('customer can check order status', function () {
    $transaction = Transaction::create([
        'total_price' => 35000,
        'buyer_name' => $this->customer->name,
        'user_id' => $this->customer->id,
        'status' => 'waiting_payment',
        'payment_method' => 'cash',
    ]);

    $response = $this->actingAs($this->customer)
        ->getJson("/orders/{$transaction->id}/status");

    $response->assertSuccessful()
        ->assertJsonPath('status', 'waiting_payment')
        ->assertJsonPath('payment_method', 'cash');
});

test('admin can update order status', function () {
    $transaction = Transaction::create([
        'total_price' => 35000,
        'buyer_name' => $this->customer->name,
        'user_id' => $this->customer->id,
        'status' => 'waiting_payment',
        'payment_method' => 'cash',
    ]);

    $response = $this->actingAs($this->admin)
        ->patchJson("/admin/orders/{$transaction->id}/status", [
            'status' => 'paid',
        ]);

    $response->assertSuccessful();

    expect($transaction->fresh())
        ->status->toBe('paid')
        ->paid_at->not->toBeNull();
});

test('admin can mark order as completed', function () {
    $transaction = Transaction::create([
        'total_price' => 35000,
        'buyer_name' => $this->customer->name,
        'user_id' => $this->customer->id,
        'status' => 'paid',
        'payment_method' => 'qris',
    ]);

    $response = $this->actingAs($this->admin)
        ->patchJson("/admin/orders/{$transaction->id}/status", [
            'status' => 'completed',
        ]);

    $response->assertSuccessful();
    expect($transaction->fresh()->status)->toBe('completed');
});

test('cancelling order restores product stock', function () {
    $transaction = Transaction::create([
        'total_price' => 70000,
        'buyer_name' => $this->customer->name,
        'user_id' => $this->customer->id,
        'status' => 'waiting_payment',
        'payment_method' => 'cash',
    ]);

    $transaction->details()->create([
        'product_id' => $this->product->id,
        'qty' => 2,
    ]);

    $initialStock = $this->product->fresh()->stock;

    $this->actingAs($this->admin)
        ->patchJson("/admin/orders/{$transaction->id}/status", [
            'status' => 'cancelled',
        ])
        ->assertSuccessful();

    expect($this->product->fresh()->stock)->toBe($initialStock + 2);
});

test('guest cannot place an order', function () {
    $this->postJson('/orders', [
        'items' => [
            ['product_id' => $this->product->id, 'qty' => 1],
        ],
    ])->assertUnauthorized();
});

test('midtrans callback rejects invalid signature', function () {
    $this->postJson('/midtrans/callback', [
        'order_id' => 'LUNAR-1-12345',
        'status_code' => '200',
        'gross_amount' => '35000.00',
        'transaction_status' => 'settlement',
        'signature_key' => 'invalid-signature',
    ])->assertForbidden();
});
