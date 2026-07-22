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
        Schema::create('guardian_player', function (Blueprint $table) {
            $table->id();

            $table->foreignId('guardian_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('player_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('relationship');
            $table->boolean('is_primary')->default(false);
            $table->boolean('can_pay')->default(true);
            $table->timestamps();

            $table->unique(
                ['guardian_id', 'player_id'],
                'guardian_player_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('guardian_player');
    }
};
