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
        Schema::create('membership_payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('player_id')
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('membership_fee_id')
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('guardian_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->decimal('amount', 12, 2);
            $table->date('payment_date');
            $table->string('payment_method')->default('cash');
            $table->string('reference')->nullable();
            $table->string('receipt_number')->nullable()->unique();
            $table->text('notes')->nullable();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('membership_payments');
    }
};
