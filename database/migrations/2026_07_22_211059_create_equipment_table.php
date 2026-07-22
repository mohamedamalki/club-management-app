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
        Schema::create('equipment', function (Blueprint $table) {
            $table->id();

            $table->foreignId('equipment_category_id')
                ->constrained()
                ->restrictOnDelete();

            $table->string('name');
            $table->string('reference')->nullable()->unique();
            $table->unsignedInteger('total_quantity')->default(0);
            $table->unsignedInteger('available_quantity')->default(0);
            $table->string('condition')->default('good');
            $table->date('purchase_date')->nullable();
            $table->decimal('unit_price', 12, 2)->nullable();
            $table->string('supplier')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipment');
    }
};
