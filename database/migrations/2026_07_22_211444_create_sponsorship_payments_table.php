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
        Schema::create('sponsorship_payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sponsorship_id')
                ->constrained()
                ->restrictOnDelete();

            $table->decimal('amount', 12, 2);
            $table->date('payment_date');
            $table->string('payment_method')->default('bank_transfer');
            $table->string('reference')->nullable();
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
        Schema::dropIfExists('sponsorship_payments');
    }
};
