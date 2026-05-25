import { Head } from '@inertiajs/react';
import { 
    AlertCircle, 
    Calendar, 
    CreditCard, 
    Eye, 
    Hash, 
    ReceiptText, 
    Search, 
    ShoppingBag, 
    TrendingUp, 
    User, 
    XCircle 
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiRequest } from '@/lib/api-client';
import { dashboard } from '@/routes';
import { index } from '@/routes/transactions';

type Product = {
    id: number;
    name: string;
    price: number;
};

type TransactionDetail = {
    id: number;
    transaction_id: number;
    product_id: number;
    qty: number;
    created_at: string;
    product?: Product | null;
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
    const [error, setError] = useState<string | null>(null);
    
    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    
    // View detail dialog states
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

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

    const handleViewDetail = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsDetailOpen(true);
    };

    // Calculate premium stats dynamically
    const stats = useMemo(() => {
        const total = rows.length;
        const revenue = rows
            .filter((r) => r.status === 'completed' || r.status === 'paid')
            .reduce((sum, r) => sum + Number(r.total_price), 0);
        const completed = rows.filter((r) => r.status === 'completed' || r.status === 'paid').length;
        const cancelled = rows.filter((r) => r.status === 'cancelled').length;

        return { total, revenue, completed, cancelled };
    }, [rows]);

    // Filtered data
    const filteredRows = useMemo(() => {
        return rows.filter((row) => {
            const matchesSearch =
                row.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                row.id.toString().includes(searchTerm) ||
                (row.payment_method && row.payment_method.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus = statusFilter === 'all' || row.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [rows, searchTerm, statusFilter]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-medium">Selesai</Badge>;
            case 'paid':
                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 font-medium">Dibayar</Badge>;
            case 'processing':
                return <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 font-medium font-medium">Diproses</Badge>;
            case 'waiting_payment':
                return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-medium">Menunggu Pembayaran</Badge>;
            case 'cancelled':
                return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 font-medium">Dibatalkan</Badge>;
            default:
                return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-medium">Pending</Badge>;
        }
    };

    const getPaymentMethodBadge = (method: string | null) => {
        if (!method) return <span className="text-muted-foreground">-</span>;
        
        const isQRIS = method.toUpperCase() === 'QRIS';
        return (
            <Badge variant="outline" className={isQRIS ? "bg-violet-500/5 text-violet-500 border-violet-500/20" : "bg-orange-500/5 text-orange-500 border-orange-500/20"}>
                <CreditCard className="size-3 mr-1 inline" />
                {method.toUpperCase()}
            </Badge>
        );
    };

    return (
        <>
            <Head title="Transaksi" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">Riwayat Transaksi</h1>
                    <p className="text-muted-foreground text-sm">
                        Laporan dan detail seluruh transaksi pembayaran kafe.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="relative overflow-hidden border-indigo-500/10 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/10 dark:to-zinc-900">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
                            <ReceiptText className="size-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-20" /> : stats.total}</div>
                            <p className="text-muted-foreground mt-1 text-xs">Seluruh transaksi terdaftar</p>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-emerald-500/10 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/10 dark:to-zinc-900">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                            <TrendingUp className="size-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {loading ? <Skeleton className="h-8 w-32" /> : formatCurrency(stats.revenue)}
                            </div>
                            <p className="text-muted-foreground mt-1 text-xs">Dari transaksi berhasil (Paid & Selesai)</p>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-blue-500/10 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/10 dark:to-zinc-900">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Transaksi Sukses</CardTitle>
                            <ShoppingBag className="size-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-20" /> : stats.completed}</div>
                            <p className="text-muted-foreground mt-1 text-xs">Transaksi dibayar / selesai</p>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-rose-500/10 bg-gradient-to-br from-rose-50/50 to-white dark:from-rose-950/10 dark:to-zinc-900">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Transaksi Batal</CardTitle>
                            <XCircle className="size-4 text-rose-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-20" /> : stats.cancelled}</div>
                            <p className="text-muted-foreground mt-1 text-xs font-medium text-rose-600/80 dark:text-rose-400/80">Transaksi dibatalkan</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Table Card */}
                <Card className="shadow-sm border-zinc-200/50 dark:border-zinc-800/50">
                    <CardHeader className="pb-4">
                        <CardTitle>Data Transaksi</CardTitle>
                        <CardDescription>Cari dan telusuri transaksi Anda.</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                        {/* Toolbar: Search & Status Filter */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nama pembeli, ID, atau metode..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            {/* Status Filter Tab Buttons */}
                            <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-lg dark:bg-zinc-800 text-xs">
                                {[
                                    { value: 'all', label: 'Semua' },
                                    { value: 'pending', label: 'Pending' },
                                    { value: 'waiting_payment', label: 'Menunggu' },
                                    { value: 'paid', label: 'Paid' },
                                    { value: 'processing', label: 'Diproses' },
                                    { value: 'completed', label: 'Selesai' },
                                    { value: 'cancelled', label: 'Batal' },
                                ].map((item) => (
                                    <button
                                        key={item.value}
                                        onClick={() => setStatusFilter(item.value)}
                                        className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                                            statusFilter === item.value
                                                ? 'bg-white shadow-xs text-zinc-900 dark:bg-zinc-900 dark:text-white'
                                                : 'text-muted-foreground hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="size-4" />
                                <AlertTitle>Terjadi kesalahan</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {loading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : (
                            <div className="rounded-md border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                                        <TableRow>
                                            <TableHead className="w-16">ID</TableHead>
                                            <TableHead>Pembeli</TableHead>
                                            <TableHead>Kasir</TableHead>
                                            <TableHead>Total Harga</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Metode</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead className="w-20 text-center">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRows.map((row) => (
                                            <TableRow key={row.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                                                <TableCell className="font-mono text-xs">#{row.id}</TableCell>
                                                <TableCell className="font-medium">{row.buyer_name}</TableCell>
                                                <TableCell className="text-zinc-600 dark:text-zinc-400">
                                                    {row.cashier?.name ?? 'Sistem / POS'}
                                                </TableCell>
                                                <TableCell className="font-semibold text-zinc-950 dark:text-white">
                                                    {formatCurrency(row.total_price)}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(row.status)}</TableCell>
                                                <TableCell>{getPaymentMethodBadge(row.payment_method)}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs">
                                                    {formatDate(row.created_at)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        onClick={() => handleViewDetail(row)}
                                                        className="hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
                                                    >
                                                        <Eye className="size-4 mr-1.5" />
                                                        Detail
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredRows.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-muted-foreground py-10 text-center">
                                                    Tidak ada transaksi yang ditemukan.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* View Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <ReceiptText className="size-5 text-indigo-500" />
                            Detail Transaksi #{selectedTransaction?.id}
                        </DialogTitle>
                        <DialogDescription>
                            Informasi rinci mengenai detail pembelian dan status transaksi.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTransaction && (
                        <div className="mt-4 space-y-6">
                            
                            {/* Summary Metadata Grid */}
                            <div className="grid grid-cols-2 gap-4 rounded-lg bg-zinc-50 p-4 text-sm dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="size-4" />
                                        <span>Pembeli</span>
                                    </div>
                                    <p className="font-semibold text-zinc-900 dark:text-white pl-6">
                                        {selectedTransaction.buyer_name}
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="size-4" />
                                        <span>Tanggal Transaksi</span>
                                    </div>
                                    <p className="font-semibold text-zinc-900 dark:text-white pl-6">
                                        {formatDate(selectedTransaction.created_at)}
                                    </p>
                                </div>
                                
                                <div className="space-y-3 pt-2 border-t border-zinc-200/50 dark:border-zinc-800">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Hash className="size-4" />
                                        <span>Status & Pembayaran</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pl-6">
                                        {getStatusBadge(selectedTransaction.status)}
                                        {getPaymentMethodBadge(selectedTransaction.payment_method)}
                                    </div>
                                </div>
                                <div className="space-y-3 pt-2 border-t border-zinc-200/50 dark:border-zinc-800">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="size-4" />
                                        <span>Kasir</span>
                                    </div>
                                    <p className="font-semibold text-zinc-900 dark:text-white pl-6">
                                        {selectedTransaction.cashier?.name ?? 'Sistem / POS'}
                                    </p>
                                </div>
                            </div>

                            {/* Itemized List */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">
                                    Item yang Dibeli
                                </h3>
                                
                                <div className="rounded-md border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                                            <TableRow>
                                                <TableHead>Produk</TableHead>
                                                <TableHead className="text-right w-24">Harga Satuan</TableHead>
                                                <TableHead className="text-center w-16">Jumlah</TableHead>
                                                <TableHead className="text-right w-32">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedTransaction.details && selectedTransaction.details.length > 0 ? (
                                                selectedTransaction.details.map((detail) => {
                                                    const price = detail.product?.price ?? 0;
                                                    const subtotal = price * detail.qty;
                                                    return (
                                                        <TableRow key={detail.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                                                            <TableCell className="font-medium">
                                                                {detail.product?.name ?? 'Produk tidak dikenal'}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {formatCurrency(price)}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                {detail.qty}x
                                                            </TableCell>
                                                            <TableCell className="text-right font-semibold text-zinc-900 dark:text-white">
                                                                {formatCurrency(subtotal)}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-muted-foreground text-center py-4">
                                                        Tidak ada data item untuk transaksi ini.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <Separator />

                            {/* Total Price Box */}
                            <div className="flex items-center justify-between rounded-lg bg-zinc-950 p-4 text-white dark:bg-zinc-900 border border-zinc-800">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-zinc-400">Total Pembayaran</p>
                                    <p className="text-zinc-500 text-[10px] mt-0.5">
                                        {selectedTransaction.midtrans_order_id ? `Midtrans ID: ${selectedTransaction.midtrans_order_id}` : 'Pembayaran Kasir'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-emerald-400">
                                        {formatCurrency(selectedTransaction.total_price)}
                                    </p>
                                    {selectedTransaction.paid_at && (
                                        <p className="text-[10px] text-zinc-400 mt-0.5">
                                            Lunas pada {formatDate(selectedTransaction.paid_at)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Close Action */}
                            <div className="flex justify-end pt-2">
                                <Button onClick={() => setIsDetailOpen(false)} variant="outline" className="px-6">
                                    Tutup
                                </Button>
                            </div>
                        </div>
                    )}
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
