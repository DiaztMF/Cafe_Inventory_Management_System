<?php

use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('admin can access dashboard', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get('/dashboard')
        ->assertSuccessful();
});

test('customer cannot access dashboard', function () {
    $customer = User::factory()->create(['role' => 'customer']);

    $this->actingAs($customer)
        ->get('/dashboard')
        ->assertRedirect(route('home'));
});

test('guest cannot access dashboard', function () {
    $this->get('/dashboard')
        ->assertRedirect();
});

test('customer can view landing page with products', function () {
    $customer = User::factory()->create(['role' => 'customer']);

    $this->actingAs($customer)
        ->get('/')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('welcome')
            ->has('products')
        );
});

test('customer can place an order', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $category = \App\Models\Category::query()->create(['name' => 'Coffee', 'description' => 'Test']);
    $product = \App\Models\Product::query()->create([
        'category_id' => $category->id,
        'name' => 'Test Latte',
        'price' => 30000,
        'stock' => 10,
    ]);

    $this->actingAs($customer)
        ->postJson('/orders', [
            'items' => [
                ['product_id' => $product->id, 'qty' => 2],
            ],
        ])
        ->assertCreated();

    expect($product->fresh()->stock)->toBe(8);
});

test('guest cannot place an order', function () {
    $this->postJson('/orders', ['items' => []])
        ->assertUnauthorized();
});

test('newly registered user defaults to customer role', function () {
    $user = User::factory()->create();
    expect($user->role)->toBe('customer');
    expect($user->isCustomer())->toBeTrue();
    expect($user->isAdmin())->toBeFalse();
});

test('admin role helpers work correctly', function () {
    $admin = User::factory()->admin()->create();
    expect($admin->isAdmin())->toBeTrue();
    expect($admin->isCustomer())->toBeFalse();
});
