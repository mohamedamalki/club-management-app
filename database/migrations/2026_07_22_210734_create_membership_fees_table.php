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
        Schema::create('membership_fees', function (Blueprint $table) {
            $table->id();

            $table->foreignId('team_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('season_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('name');
            $table->decimal('amount', 12, 2);
            $table->string('frequency')->default('yearly');
            $table->date('due_date')->nullable();
            $table->text('description')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('membership_fees');
    }
};
