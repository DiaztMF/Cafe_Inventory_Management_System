import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    AlertCircle,
    Banknote,
    Check,
    Clock,
    Coffee,
    Loader2,
    Minus,
    Plus,
    QrCode,
    ReceiptText,
    ShieldCheck,
    ShoppingCart,
    Utensils,
    X,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';

type Category = { id: number; name: string; description: string | null };
type Product = { id: number; name: string; price: number; stock: number; category_id: number; category: Category };
type CartItem = { product: Product; qty: number };

type TransactionDetail = { id: number; product_id: number; qty: number; product: Product };
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
type PayResponse = {
    payment_method: string;
    snap_token?: string;
    redirect_url?: string;
    message?: string;
    transaction: Transaction;
};

function formatRupiah(value: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

export default function TableOrderPage({ tableNumber, products }: { tableNumber: number; products: Product[] }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [phase, setPhase] = useState<'ordering' | 'checkout' | 'done'>('ordering');
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<'qris' | 'cash' | null>(null);
    const [orderLoading, setOrderLoading] = useState(false);
    const [payLoading, setPayLoading] = useState(false);
    const [orderError, setOrderError] = useState('');
    const [payError, setPayError] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [snapLoaded, setSnapLoaded] = useState(false);
    const midtransKey = useRef('');

    // Load Midtrans Snap.js when we land on checkout phase
    useEffect(() => {
        if (phase !== 'checkout') return;
        if (document.getElementById('midtrans-snap-script')) { setSnapLoaded(true); return; }
        const mk = (window as unknown as { midtransClientKey?: string }).midtransClientKey ?? '';
        midtransKey.current = mk;
        const script = document.createElement('script');
        script.id = 'midtrans-snap-script';
        script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', mk);
        script.onload = () => setSnapLoaded(true);
        document.head.appendChild(script);
    }, [phase]);

    // Poll payment status
    useEffect(() => {
        if (!transaction || paymentStatus !== 'waiting_payment') return;
        const interval = setInterval(async () => {
            try {
                const data = await apiRequest<{ status: string; paid_at: string | null }>(
                    `/order/table/${tableNumber}/status/${transaction.id}`,
                );
                if (data.status !== paymentStatus) {
                    setPaymentStatus(data.status);
                    if (data.status === 'paid' || data.status === 'completed') clearInterval(interval);
                }
            } catch { /* ignore */ }
        }, 5000);
        return () => clearInterval(interval);
    }, [paymentStatus, transaction, tableNumber]);

    const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
    const cartCount = cart.reduce((s, i) => s + i.qty, 0);

    const addToCart = useCallback((product: Product) => {
        setCart(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if (existing) {
                if (existing.qty >= product.stock) return prev;
                return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { product, qty: 1 }];
        });
    }, []);

    const updateQty = useCallback((productId: number, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.product.id !== productId) return i;
            const newQty = i.qty + delta;
            if (newQty <= 0) return i;
            if (newQty > i.product.stock) return i;
            return { ...i, qty: newQty };
        }));
    }, []);

    const removeFromCart = useCallback((productId: number) => {
        setCart(prev => prev.filter(i => i.product.id !== productId));
    }, []);

    const placeOrder = useCallback(async () => {
        if (cart.length === 0) return;
        setOrderLoading(true);
        setOrderError('');
        try {
            const result = await apiRequest<Transaction>(`/order/table/${tableNumber}`, 'POST', {
                items: cart.map(i => ({ product_id: i.product.id, qty: i.qty })),
            });
            setTransaction(result);
            setPaymentStatus(result.status);
            setPhase('checkout');
            setCartOpen(false);
            setCart([]);
        } catch (err) {
            setOrderError(err instanceof Error ? err.message : 'Gagal membuat pesanan.');
        } finally {
            setOrderLoading(false);
        }
    }, [cart, tableNumber]);

    const handlePay = useCallback(async () => {
        if (!selectedMethod || !transaction) return;
        setPayLoading(true);
        setPayError('');
        try {
            const data = await apiRequest<PayResponse>(
                `/order/table/${tableNumber}/pay/${transaction.id}`,
                'POST',
                { payment_method: selectedMethod },
            );
            setTransaction(data.transaction);
            if (selectedMethod === 'qris' && data.snap_token) {
                if (snapLoaded && (window as unknown as { snap?: { pay: (t: string, o: object) => void } }).snap) {
                    (window as unknown as { snap: { pay: (t: string, o: object) => void } }).snap.pay(data.snap_token, {
                        onSuccess: () => setPaymentStatus('paid'),
                        onPending: () => setPaymentStatus('waiting_payment'),
                        onError: () => { setPayError('Pembayaran gagal.'); setPaymentStatus('pending'); },
                        onClose: () => setPaymentStatus('waiting_payment'),
                    });
                } else if (data.redirect_url) {
                    window.location.href = data.redirect_url;
                }
            } else {
                setPaymentStatus('waiting_payment');
            }
        } catch (err) {
            setPayError(err instanceof Error ? err.message : 'Gagal memproses pembayaran.');
        } finally {
            setPayLoading(false);
        }
    }, [selectedMethod, transaction, tableNumber, snapLoaded]);

    const isSuccess = paymentStatus === 'paid' || paymentStatus === 'completed';

    /* ── CHECKOUT PHASE ── */
    if (phase === 'checkout' && transaction) {
        return (
            <>
                <Head title={`Meja ${tableNumber} — Lunar Coffee`} />
                <div className="landing-light min-h-screen bg-lunar-creamy-white font-sans antialiased">
                    <header className="sticky top-0 z-40 bg-lunar-creamy-white/90 backdrop-blur-xl border-b border-lunar-warm-latte/50">
                        <div className="mx-auto max-w-[640px] flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-2 font-serif text-lg font-bold text-lunar-deep-roast">
                                <Coffee className="size-5" /> Lunar Coffee
                            </div>
                            <div className="flex items-center gap-2 text-sm text-lunar-brown-muted">
                                <Utensils className="size-4" />
                                <span className="font-semibold text-lunar-deep-roast">Meja {tableNumber}</span>
                            </div>
                        </div>
                    </header>

                    <main className="mx-auto max-w-[640px] px-5 py-8 space-y-6">
                        {/* Status Banner */}
                        {isSuccess ? (
                            <div className="flex flex-col items-center text-center py-10 gap-4">
                                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                                    <ShieldCheck className="size-10 text-green-600" />
                                </div>
                                <h2 className="font-serif text-2xl font-bold text-green-900">Pembayaran Berhasil!</h2>
                                <p className="text-sm text-green-700 max-w-sm">
                                    Terima kasih! Pesanan Meja {tableNumber} sedang disiapkan. Silakan tunggu.
                                </p>
                                <Button
                                    onClick={() => { setPhase('ordering'); setTransaction(null); setSelectedMethod(null); setPaymentStatus(''); }}
                                    className="mt-2 bg-lunar-deep-roast hover:bg-lunar-deep-roast-light text-white px-8"
                                >
                                    Pesan Lagi
                                </Button>
                            </div>
                        ) : paymentStatus === 'waiting_payment' ? (
                            <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border ${transaction.payment_method === 'cash' ? 'bg-blue-50 border-blue-200' : 'bg-indigo-50 border-indigo-200'}`}>
                                {transaction.payment_method === 'cash' ? (
                                    <Banknote className="size-5 shrink-0 text-blue-600" />
                                ) : (
                                    <QrCode className="size-5 shrink-0 text-indigo-600 animate-pulse" />
                                )}
                                <div>
                                    <p className={`font-semibold ${transaction.payment_method === 'cash' ? 'text-blue-900' : 'text-indigo-900'}`}>
                                        {transaction.payment_method === 'cash' ? 'Menunggu Pembayaran di Kasir' : 'Menunggu Konfirmasi QRIS'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                        <Loader2 className="size-3 animate-spin" />
                                        Memeriksa status secara otomatis...
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 px-5 py-4 rounded-xl border bg-amber-50 border-amber-200">
                                <Clock className="size-5 shrink-0 text-amber-600" />
                                <div>
                                    <p className="font-semibold text-amber-900">Pesanan #{transaction.id} Dibuat</p>
                                    <p className="text-xs text-amber-700">Pilih metode pembayaran di bawah.</p>
                                </div>
                            </div>
                        )}

                        {/* Order Summary */}
                        <Card className="border-lunar-warm-latte/50 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="font-serif text-lg text-lunar-deep-roast flex items-center gap-2">
                                    <ReceiptText className="size-5" /> Ringkasan Pesanan
                                </CardTitle>
                                <CardDescription>Meja {tableNumber} • Pesanan #{transaction.id}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {transaction.details.map(d => (
                                        <div key={d.id} className="flex justify-between text-sm py-1.5 border-b border-lunar-warm-latte/20 last:border-0">
                                            <span className="text-lunar-deep-roast font-medium">{d.product.name} <span className="text-lunar-brown-muted font-normal">×{d.qty}</span></span>
                                            <span className="font-semibold text-lunar-deep-roast">{formatRupiah(d.product.price * d.qty)}</span>
                                        </div>
                                    ))}
                                </div>
                                <Separator className="my-3 bg-lunar-warm-latte" />
                                <div className="flex justify-between font-serif text-lg font-bold text-lunar-deep-roast">
                                    <span>Total</span>
                                    <span>{formatRupiah(Number(transaction.total_price))}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Method */}
                        {paymentStatus === 'pending' && (
                            <Card className="border-lunar-warm-latte/50 shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="font-serif text-lg text-lunar-deep-roast">Pilih Metode Pembayaran</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setSelectedMethod('qris')}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${selectedMethod === 'qris' ? 'border-lunar-deep-roast bg-lunar-warm-latte-light scale-[1.02] shadow-md' : 'border-lunar-warm-latte/50 hover:border-lunar-deep-roast/40'}`}
                                        >
                                            {selectedMethod === 'qris' && <Check className="absolute top-2 right-2 size-4 text-lunar-deep-roast" />}
                                            <div className={`p-3 rounded-full ${selectedMethod === 'qris' ? 'bg-lunar-deep-roast text-white' : 'bg-lunar-warm-latte-light text-lunar-deep-roast'}`}>
                                                <QrCode className="size-6" />
                                            </div>
                                            <p className="font-semibold text-sm text-lunar-deep-roast">QRIS</p>
                                            <p className="text-xs text-lunar-brown-muted text-center">GoPay, ShopeePay, dll</p>
                                        </button>
                                        <button
                                            onClick={() => setSelectedMethod('cash')}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${selectedMethod === 'cash' ? 'border-lunar-deep-roast bg-lunar-warm-latte-light scale-[1.02] shadow-md' : 'border-lunar-warm-latte/50 hover:border-lunar-deep-roast/40'}`}
                                        >
                                            <div className={`p-3 rounded-full ${selectedMethod === 'cash' ? 'bg-lunar-deep-roast text-white' : 'bg-lunar-warm-latte-light text-lunar-deep-roast'}`}>
                                                <Banknote className="size-6" />
                                            </div>
                                            <p className="font-semibold text-sm text-lunar-deep-roast">Cash</p>
                                            <p className="text-xs text-lunar-brown-muted text-center">Bayar di kasir</p>
                                        </button>
                                    </div>

                                    {payError && (
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                                            <AlertCircle className="size-4 shrink-0" /> {payError}
                                        </div>
                                    )}

                                    <Button
                                        onClick={handlePay}
                                        disabled={!selectedMethod || payLoading}
                                        className="w-full bg-lunar-deep-roast hover:bg-lunar-deep-roast-light text-white py-5 text-base"
                                    >
                                        {payLoading ? (
                                            <><Loader2 className="size-4 animate-spin mr-2" />Memproses...</>
                                        ) : selectedMethod === 'qris' ? (
                                            <><QrCode className="size-4 mr-2" />Bayar via QRIS — {formatRupiah(Number(transaction.total_price))}</>
                                        ) : selectedMethod === 'cash' ? (
                                            <><Banknote className="size-4 mr-2" />Konfirmasi Bayar Cash</>
                                        ) : (
                                            'Pilih Metode Pembayaran'
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </main>
                </div>
            </>
        );
    }

    /* ── ORDERING PHASE ── */
    return (
        <>
            <Head title={`Meja ${tableNumber} — Lunar Coffee`}>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;500;600;700&family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            </Head>
            <div className="landing-light min-h-screen bg-lunar-creamy-white font-sans antialiased">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-lunar-creamy-white/90 backdrop-blur-xl border-b border-lunar-warm-latte/50">
                    <div className="mx-auto max-w-[1200px] flex items-center justify-between px-5 py-3.5">
                        <div className="flex items-center gap-2.5 font-serif text-xl font-bold text-lunar-deep-roast">
                            <Coffee className="size-6" /> Lunar Coffee
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-sm font-semibold px-3 py-1">
                                <Utensils className="size-3.5 mr-1.5" /> Meja {tableNumber}
                            </Badge>
                            {cartCount > 0 && (
                                <button
                                    onClick={() => setCartOpen(!cartOpen)}
                                    className="relative flex items-center gap-2 bg-lunar-deep-roast text-white text-sm font-semibold px-3.5 py-2 rounded-lg hover:bg-lunar-deep-roast-light transition-colors"
                                >
                                    <ShoppingCart className="size-4" />
                                    <span>{cartCount} item</span>
                                    <span className="font-normal text-lunar-warm-latte">— {formatRupiah(cartTotal)}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-[1200px] px-5 py-8">
                    {/* Welcome Banner */}
                    <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="font-serif text-3xl font-bold text-lunar-deep-roast">Selamat Datang! 👋</h1>
                            <p className="text-lunar-brown-muted mt-1">Pilih menu favoritmu dari <strong>Meja {tableNumber}</strong>. Pesanan akan langsung diproses.</p>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {products.map(product => {
                            const inCart = cart.find(i => i.product.id === product.id);
                            return (
                                <Card key={product.id} className="border-lunar-warm-latte/50 bg-white hover:shadow-md transition-all">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="font-serif text-base text-lunar-deep-roast leading-tight">{product.name}</CardTitle>
                                                <CardDescription className="text-lunar-brown-muted text-xs mt-1">{product.category.name}</CardDescription>
                                            </div>
                                            <Badge variant="secondary" className="bg-lunar-warm-latte-light text-lunar-deep-roast-light border-transparent text-[0.6875rem] shrink-0 ml-2">
                                                {product.stock} sisa
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex items-center justify-between">
                                        <span className="font-serif text-lg font-bold text-lunar-deep-roast">{formatRupiah(product.price)}</span>
                                        {inCart ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => inCart.qty === 1 ? removeFromCart(product.id) : updateQty(product.id, -1)}
                                                    className="p-1.5 rounded-lg bg-lunar-warm-latte-light hover:bg-lunar-warm-latte text-lunar-deep-roast transition-colors"
                                                >
                                                    <Minus className="size-3.5" />
                                                </button>
                                                <span className="w-6 text-center text-sm font-semibold text-lunar-deep-roast">{inCart.qty}</span>
                                                <button
                                                    onClick={() => updateQty(product.id, 1)}
                                                    disabled={inCart.qty >= product.stock}
                                                    className="p-1.5 rounded-lg bg-lunar-deep-roast hover:bg-lunar-deep-roast-light text-white transition-colors disabled:opacity-40"
                                                >
                                                    <Plus className="size-3.5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <Button size="sm" onClick={() => addToCart(product)} className="text-white bg-lunar-deep-roast hover:bg-lunar-deep-roast-light text-xs px-4">
                                                <Plus className="size-3.5 mr-1" /> Tambah
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </main>

                {/* Cart Drawer */}
                {cartOpen && cart.length > 0 && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
                        <div className="relative bg-white w-full max-w-sm flex flex-col shadow-2xl">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-lunar-warm-latte/50">
                                <h2 className="font-serif text-lg font-bold text-lunar-deep-roast flex items-center gap-2">
                                    <ShoppingCart className="size-5" /> Keranjang Meja {tableNumber}
                                </h2>
                                <button onClick={() => setCartOpen(false)} className="p-1 text-lunar-brown-muted hover:text-red-500 transition-colors">
                                    <X className="size-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                                {cart.map(item => (
                                    <div key={item.product.id} className="flex items-center justify-between py-2 border-b border-lunar-warm-latte/20 last:border-0">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-lunar-deep-roast truncate">{item.product.name}</p>
                                            <p className="text-xs text-lunar-brown-muted">{formatRupiah(item.product.price)}</p>
                                        </div>
                                        <div className="flex items-center gap-2 ml-3">
                                            <button onClick={() => item.qty === 1 ? removeFromCart(item.product.id) : updateQty(item.product.id, -1)} className="p-1 rounded bg-lunar-warm-latte-light hover:bg-lunar-warm-latte text-lunar-deep-roast">
                                                <Minus className="size-3" />
                                            </button>
                                            <span className="w-5 text-center text-sm font-semibold">{item.qty}</span>
                                            <button onClick={() => updateQty(item.product.id, 1)} disabled={item.qty >= item.product.stock} className="p-1 rounded bg-lunar-deep-roast text-white disabled:opacity-40">
                                                <Plus className="size-3" />
                                            </button>
                                        </div>
                                        <span className="ml-3 text-sm font-bold text-lunar-deep-roast shrink-0">{formatRupiah(item.product.price * item.qty)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="px-5 py-4 border-t border-lunar-warm-latte/50 space-y-3">
                                <div className="flex justify-between font-serif text-lg font-bold text-lunar-deep-roast">
                                    <span>Total</span>
                                    <span>{formatRupiah(cartTotal)}</span>
                                </div>
                                {orderError && (
                                    <p className="text-sm text-red-600 flex items-center gap-1.5">
                                        <AlertCircle className="size-4 shrink-0" /> {orderError}
                                    </p>
                                )}
                                <Button onClick={placeOrder} disabled={orderLoading} className="w-full bg-lunar-deep-roast hover:bg-lunar-deep-roast-light text-white py-5 text-base">
                                    {orderLoading ? <><Loader2 className="size-4 animate-spin mr-2" />Memproses...</> : 'Buat Pesanan'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sticky Cart Button (mobile) */}
                {cartCount > 0 && !cartOpen && (
                    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 px-5">
                        <button
                            onClick={() => setCartOpen(true)}
                            className="flex items-center gap-3 bg-lunar-deep-roast text-white px-6 py-3.5 rounded-2xl shadow-xl hover:bg-lunar-deep-roast-light transition-colors"
                        >
                            <ShoppingCart className="size-5" />
                            <span className="font-semibold">{cartCount} item · {formatRupiah(cartTotal)}</span>
                            <span className="text-lunar-warm-latte text-sm">Lihat Keranjang →</span>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
