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
import { index as productsIndex } from '@/routes/products';
import { destroy, index, store, update } from '@/routes/transaction-details';
import { index as transactionsIndex } from '@/routes/transactions';

type Product = {
    id: number;
    name: string;
    price: number;
};

type Transaction = {
    id: number;
    buyer_name: string;
};

type TransactionDetail = {
    id: number;
    transaction_id: number;
    product_id: number;
    qty: number;
    created_at: string;
    product?: Product | null;
};

type DetailForm = {
    transaction_id: string;
    product_id: string;
    qty: string;
};

const initialForm: DetailForm = {
    transaction_id: '',
    product_id: '',
    qty: '1',
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

export default function TransactionDetailsPage() {
    const [rows, setRows] = useState<TransactionDetail[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<DetailForm>(initialForm);

    async function loadRows() {
        setLoading(true);
        setError(null);

        try {
            const [detailsData, productsData, transactionsData] = await Promise.all([
                apiRequest<TransactionDetail[]>(index.url()),
                apiRequest<Product[]>(productsIndex.url()),
                apiRequest<Transaction[]>(transactionsIndex.url()),
            ]);

            setRows(detailsData);
            setProducts(productsData);
            setTransactions(transactionsData);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Gagal memuat detail transaksi.');
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

    function openEdit(row: TransactionDetail) {
        setEditingId(row.id);
        setForm({
            transaction_id: String(row.transaction_id),
            product_id: String(row.product_id),
            qty: String(row.qty),
        });
        setIsDialogOpen(true);
    }

    async function submitForm(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const payload = {
                transaction_id: Number(form.transaction_id),
                product_id: Number(form.product_id),
                qty: Number(form.qty),
            };

            if (editingId) {
                await apiRequest(update.url({ transaction_detail: editingId }), 'PUT', payload);
            } else {
                await apiRequest(store.url(), 'POST', payload);
            }

            setIsDialogOpen(false);
            setForm(initialForm);
            setEditingId(null);
            await loadRows();
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Gagal menyimpan detail transaksi.');
        } finally {
            setSaving(false);
        }
    }

    async function deleteRow(id: number) {
        const isConfirmed = window.confirm('Hapus detail transaksi ini?');
        if (!isConfirmed) {
            return;
        }

        setError(null);

        try {
            await apiRequest(destroy.url({ transaction_detail: id }), 'DELETE');
            await loadRows();
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'Gagal menghapus detail transaksi.');
        }
    }

    return (
        <>
            <Head title="Detail Transaksi" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Detail Transaksi</CardTitle>
                            <CardDescription>Kelola data item dalam transaksi (CRUD).</CardDescription>
                        </div>
                        <Button onClick={openCreate}>
                            <Plus className="size-4" />
                            Tambah Detail
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
                                        <TableHead>ID Transaksi</TableHead>
                                        <TableHead>Produk</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Subtotal</TableHead>
                                        <TableHead>Dibuat</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>#{row.id}</TableCell>
                                            <TableCell>#{row.transaction_id}</TableCell>
                                            <TableCell>{row.product?.name ?? '-'}</TableCell>
                                            <TableCell>{row.qty}</TableCell>
                                            <TableCell>{formatCurrency((row.product?.price ?? 0) * row.qty)}</TableCell>
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
                                                Belum ada detail transaksi.
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
                        <DialogTitle>{editingId ? 'Edit Detail Transaksi' : 'Tambah Detail Transaksi'}</DialogTitle>
                        <DialogDescription>Isi data detail transaksi lalu simpan perubahan.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitForm} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Transaksi</Label>
                            <Select
                                value={form.transaction_id}
                                onValueChange={(value) => setForm((state) => ({ ...state, transaction_id: value }))}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih transaksi" />
                                </SelectTrigger>
                                <SelectContent>
                                    {transactions.map((transaction) => (
                                        <SelectItem key={transaction.id} value={String(transaction.id)}>
                                            #{transaction.id} - {transaction.buyer_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Produk</Label>
                            <Select
                                value={form.product_id}
                                onValueChange={(value) => setForm((state) => ({ ...state, product_id: value }))}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih produk" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((product) => (
                                        <SelectItem key={product.id} value={String(product.id)}>
                                            {product.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Qty</Label>
                            <Select
                                value={form.qty}
                                onValueChange={(value) => setForm((state) => ({ ...state, qty: value }))}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih qty" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 20 }).map((_, index) => {
                                        const value = String(index + 1);
                                        return (
                                            <SelectItem key={value} value={value}>
                                                {value}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
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

TransactionDetailsPage.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Detail Transaksi',
            href: '/transaction-details-page',
        },
    ],
};
