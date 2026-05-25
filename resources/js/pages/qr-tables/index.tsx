import { Head } from '@inertiajs/react';
import QRCode from 'qrcode';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { dashboard } from '@/routes';
import {
    Download,
    ExternalLink,
    Printer,
    QrCode,
    TableProperties,
    Utensils,
} from 'lucide-react';

const TABLE_COUNT = 15; // configurable: number of tables

function useQRDataUrl(url: string) {
    const [dataUrl, setDataUrl] = useState('');

    useEffect(() => {
        if (!url) return;
        QRCode.toDataURL(url, {
            width: 300,
            margin: 2,
            color: { dark: '#2c1a0e', light: '#fdf8f2' },
        })
            .then(setDataUrl)
            .catch(() => setDataUrl(''));
    }, [url]);

    return dataUrl;
}

function TableQRCard({
    tableNumber,
    baseUrl,
    onPrint,
}: {
    tableNumber: number;
    baseUrl: string;
    onPrint: (tableNumber: number) => void;
}) {
    const orderUrl = `${baseUrl}/order/table/${tableNumber}`;
    const qrDataUrl = useQRDataUrl(orderUrl);
    const linkRef = useRef<HTMLAnchorElement>(null);

    const handleDownload = () => {
        if (!qrDataUrl) return;
        const a = document.createElement('a');
        a.href = qrDataUrl;
        a.download = `qr-meja-${tableNumber}.png`;
        a.click();
    };

    return (
        <Card className="relative overflow-hidden border-zinc-200/60 dark:border-zinc-800/60 hover:shadow-md transition-shadow">
            {/* Table Number Badge */}
            <div className="absolute top-3 right-3">
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-bold text-xs">
                    <Utensils className="size-3 mr-1" /> Meja {tableNumber}
                </Badge>
            </div>

            <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                    <TableProperties className="size-4 text-indigo-500" />
                    Meja {tableNumber}
                </CardTitle>
                <CardDescription className="text-xs truncate text-zinc-500">{orderUrl}</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col items-center gap-4">
                {/* QR Code */}
                <div className="w-44 h-44 rounded-xl overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center bg-[#fdf8f2]">
                    {qrDataUrl ? (
                        <img src={qrDataUrl} alt={`QR Meja ${tableNumber}`} className="w-full h-full object-contain" />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-zinc-400">
                            <QrCode className="size-10 animate-pulse" />
                            <span className="text-xs">Generating...</span>
                        </div>
                    )}
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex w-full gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={handleDownload}
                        disabled={!qrDataUrl}
                    >
                        <Download className="size-3.5 mr-1.5" /> Unduh
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => onPrint(tableNumber)}
                        disabled={!qrDataUrl}
                    >
                        <Printer className="size-3.5 mr-1.5" /> Print
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="px-2.5"
                        asChild
                    >
                        <a href={orderUrl} target="_blank" rel="noopener noreferrer" title="Buka halaman order">
                            <ExternalLink className="size-3.5" />
                        </a>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function QrTablesPage() {
    const [tableCount, setTableCount] = useState(TABLE_COUNT);
    const [inputCount, setInputCount] = useState(String(TABLE_COUNT));
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

    const handleCountChange = () => {
        const val = Math.min(50, Math.max(1, Number(inputCount)));
        setTableCount(val);
        setInputCount(String(val));
    };

    const handlePrintTable = (tableNumber: number) => {
        const orderUrl = `${baseUrl}/order/table/${tableNumber}`;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Generate QR for print
        QRCode.toDataURL(orderUrl, { width: 400, margin: 2, color: { dark: '#2c1a0e', light: '#fdf8f2' } })
            .then(qrDataUrl => {
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>QR Meja ${tableNumber} - Lunar Coffee</title>
                        <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body { font-family: 'Be Vietnam Pro', Georgia, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fdf8f2; }
                            .card { text-align: center; padding: 40px; border: 2px solid #d4b896; border-radius: 16px; background: white; max-width: 380px; width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
                            .logo { font-size: 22px; font-weight: 700; color: #2c1a0e; margin-bottom: 8px; }
                            .table-label { font-size: 36px; font-weight: 800; color: #2c1a0e; margin: 12px 0; }
                            .subtitle { font-size: 14px; color: #8b6343; margin-bottom: 20px; }
                            img { width: 240px; height: 240px; border: 2px solid #e8d5bc; border-radius: 12px; }
                            .instruction { font-size: 13px; color: #8b6343; margin-top: 16px; line-height: 1.5; }
                            .url { font-size: 11px; color: #b0856a; margin-top: 12px; word-break: break-all; }
                            @media print { body { background: white; } .card { box-shadow: none; } }
                        </style>
                    </head>
                    <body>
                        <div class="card">
                            <div class="logo">☕ Lunar Coffee</div>
                            <div class="table-label">Meja ${tableNumber}</div>
                            <div class="subtitle">Scan untuk memesan langsung dari meja</div>
                            <img src="${qrDataUrl}" alt="QR Code" />
                            <div class="instruction">📱 Arahkan kamera ponsel ke QR Code di atas untuk mulai memesan tanpa antri!</div>
                            <div class="url">${orderUrl}</div>
                        </div>
                    </body>
                    </html>
                `);
                printWindow.document.close();
                setTimeout(() => { printWindow.print(); }, 500);
            })
            .catch(() => printWindow.close());
    };

    const handlePrintAll = () => {
        Array.from({ length: tableCount }, (_, i) => i + 1).forEach((n, idx) => {
            setTimeout(() => handlePrintTable(n), idx * 800);
        });
    };

    const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

    return (
        <>
            <Head title="QR Meja — Admin" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">QR Code Meja</h1>
                    <p className="text-muted-foreground text-sm">
                        Generate dan cetak QR code untuk setiap meja. Tamu cukup scan untuk langsung memesan tanpa login.
                    </p>
                </div>

                {/* Config Bar */}
                <Card className="border-indigo-500/10 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/10 dark:to-zinc-900">
                    <CardContent className="pt-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="table-count" className="text-sm font-medium">Jumlah Meja</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="table-count"
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={inputCount}
                                        onChange={e => setInputCount(e.target.value)}
                                        className="w-24"
                                    />
                                    <Button variant="outline" size="sm" onClick={handleCountChange}>Terapkan</Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Maks. 50 meja</p>
                            </div>
                            <div className="flex-1" />
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handlePrintAll}>
                                    <Printer className="size-4 mr-2" />
                                    Cetak Semua ({tableCount} meja)
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Banner */}
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 dark:border-amber-900/30 dark:bg-amber-950/20 px-4 py-3">
                    <QrCode className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-300">
                        <p className="font-semibold">Cara Kerja</p>
                        <p className="text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                            Setiap QR code mengarah ke halaman order khusus meja tersebut. Tamu langsung bisa memesan tanpa perlu login. Nama pembeli otomatis tercatat sebagai <strong>"Meja {'{N}'}"</strong> di sistem.
                        </p>
                    </div>
                </div>

                {/* QR Grid */}
                <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {tables.map(n => (
                        <TableQRCard
                            key={n}
                            tableNumber={n}
                            baseUrl={baseUrl}
                            onPrint={handlePrintTable}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}

QrTablesPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'QR Meja', href: '/qr-tables' },
    ],
};
