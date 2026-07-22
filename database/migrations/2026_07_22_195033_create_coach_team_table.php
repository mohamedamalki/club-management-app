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
        Schema::create('coach_team', function (Blueprint $table) {
            $table->id();

            $table->foreignId('coach_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('team_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('season_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('role')->default('head_coach');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();

            $table->unique(
                ['coach_id', 'team_id', 'season_id', 'role'],
                'coach_team_season_role_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coach_team');
    }
};
