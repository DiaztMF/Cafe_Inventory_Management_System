import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/api-client';
import {
    Coffee,
    CreditCard,
    Banknote,
    QrCode,
    Check,
    Clock,
    ArrowLeft,
    Loader2,
    AlertCircle,
    ShieldCheck,
    X,
} from 'lucide-react';

type ProductItem = {
    id: number;
    name: string;
    price: number;
    stock: number;
};

type TransactionDetail = {
    id: number;
    product_id: number;
    qty: number;
    product: ProductItem;
};

type Transaction = {
    id: number;
    total_price: number;
    buyer_name: string;
    status: string;
    payment_method: string | null;
    midtrans_snap_token: string | null;
    paid_at: string | null;
    details: TransactionDetail[];
};

function formatRupiah(value: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);
}

type PaymentMethod = 'qris' | 'cash' | null;

type PayResponse = {
    payment_method: string;
    snap_token?: string;
    redirect_url?: string;
    message?: string;
    transaction: Transaction;
};

export default function Checkout({
    transaction,
    midtransClientKey,
}: {
    transaction: Transaction;
    midtransClientKey: string;
}) {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [paymentStatus, setPaymentStatus] = useState(transaction.status);
    const [currentTransaction, setCurrentTransaction] = useState(transaction);
    const [snapLoaded, setSnapLoaded] = useState(false);

    // Load Midtrans Snap.js
    useEffect(() => {
        if (document.getElementById('midtrans-snap-script')) {
            setSnapLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.id = 'midtrans-snap-script';
        script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', midtransClientKey);
        script.onload = () => setSnapLoaded(true);
        document.head.appendChild(script);
    }, [midtransClientKey]);

    // Poll for payment status
    useEffect(() => {
        if (paymentStatus !== 'waiting_payment') return;

        const interval = setInterval(async () => {
            try {
                const data = await apiRequest<{
                    status: string;
                    payment_method: string | null;
                    paid_at: string | null;
                }>(`/orders/${currentTransaction.id}/status`);
                if (data.status !== paymentStatus) {
                    setPaymentStatus(data.status);
                    if (data.status === 'paid' || data.status === 'completed') {
                        clearInterval(interval);
                    }
                }
            } catch {
                // Ignore polling errors
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [paymentStatus, currentTransaction.id]);

    const handlePayment = useCallback(async () => {
        if (!selectedMethod) return;
        setProcessing(true);
        setError('');

        try {
            const data = await apiRequest<PayResponse>(
                `/orders/${currentTransaction.id}/pay`,
                'POST',
                { payment_method: selectedMethod },
            );

            setCurrentTransaction(data.transaction);

            if (selectedMethod === 'qris' && data.snap_token) {
                // Open Midtrans Snap popup
                if (
                    snapLoaded &&
                    typeof window !== 'undefined' &&
                    (window as unknown as { snap: { pay: (token: string, options: object) => void } }).snap
                ) {
                    const snap = (window as unknown as { snap: { pay: (token: string, options: object) => void } })
                        .snap;
                    snap.pay(data.snap_token, {
                        onSuccess: () => {
                            setPaymentStatus('paid');
                        },
                        onPending: () => {
                            setPaymentStatus('waiting_payment');
                        },
                        onError: () => {
                            setError('Pembayaran gagal. Silakan coba lagi.');
                            setPaymentStatus('pending');
                        },
                        onClose: () => {
                            setPaymentStatus('waiting_payment');
                        },
                    });
                } else {
                    // Fallback: redirect to Midtrans page
                    if (data.redirect_url) {
                        window.location.href = data.redirect_url;
                    }
                }
            } else if (selectedMethod === 'cash') {
                setPaymentStatus('waiting_payment');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment failed');
        } finally {
            setProcessing(false);
        }
    }, [selectedMethod, currentTransaction.id, snapLoaded]);

    const statusConfig: Record<
        string,
        {
            label: string;
            color: string;
            bgColor: string;
            icon: typeof Check;
        }
    > = {
        pending: {
            label: 'Menunggu Pembayaran',
            color: 'text-amber-700',
            bgColor: 'bg-amber-50 border-amber-200',
            icon: Clock,
        },
        waiting_payment: {
            label: 'Menunggu Konfirmasi',
            color: 'text-blue-700',
            bgColor: 'bg-blue-50 border-blue-200',
            icon: Clock,
        },
        paid: {
            label: 'Pembayaran Berhasil',
            color: 'text-green-700',
            bgColor: 'bg-green-50 border-green-200',
            icon: Check,
        },
        processing: {
            label: 'Sedang Diproses',
            color: 'text-indigo-700',
            bgColor: 'bg-indigo-50 border-indigo-200',
            icon: Loader2,
        },
        completed: {
            label: 'Selesai',
            color: 'text-green-700',
            bgColor: 'bg-green-50 border-green-200',
            icon: ShieldCheck,
        },
        cancelled: {
            label: 'Dibatalkan',
            color: 'text-red-700',
            bgColor: 'bg-red-50 border-red-200',
            icon: X,
        },
    };

    const currentStatus = statusConfig[paymentStatus] || statusConfig.pending;
    const StatusIcon = currentStatus.icon;

    const isPayable = paymentStatus === 'pending';
    const isSuccess = paymentStatus === 'paid' || paymentStatus === 'completed';
    const isCancelled = paymentStatus === 'cancelled';

    return (
        <>
            <Head title="Checkout — Lunar Coffee">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;500;600;700&family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="landing-light min-h-screen bg-lunar-creamy-white font-sans antialiased">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-lunar-creamy-white/90 backdrop-blur-xl border-b border-lunar-warm-latte/50">
                    <div className="mx-auto max-w-[720px] flex items-center justify-between px-6 py-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 font-serif text-lg font-bold text-lunar-deep-roast hover:opacity-80 transition-opacity"
                        >
                            <Coffee className="size-6" />
                            <span>Lunar Coffee</span>
                        </Link>
                        <Link href="/" className="flex items-center gap-1.5 text-sm text-lunar-deep-roast-light hover:text-lunar-deep-roast transition-colors">
                            <ArrowLeft className="size-4" />
                            <span>Kembali</span>
                        </Link>
                    </div>
                </header>

                <main className="mx-auto max-w-[720px] px-6 py-8 lg:py-12">
                    {/* Status Banner */}
                    <div className={`mb-8 flex items-center gap-3 px-5 py-4 rounded-xl border ${currentStatus.bgColor}`}>
                        <StatusIcon className={`size-5 shrink-0 ${currentStatus.color} ${paymentStatus === 'processing' ? 'animate-spin' : ''}`} />
                        <div>
                            <p className={`font-semibold ${currentStatus.color}`}>{currentStatus.label}</p>
                            <p className={`text-sm opacity-75 ${currentStatus.color}`}>
                                Order #{currentTransaction.id} • {currentTransaction.buyer_name}
                            </p>
                        </div>
                    </div>

                    {/* Order Details */}
                    <Card className="mb-6 border-lunar-warm-latte/50 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="font-serif text-xl text-lunar-deep-roast flex items-center gap-2">
                                <CreditCard className="size-5" />
                                Detail Pesanan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {currentTransaction.details.map((detail) => (
                                    <div
                                        key={detail.id}
                                        className="flex items-center justify-between py-2.5 border-b border-lunar-warm-latte/20 last:border-0"
                                    >
                                        <div className="flex-1">
                                            <span className="text-sm font-semibold text-lunar-deep-roast">{detail.product.name}</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-lunar-brown-muted">
                                                    {formatRupiah(detail.product.price)} × {detail.qty}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-lunar-deep-roast">
                                            {formatRupiah(detail.product.price * detail.qty)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <Separator className="my-4 bg-lunar-warm-latte" />

                            <div className="flex items-center justify-between">
                                <span className="font-serif text-lg font-bold text-lunar-deep-roast">Total</span>
                                <span className="font-serif text-2xl font-bold text-lunar-deep-roast">
                                    {formatRupiah(currentTransaction.total_price)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Method Selection */}
                    {isPayable && (
                        <Card className="mb-6 border-lunar-warm-latte/50 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="font-serif text-xl text-lunar-deep-roast">Pilih Metode Pembayaran</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                    {/* QRIS */}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedMethod('qris')}
                                        className={`relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${
                                            selectedMethod === 'qris'
                                                ? 'border-lunar-deep-roast bg-lunar-warm-latte-light shadow-md scale-[1.02]'
                                                : 'border-lunar-warm-latte/50 bg-white hover:border-lunar-deep-roast/40 hover:shadow-sm'
                                        }`}
                                        id="payment-method-qris"
                                    >
                                        {selectedMethod === 'qris' && (
                                            <div className="absolute top-3 right-3">
                                                <Check className="size-5 text-lunar-deep-roast" />
                                            </div>
                                        )}
                                        <div
                                            className={`p-4 rounded-full transition-colors ${
                                                selectedMethod === 'qris' ? 'bg-lunar-deep-roast text-white' : 'bg-lunar-warm-latte-light text-lunar-deep-roast group-hover:bg-lunar-warm-latte'
                                            }`}
                                        >
                                            <QrCode className="size-8" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold text-lunar-deep-roast text-base">QRIS</p>
                                            <p className="text-xs text-lunar-brown-muted mt-1">Scan QR dari GoPay, ShopeePay, dll.</p>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className={`text-[0.6875rem] ${
                                                selectedMethod === 'qris'
                                                    ? 'bg-lunar-deep-roast text-white'
                                                    : 'bg-lunar-warm-latte-light text-lunar-deep-roast-light'
                                            }`}
                                        >
                                            Digital Payment
                                        </Badge>
                                    </button>

                                    {/* Cash */}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedMethod('cash')}
                                        className={`relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${
                                            selectedMethod === 'cash'
                                                ? 'border-lunar-deep-roast bg-lunar-warm-latte-light shadow-md scale-[1.02]'
                                                : 'border-lunar-warm-latte/50 bg-white hover:border-lunar-deep-roast/40 hover:shadow-sm'
                                        }`}
                                        id="payment-method-cash"
                                    >
                                        {selectedMethod === 'cash' && (
                                            <div className="absolute top-3 right-3">
                                                <Check className="size-5 text-lunar-deep-roast" />
                                            </div>
                                        )}
                                        <div
                                            className={`p-4 rounded-full transition-colors ${
                                                selectedMethod === 'cash' ? 'bg-lunar-deep-roast text-white' : 'bg-lunar-warm-latte-light text-lunar-deep-roast group-hover:bg-lunar-warm-latte'
                                            }`}
                                        >
                                            <Banknote className="size-8" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold text-lunar-deep-roast text-base">Cash</p>
                                            <p className="text-xs text-lunar-brown-muted mt-1">Bayar langsung di kasir</p>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className={`text-[0.6875rem] ${
                                                selectedMethod === 'cash'
                                                    ? 'bg-lunar-deep-roast text-white'
                                                    : 'bg-lunar-warm-latte-light text-lunar-deep-roast-light'
                                            }`}
                                        >
                                            Bayar di Tempat
                                        </Badge>
                                    </button>
                                </div>

                                {error && (
                                    <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                                        <AlertCircle className="size-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <Button
                                    onClick={handlePayment}
                                    disabled={!selectedMethod || processing}
                                    className="w-full bg-lunar-deep-roast hover:bg-lunar-deep-roast-light text-white text-base py-6 disabled:opacity-50"
                                    id="pay-button"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>Memproses...</span>
                                        </>
                                    ) : selectedMethod === 'qris' ? (
                                        <>
                                            <QrCode className="size-4" />
                                            <span>Bayar via QRIS — {formatRupiah(currentTransaction.total_price)}</span>
                                        </>
                                    ) : selectedMethod === 'cash' ? (
                                        <>
                                            <Banknote className="size-4" />
                                            <span>Konfirmasi Bayar Cash — {formatRupiah(currentTransaction.total_price)}</span>
                                        </>
                                    ) : (
                                        <span>Pilih Metode Pembayaran</span>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Waiting for payment confirmation (Cash) */}
                    {paymentStatus === 'waiting_payment' && currentTransaction.payment_method === 'cash' && (
                        <Card className="mb-6 border-blue-200 bg-blue-50/50 shadow-sm">
                            <CardContent className="pt-6 text-center">
                                <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                                    <Banknote className="size-8 text-blue-600" />
                                </div>
                                <h3 className="font-serif text-xl font-bold text-blue-900 mb-2">Menunggu Pembayaran Cash</h3>
                                <p className="text-sm text-blue-700 mb-4 max-w-md mx-auto">
                                    Silakan tunjukkan nomor pesanan ini ke kasir dan lakukan pembayaran. Pesanan Anda akan dikonfirmasi setelah pembayaran diterima.
                                </p>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-lg">
                                    <span className="text-xs text-blue-600 font-medium">Nomor Pesanan</span>
                                    <span className="font-serif text-lg font-bold text-blue-900">#{currentTransaction.id}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Waiting for QRIS payment */}
                    {paymentStatus === 'waiting_payment' && currentTransaction.payment_method === 'qris' && (
                        <Card className="mb-6 border-indigo-200 bg-indigo-50/50 shadow-sm">
                            <CardContent className="pt-6 text-center">
                                <div className="mx-auto w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                                    <QrCode className="size-8 text-indigo-600 animate-pulse" />
                                </div>
                                <h3 className="font-serif text-xl font-bold text-indigo-900 mb-2">Menunggu Pembayaran QRIS</h3>
                                <p className="text-sm text-indigo-700 mb-4 max-w-md mx-auto">
                                    Kami sedang menunggu konfirmasi pembayaran QRIS Anda. Halaman ini akan otomatis terupdate.
                                </p>
                                <div className="flex items-center justify-center gap-2 text-xs text-indigo-500">
                                    <Loader2 className="size-3 animate-spin" />
                                    <span>Memeriksa status pembayaran...</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Payment Success */}
                    {isSuccess && (
                        <Card className="mb-6 border-green-200 bg-green-50/50 shadow-sm">
                            <CardContent className="pt-6 text-center">
                                <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                                    <ShieldCheck className="size-10 text-green-600" />
                                </div>
                                <h3 className="font-serif text-2xl font-bold text-green-900 mb-2">Pembayaran Berhasil!</h3>
                                <p className="text-sm text-green-700 mb-6 max-w-md mx-auto">
                                    Terima kasih! Pesanan Anda sedang diproses. Silakan tunggu pesanan Anda disiapkan.
                                </p>
                                <Button
                                    asChild
                                    className="bg-lunar-deep-roast hover:bg-lunar-deep-roast-light text-white px-8"
                                >
                                    <Link href="/">Kembali ke Menu</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Cancelled */}
                    {isCancelled && (
                        <Card className="mb-6 border-red-200 bg-red-50/50 shadow-sm">
                            <CardContent className="pt-6 text-center">
                                <div className="mx-auto w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                    <X className="size-10 text-red-600" />
                                </div>
                                <h3 className="font-serif text-2xl font-bold text-red-900 mb-2">Pesanan Dibatalkan</h3>
                                <p className="text-sm text-red-700 mb-6">Pesanan ini telah dibatalkan. Stok produk telah dikembalikan.</p>
                                <Button
                                    asChild
                                    className="bg-lunar-deep-roast hover:bg-lunar-deep-roast-light text-white px-8"
                                >
                                    <Link href="/">Pesan Lagi</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Security Note */}
                    <div className="text-center text-xs text-lunar-brown-muted mt-8 flex items-center justify-center gap-1.5">
                        <ShieldCheck className="size-3.5" />
                        <span>Pembayaran diproses melalui Midtrans — aman & terenkripsi</span>
                    </div>
                </main>
            </div>
        </>
    );
}
