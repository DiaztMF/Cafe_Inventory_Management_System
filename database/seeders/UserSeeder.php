<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Admin Cafe',
            'email' => 'admin@cafe.test',
            'password' => Hash::make('password'),
        ]);

        User::create([
            'name' => 'Kasir Utama',
            'email' => 'kasir@cafe.test',
            'password' => Hash::make('password'),
        ]);
    }
}