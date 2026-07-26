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
        Schema::create('player_charges', function (Blueprint $table) {
            $table->id();

            $table->foreignId('player_id')
                    ->constrained()
                    ->cascadeOnDelete();

            $table->foreignId('season_id')
                    ->constrained()
                    ->restrictOnDelete();

            $table->enum('type', [
                'registration',
                'monthly_fee',
                'equipment',
                'transport',
                'other',
            ]);

            $table->string('description')->nullable();
            $table->decimal('amount', 10, 2);
            $table->date('due_date');

            $table->enum('status', [
                'unpaid',
                'partially_paid',
                'paid',
                'cancelled',
            ])->default('unpaid');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('player_charges');
    }
};
