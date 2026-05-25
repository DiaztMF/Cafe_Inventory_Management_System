<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\TransactionDetailController;
use App\Models\Product;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    $products = Product::query()
        ->with('category')
        ->where('stock', '>', 0)
        ->latest()
        ->get();

    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
        'products' => $products,
    ]);
})->name('home');

Route::get('/api/menu', [OrderController::class, 'menu'])->name('menu');

Route::middleware(['auth'])->group(function () {
    Route::post('/orders', [OrderController::class, 'store'])->name('orders.store');
    Route::get('/checkout/{transaction}', [OrderController::class, 'checkout'])->name('orders.checkout');
    Route::post('/orders/{transaction}/pay', [OrderController::class, 'pay'])->name('orders.pay');
    Route::get('/orders/{transaction}/status', [OrderController::class, 'status'])->name('orders.status');
});

// Midtrans webhook (no auth, verified by signature)
Route::post('/midtrans/callback', [OrderController::class, 'midtransCallback'])->name('midtrans.callback');

Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::inertia('categories-page', 'categories/index')->name('categories.page');
    Route::inertia('products-page', 'products/index')->name('products.page');
    Route::inertia('transactions-page', 'transactions/index')->name('transactions.page');
    Route::inertia('orders-page', 'orders/index')->name('orders.page');

    Route::resource('categories', CategoryController::class)->except('create', 'edit');
    Route::resource('products', ProductController::class)->except('create', 'edit');
    Route::resource('transactions', TransactionController::class)->except('create', 'edit');
    Route::resource('transaction-details', TransactionDetailController::class)->except('create', 'edit');

    Route::patch('/admin/orders/{transaction}/status', [TransactionController::class, 'updateStatus'])->name('admin.orders.update-status');
});

Route::controller(ProductController::class)->group(function () {
    Route::get('/product', 'page')->name('product');
});

require __DIR__.'/settings.php';
