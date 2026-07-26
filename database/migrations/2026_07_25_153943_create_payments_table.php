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
    Schema::create('payments', function (Blueprint $table) {
    $table->id();

    $table->foreignId('player_charge_id')
        ->constrained()
        ->restrictOnDelete();

    $table->foreignId('guardian_id')
        ->nullable()
        ->constrained()
        ->nullOnDelete();

    $table->decimal('amount', 10, 2);
    $table->date('payment_date');

    $table->enum('payment_method', [
        'cash',
        'bank_transfer',
        'card',
        'other',
    ])->default('cash');

    $table->string('reference')->nullable()->unique();
    $table->text('notes')->nullable();

    $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
