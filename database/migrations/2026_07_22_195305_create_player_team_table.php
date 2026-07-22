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
        Schema::create('player_team', function (Blueprint $table) {
            $table->id();

            $table->foreignId('player_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('team_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('season_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->date('joined_at');
            $table->date('left_at')->nullable();
            $table->unsignedSmallInteger('shirt_number')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();

            $table->unique(
                ['player_id', 'team_id', 'season_id'],
                'player_team_season_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('player_team');
    }
};
