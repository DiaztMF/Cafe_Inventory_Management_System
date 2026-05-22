<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('status')->default('pending')->after('cashier_id');
            $table->string('payment_method')->nullable()->after('status');
            $table->string('midtrans_order_id')->nullable()->unique()->after('payment_method');
            $table->string('midtrans_snap_token')->nullable()->after('midtrans_order_id');
            $table->timestamp('paid_at')->nullable()->after('midtrans_snap_token');
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnUpdate()->nullOnDelete()->after('buyer_name');

            $table->index('status');
            $table->index('payment_method');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['payment_method']);
            $table->dropForeign(['user_id']);
            $table->dropColumn([
                'status',
                'payment_method',
                'midtrans_order_id',
                'midtrans_snap_token',
                'paid_at',
                'user_id',
            ]);
        });
    }
};
