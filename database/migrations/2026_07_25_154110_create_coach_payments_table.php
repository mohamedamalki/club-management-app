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
    Schema::create('coach_payments', function (Blueprint $table) {
    $table->id();

    $table->foreignId('coach_id')
        ->constrained()
        ->restrictOnDelete();

    $table->foreignId('season_id')
        ->constrained()
        ->restrictOnDelete();

    $table->enum('type', [
        'salary',
        'bonus',
        'transport',
        'other',
    ])->default('salary');

    $table->string('description')->nullable();
    $table->decimal('amount', 10, 2);
    $table->date('due_date');
    $table->date('paid_at')->nullable();

    $table->enum('status', [
        'pending',
        'paid',
        'cancelled',
    ])->default('pending');

    $table->enum('payment_method', [
        'cash',
        'bank_transfer',
        'card',
        'other',
    ])->nullable();

    $table->string('reference')->nullable()->unique();

    $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coach_payments');
    }
};
