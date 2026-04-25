<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Extend role enum to include 'staff'
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','operator','superadmin','staff') NOT NULL DEFAULT 'operator'");

        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('counter_id')->nullable()->after('role');
            $table->foreign('counter_id')->references('id')->on('counters')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['counter_id']);
            $table->dropColumn('counter_id');
        });

        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','operator','superadmin') NOT NULL DEFAULT 'operator'");
    }
};
