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
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();

            $table->foreignId('season_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('team_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->string('description');
            $table->decimal('amount', 12, 2);
            $table->date('expense_date');
            $table->string('payment_method')->nullable();
            $table->string('reference')->nullable();
            $table->string('receipt_file')->nullable();
            $table->text('notes')->nullable();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
