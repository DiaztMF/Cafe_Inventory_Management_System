<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Coffee',
                'description' => 'Menu kopi panas dan dingin.',
            ],
            [
                'name' => 'Non Coffee',
                'description' => 'Minuman selain kopi untuk semua pelanggan.',
            ],
            [
                'name' => 'Snack',
                'description' => 'Camilan ringan untuk menemani minuman.',
            ],
            [
                'name' => 'Dessert',
                'description' => 'Menu penutup dan makanan manis.',
            ],
        ];

        foreach ($categories as $category) {
            Category::query()->create($category);
        }
    }
}
