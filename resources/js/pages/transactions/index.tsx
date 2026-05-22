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
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiRequest } from '@/lib/api-client';
import { dashboard } from '@/routes';
import { destroy, index, store, update } from '@/routes/transactions';

type Transaction = {
    id: number;
    total_price: number;
    buyer_name: string;
    cashier_id: number | null;
    status: string;
    payment_method: string | null;
    created_at: string;
};

type TransactionForm = {
    total_price: string;
    buyer_name: string;
    cashier_id: string;
};

const initialForm: TransactionForm = {
    total_price: '',
    buyer_name: '',
    cashier_id: '',
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

export default function TransactionsPage() {
    const [rows, setRows] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<TransactionForm>(initialForm);

    async function loadRows() {
        setLoading(true);
        setError(null);

        try {
            const data = await apiRequest<Transaction[]>(index.url());
            setRows(data);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Gagal memuat transaksi.');
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

    function openEdit(row: Transaction) {
        setEditingId(row.id);
        setForm({
            total_price: String(row.total_price),
            buyer_name: row.buyer_name,
            cashier_id: row.cashier_id ? String(row.cashier_id) : '',
        });
        setIsDialogOpen(true);
    }

    async function submitForm(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const payload = {
                total_price: Number(form.total_price),
                buyer_name: form.buyer_name,
                cashier_id: form.cashier_id ? Number(form.cashier_id) : null,
            };

            if (editingId) {
                await apiRequest(update.url({ transaction: editingId }), 'PUT', payload);
            } else {
                await apiRequest(store.url(), 'POST', payload);
            }

            setIsDialogOpen(false);
            setForm(initialForm);
            setEditingId(null);
            await loadRows();
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Gagal menyimpan transaksi.');
        } finally {
            setSaving(false);
        }
    }

    async function deleteRow(id: number) {
        const isConfirmed = window.confirm('Hapus transaksi ini?');
        if (!isConfirmed) {
            return;
        }

        setError(null);

        try {
            await apiRequest(destroy.url({ transaction: id }), 'DELETE');
            await loadRows();
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'Gagal menghapus transaksi.');
        }
    }

    return (
        <>
            <Head title="Transaksi" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Transaksi</CardTitle>
                            <CardDescription>Kelola seluruh data transaksi (CRUD).</CardDescription>
                        </div>
                        <Button onClick={openCreate}>
                            <Plus className="size-4" />
                            Tambah Transaksi
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
                                        <TableHead>Nama Pembeli</TableHead>
                                        <TableHead>Total Harga</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Metode</TableHead>
                                        <TableHead>Cashier ID</TableHead>
                                        <TableHead>Dibuat</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>#{row.id}</TableCell>
                                            <TableCell className="font-medium">{row.buyer_name}</TableCell>
                                            <TableCell>{formatCurrency(row.total_price)}</TableCell>
                                            <TableCell>
                                                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                    row.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    row.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                                                    row.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    row.status === 'processing' ? 'bg-indigo-100 text-indigo-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {row.status}
                                                </span>
                                            </TableCell>
                                            <TableCell>{row.payment_method ?? '-'}</TableCell>
                                            <TableCell>{row.cashier_id ?? '-'}</TableCell>
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
                                            <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                                                Belum ada transaksi.
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
                        <DialogTitle>{editingId ? 'Edit Transaksi' : 'Tambah Transaksi'}</DialogTitle>
                        <DialogDescription>Isi data transaksi lalu simpan perubahan.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitForm} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="transaction-buyer">Nama Pembeli</Label>
                            <Input
                                id="transaction-buyer"
                                value={form.buyer_name}
                                onChange={(event) => setForm((state) => ({ ...state, buyer_name: event.target.value }))}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="transaction-price">Total Harga</Label>
                                <Input
                                    id="transaction-price"
                                    type="number"
                                    min={0}
                                    value={form.total_price}
                                    onChange={(event) =>
                                        setForm((state) => ({ ...state, total_price: event.target.value }))
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="transaction-cashier">Cashier ID (opsional)</Label>
                                <Input
                                    id="transaction-cashier"
                                    type="number"
                                    min={1}
                                    value={form.cashier_id}
                                    onChange={(event) =>
                                        setForm((state) => ({ ...state, cashier_id: event.target.value }))
                                    }
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

TransactionsPage.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Transaksi',
            href: '/transactions-page',
        },
    ],
};
