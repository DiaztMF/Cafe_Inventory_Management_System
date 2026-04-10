<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\TransactionDetailController;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::inertia('categories-page', 'categories/index')->name('categories.page');
    Route::inertia('products-page', 'products/index')->name('products.page');
    Route::inertia('transactions-page', 'transactions/index')->name('transactions.page');
    Route::inertia('transaction-details-page', 'transaction-details/index')->name('transaction-details.page');

    Route::resource('categories', CategoryController::class)->except('create', 'edit');
    Route::resource('products', ProductController::class)->except('create', 'edit');
    Route::resource('transactions', TransactionController::class)->except('create', 'edit');
    Route::resource('transaction-details', TransactionDetailController::class)->except('create', 'edit');
});

Route::controller(ProductController::class)->group(function () {
    Route::get('/product', 'page')->name('product');
});

require __DIR__.'/settings.php';
