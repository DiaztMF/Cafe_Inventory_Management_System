<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
            // Coffee
            [
                'category' => 'Coffee',
                'name' => 'Espresso Classico',
                'price' => 28000,
                'stock' => 60,
            ],
            [
                'category' => 'Coffee',
                'name' => 'Lunar Latte',
                'price' => 38000,
                'stock' => 50,
            ],
            [
                'category' => 'Coffee',
                'name' => 'Caramel Macchiato',
                'price' => 40000,
                'stock' => 45,
            ],
            [
                'category' => 'Coffee',
                'name' => 'Cold Brew Tonic',
                'price' => 35000,
                'stock' => 40,
            ],
            [
                'category' => 'Coffee',
                'name' => 'Cappuccino',
                'price' => 32000,
                'stock' => 55,
            ],

            // Non Coffee
            [
                'category' => 'Non Coffee',
                'name' => 'Matcha Serenity',
                'price' => 42000,
                'stock' => 35,
            ],
            [
                'category' => 'Non Coffee',
                'name' => 'Chocolate Milk',
                'price' => 28000,
                'stock' => 40,
            ],
            [
                'category' => 'Non Coffee',
                'name' => 'Mineral Water',
                'price' => 8000,
                'stock' => 80,
            ],

            // Snack
            [
                'category' => 'Snack',
                'name' => 'French Fries',
                'price' => 18000,
                'stock' => 35,
            ],
            [
                'category' => 'Snack',
                'name' => 'Croissant',
                'price' => 20000,
                'stock' => 30,
            ],

            // Dessert
            [
                'category' => 'Dessert',
                'name' => 'Affogato Bliss',
                'price' => 45000,
                'stock' => 25,
            ],
            [
                'category' => 'Dessert',
                'name' => 'Chocolate Cake',
                'price' => 30000,
                'stock' => 25,
            ],
        ];

        foreach ($products as $product) {
            $category = Category::query()
                ->where('name', $product['category'])
                ->firstOrFail();

            Product::query()->create([
                'category_id' => $category->id,
                'name' => $product['name'],
                'price' => $product['price'],
                'stock' => $product['stock'],
            ]);
        }
    }
}
