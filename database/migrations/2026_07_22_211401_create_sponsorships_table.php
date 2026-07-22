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
        Schema::create('sponsorships', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sponsor_id')
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('season_id')
                ->constrained()
                ->restrictOnDelete();

            $table->string('title');
            $table->decimal('agreed_amount', 12, 2);
            $table->date('start_date');
            $table->date('end_date');
            $table->date('payment_deadline')->nullable();
            $table->string('contract_file')->nullable();
            $table->string('status')->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sponsorships');
    }
};
