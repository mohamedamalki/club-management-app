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
        Schema::create('team_equipment', function (Blueprint $table) {
            $table->id();

            $table->foreignId('equipment_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('team_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('season_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->unsignedInteger('quantity');
            $table->date('assigned_at');
            $table->date('returned_at')->nullable();
            $table->string('condition_on_assignment')->nullable();
            $table->string('condition_on_return')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('team_equipment');
    }
};
