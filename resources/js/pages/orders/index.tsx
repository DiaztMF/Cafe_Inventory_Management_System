import { Head } from '@inertiajs/react';
import { Check, Clock, CreditCard, Loader2, Package, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiRequest } from '@/lib/api-client';
import { dashboard } from '@/routes';
import { index as transactionsIndex } from '@/routes/transactions';

type ProductItem = {
    id: number;
    name: string;
    price: number;
};

type TransactionDetail = {
    id: number;
    product_id: number;
    qty: number;
    product?: ProductItem | null;
};

type UserInfo = {
    id: number;
    name: string;
    email: string;
};

type Transaction = {
    id: number;
    total_price: number;
    buyer_name: string;
    user_id: number | null;
    cashier_id: number | null;
    status: string;
    payment_method: string | null;
    midtrans_order_id: string | null;
    paid_at: string | null;
    created_at: string;
    user?: UserInfo | null;
    cashier?: UserInfo | null;
    details?: TransactionDetail[];
};

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    { value: 'waiting_payment', label: 'Menunggu Bayar', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    { value: 'paid', label: 'Dibayar', color: 'bg-green-100 text-green-800 border-green-300' },
    { value: 'processing', label: 'Diproses', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    { value: 'completed', label: 'Selesai', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    { value: 'cancelled', label: 'Dibatalkan', color: 'bg-red-100 text-red-800 border-red-300' },
];

function getStatusBadge(status: string) {
    const config = STATUS_OPTIONS.find((s) => s.value === status) || {
        label: status,
        color: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return (
        <Badge variant="outline" className={`${config.color} text-[0.6875rem] font-semibold border`}>
            {config.label}
        </Badge>
    );
}

function getPaymentBadge(method: string | null) {
    if (!method) return <span className="text-xs text-muted-foreground">—</span>;
    return (
        <Badge
            variant="secondary"
            className={`text-[0.6875rem] ${
                method === 'qris'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-amber-100 text-amber-800'
            }`}
        >
            {method === 'qris' ? '🔲 QRIS' : '💵 Cash'}
        </Badge>
    );
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

export default function OrdersPage() {
    const [rows, setRows] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [updating, setUpdating] = useState<number | null>(null);

    // Detail dialog
    const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null);

    // Status update dialog
    const [statusDialog, setStatusDialog] = useState<Transaction | null>(null);
    const [newStatus, setNewStatus] = useState('');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const loadRows = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        setError(null);
        try {
            const data = await apiRequest<Transaction[]>(transactionsIndex.url());
            setRows(data);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Gagal memuat pesanan.');
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadRows(true);
        // Auto-refresh every 5 seconds for real-time feel (silent poll)
        const interval = setInterval(() => void loadRows(false), 5000);
        return () => clearInterval(interval);
    }, [loadRows]);

    const filteredRows = useMemo(() => {
        let filtered = rows;

        if (statusFilter !== 'all') {
            filtered = filtered.filter((r) => r.status === statusFilter);
        }

        const keyword = search.trim().toLowerCase();
        if (keyword) {
            filtered = filtered.filter(
                (r) =>
                    r.id.toString().includes(keyword) ||
                    r.buyer_name.toLowerCase().includes(keyword) ||
                    r.user?.name?.toLowerCase().includes(keyword) ||
                    r.payment_method?.toLowerCase().includes(keyword),
            );
        }

        return filtered;
    }, [rows, statusFilter, search]);

    // Summary stats
    const stats = useMemo(() => {
        const pending = rows.filter((r) => r.status === 'pending' || r.status === 'waiting_payment').length;
        const paid = rows.filter((r) => r.status === 'paid').length;
        const processing = rows.filter((r) => r.status === 'processing').length;
        const completed = rows.filter((r) => r.status === 'completed').length;
        return { pending, paid, processing, completed };
    }, [rows]);

    async function updateOrderStatus(transactionId: number, status: string) {
        setUpdating(transactionId);
        setError(null);
        try {
            await apiRequest(`/admin/orders/${transactionId}/status`, 'PATCH', { status });
            await loadRows();
            setStatusDialog(null);
            setSuccessMessage(`Status pesanan #${transactionId} berhasil diupdate.`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal mengupdate status.');
        } finally {
            setUpdating(null);
        }
    }

    const getAvailableNextStatuses = (status: string, method: string | null) => {
        if (status === 'completed' || status === 'cancelled') return [];
        
        const options: string[] = [];
        if (status === 'pending' || status === 'waiting_payment') {
            options.push('paid');
            options.push('cancelled');
        } else if (status === 'paid') {
            options.push('processing');
            options.push('cancelled');
        } else if (status === 'processing') {
            options.push('completed');
            options.push('cancelled');
        }
        
        return STATUS_OPTIONS.filter(opt => options.includes(opt.value));
    };

    const availableStatuses = statusDialog ? getAvailableNextStatuses(statusDialog.status, statusDialog.payment_method) : [];

    return (
        <>
            <Head title="Manajemen Pesanan" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Summary Cards */}
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1.5">
                                <Clock className="size-3.5" /> Menunggu
                            </CardDescription>
                            <CardTitle className="text-2xl text-amber-600">{stats.pending}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">Perlu tindakan</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1.5">
                                <CreditCard className="size-3.5" /> Dibayar
                            </CardDescription>
                            <CardTitle className="text-2xl text-green-600">{stats.paid}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">Siap diproses</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1.5">
                                <Loader2 className="size-3.5" /> Diproses
                            </CardDescription>
                            <CardTitle className="text-2xl text-indigo-600">{stats.processing}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">Sedang disiapkan</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1.5">
                                <Check className="size-3.5" /> Selesai
                            </CardDescription>
                            <CardTitle className="text-2xl text-emerald-600">{stats.completed}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">Hari ini</CardContent>
                    </Card>
                </div>

                {/* Orders Table */}
                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="size-5" />
                                Manajemen Pesanan
                            </CardTitle>
                            <CardDescription>Kelola pesanan masuk dari pelanggan.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => void loadRows()} disabled={loading}>
                            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {successMessage && (
                            <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
                                <Check className="size-4 text-green-600" />
                                <div className="ml-2">
                                    <AlertTitle>Sukses</AlertTitle>
                                    <AlertDescription>{successMessage}</AlertDescription>
                                </div>
                            </Alert>
                        )}

                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Filters */}
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari pesanan (nama / ID / metode)..."
                                className="w-full sm:max-w-sm"
                            />
                            <div className="flex items-center gap-2 flex-wrap">
                                <Button
                                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setStatusFilter('all')}
                                >
                                    Semua
                                </Button>
                                {STATUS_OPTIONS.map((s) => (
                                    <Button
                                        key={s.value}
                                        variant={statusFilter === s.value ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setStatusFilter(s.value)}
                                    >
                                        {s.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <Skeleton className="h-64 w-full" />
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Pembeli</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Metode</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            className={
                                                row.status === 'pending' || row.status === 'waiting_payment'
                                                    ? 'bg-amber-50/30'
                                                    : ''
                                            }
                                        >
                                            <TableCell className="font-mono text-sm">#{row.id}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <span className="font-medium">{row.buyer_name}</span>
                                                    {row.user && (
                                                        <span className="block text-xs text-muted-foreground">
                                                            {row.user.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {formatCurrency(row.total_price)}
                                            </TableCell>
                                            <TableCell>{getPaymentBadge(row.payment_method)}</TableCell>
                                            <TableCell>{getStatusBadge(row.status)}</TableCell>
                                            <TableCell className="text-sm">{formatDate(row.created_at)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setDetailTransaction(row)}
                                                    >
                                                        Detail
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        onClick={() => {
                                                            setStatusDialog(row);
                                                            setNewStatus(row.status);
                                                        }}
                                                    >
                                                        Update
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredRows.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                                {statusFilter !== 'all'
                                                    ? `Tidak ada pesanan dengan status "${STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label}".`
                                                    : 'Belum ada pesanan masuk.'}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Detail Dialog */}
            <Dialog open={!!detailTransaction} onOpenChange={(open) => !open && setDetailTransaction(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Detail Pesanan #{detailTransaction?.id}</DialogTitle>
                        <DialogDescription>Informasi lengkap pesanan pelanggan.</DialogDescription>
                    </DialogHeader>
                    {detailTransaction && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Pembeli</span>
                                    <p className="font-semibold">{detailTransaction.buyer_name}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Status</span>
                                    <div className="mt-1">{getStatusBadge(detailTransaction.status)}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Metode Bayar</span>
                                    <div className="mt-1">{getPaymentBadge(detailTransaction.payment_method)}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Tanggal</span>
                                    <p className="font-semibold">{formatDate(detailTransaction.created_at)}</p>
                                </div>
                                {detailTransaction.paid_at && (
                                    <div>
                                        <span className="text-muted-foreground">Dibayar</span>
                                        <p className="font-semibold">{formatDate(detailTransaction.paid_at)}</p>
                                    </div>
                                )}
                                {detailTransaction.midtrans_order_id && (
                                    <div>
                                        <span className="text-muted-foreground">Midtrans ID</span>
                                        <p className="font-mono text-xs">{detailTransaction.midtrans_order_id}</p>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div>
                                <h4 className="font-semibold mb-2">Item Pesanan</h4>
                                <div className="space-y-2">
                                    {detailTransaction.details?.map((detail) => (
                                        <div key={detail.id} className="flex items-center justify-between text-sm">
                                            <div>
                                                <span className="font-medium">
                                                    {detail.product?.name ?? 'Produk tidak tersedia'}
                                                </span>
                                                <span className="text-muted-foreground ml-2">×{detail.qty}</span>
                                            </div>
                                            <span className="font-semibold">
                                                {formatCurrency((detail.product?.price ?? 0) * detail.qty)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <span className="font-bold text-lg">Total</span>
                                <span className="font-bold text-lg">
                                    {formatCurrency(detailTransaction.total_price)}
                                </span>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Status Update Dialog */}
            <Dialog open={!!statusDialog} onOpenChange={(open) => !open && setStatusDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Status Pesanan #{statusDialog?.id}</DialogTitle>
                        <DialogDescription>
                            Pembeli: {statusDialog?.buyer_name} • {formatCurrency(statusDialog?.total_price ?? 0)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">Pilih status baru:</p>
                        {availableStatuses.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                                {availableStatuses.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setNewStatus(opt.value)}
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                                            newStatus === opt.value
                                                ? 'border-primary bg-primary/5 shadow-sm'
                                                : 'border-transparent bg-muted hover:border-border'
                                        }`}
                                    >
                                        {newStatus === opt.value && <Check className="size-3.5" />}
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 rounded-lg bg-muted/50 border text-center">
                                <p className="text-sm text-muted-foreground">Tidak ada perubahan status yang tersedia untuk pesanan ini.</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStatusDialog(null)}>
                            Batal
                        </Button>
                        <Button
                            onClick={() => statusDialog && void updateOrderStatus(statusDialog.id, newStatus)}
                            disabled={updating === statusDialog?.id || newStatus === statusDialog?.status}
                        >
                            {updating === statusDialog?.id ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" /> Mengupdate...
                                </>
                            ) : (
                                'Update Status'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

OrdersPage.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Pesanan',
            href: '/orders-page',
        },
    ],
};
