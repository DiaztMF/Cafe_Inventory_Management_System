import { Head } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiRequest } from '@/lib/api-client';
import { dashboard } from '@/routes';
import { index as categoriesIndex } from '@/routes/categories';
import { destroy, index, store, update } from '@/routes/products';

type Category = {
    id: number;
    name: string;
};

type Product = {
    id: number;
    category_id: number;
    name: string;
    price: number;
    stock: number;
    created_at: string;
    category?: Category | null;
};

type ProductForm = {
    category_id: string;
    name: string;
    price: string;
    stock: string;
};

const initialForm: ProductForm = {
    category_id: '',
    name: '',
    price: '',
    stock: '',
};

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

export default function ProductsPage() {
    const [rows, setRows] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<ProductForm>(initialForm);

    async function loadRows() {
        setLoading(true);
        setError(null);

        try {
            const [productsData, categoriesData] = await Promise.all([
                apiRequest<Product[]>(index.url()),
                apiRequest<Category[]>(categoriesIndex.url()),
            ]);

            setRows(productsData);
            setCategories(categoriesData);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Gagal memuat produk.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadRows();
    }, []);

    function openCreate() {
        setEditingId(null);
        setForm(initialForm);
        setIsDialogOpen(true);
    }

    function openEdit(row: Product) {
        setEditingId(row.id);
        setForm({
            category_id: String(row.category_id),
            name: row.name,
            price: String(row.price),
            stock: String(row.stock),
        });
        setIsDialogOpen(true);
    }

    async function submitForm(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const payload = {
                category_id: Number(form.category_id),
                name: form.name,
                price: Number(form.price),
                stock: Number(form.stock),
            };

            if (editingId) {
                await apiRequest(update.url({ product: editingId }), 'PUT', payload);
            } else {
                await apiRequest(store.url(), 'POST', payload);
            }

            setIsDialogOpen(false);
            setForm(initialForm);
            setEditingId(null);
            await loadRows();
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Gagal menyimpan produk.');
        } finally {
            setSaving(false);
        }
    }

    async function deleteRow(id: number) {
        const isConfirmed = window.confirm('Hapus produk ini?');
        if (!isConfirmed) {
            return;
        }

        setError(null);

        try {
            await apiRequest(destroy.url({ product: id }), 'DELETE');
            await loadRows();
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'Gagal menghapus produk.');
        }
    }

    return (
        <>
            <Head title="Produk" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Produk</CardTitle>
                            <CardDescription>Kelola seluruh data produk (CRUD).</CardDescription>
                        </div>
                        <Button onClick={openCreate}>
                            <Plus className="size-4" />
                            Tambah Produk
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertTitle>Terjadi kesalahan</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {loading ? (
                            <Skeleton className="h-52 w-full" />
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Harga</TableHead>
                                        <TableHead>Stok</TableHead>
                                        <TableHead>Dibuat</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>#{row.id}</TableCell>
                                            <TableCell className="font-medium">{row.name}</TableCell>
                                            <TableCell>{row.category?.name ?? '-'}</TableCell>
                                            <TableCell>{formatCurrency(row.price)}</TableCell>
                                            <TableCell>{row.stock}</TableCell>
                                            <TableCell>{formatDate(row.created_at)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                                                        <Pencil className="size-4" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => deleteRow(row.id)}
                                                    >
                                                        <Trash2 className="size-4" />
                                                        Hapus
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {rows.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                                                Belum ada produk.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
                        <DialogDescription>Isi data produk lalu simpan perubahan.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitForm} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Kategori</Label>
                            <Select
                                value={form.category_id}
                                onValueChange={(value) => setForm((state) => ({ ...state, category_id: value }))}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={String(category.id)}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="product-name">Nama</Label>
                            <Input
                                id="product-name"
                                value={form.name}
                                onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="product-price">Harga</Label>
                                <Input
                                    id="product-price"
                                    type="number"
                                    min={0}
                                    value={form.price}
                                    onChange={(event) => setForm((state) => ({ ...state, price: event.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="product-stock">Stok</Label>
                                <Input
                                    id="product-stock"
                                    type="number"
                                    min={0}
                                    value={form.stock}
                                    onChange={(event) => setForm((state) => ({ ...state, stock: event.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

ProductsPage.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Produk',
            href: '/products-page',
        },
    ],
};
