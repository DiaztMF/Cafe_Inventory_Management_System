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
            [
                'category' => 'Coffee',
                'name' => 'Espresso',
                'price' => 18000,
                'stock' => 60,
            ],
            [
                'category' => 'Coffee',
                'name' => 'Cappuccino',
                'price' => 25000,
                'stock' => 45,
            ],
            [
                'category' => 'Coffee',
                'name' => 'Latte',
                'price' => 28000,
                'stock' => 50,
            ],
            [
                'category' => 'Non Coffee',
                'name' => 'Chocolate Milk',
                'price' => 22000,
                'stock' => 40,
            ],
            [
                'category' => 'Non Coffee',
                'name' => 'Mineral Water',
                'price' => 8000,
                'stock' => 80,
            ],
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