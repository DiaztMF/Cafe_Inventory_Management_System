import { CircleAlert, Database, Package, ReceiptText, Shapes } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { index as categoriesIndex } from '@/routes/categories';
import { index as productsIndex } from '@/routes/products';
import { index as transactionDetailsIndex } from '@/routes/transaction-details';
import { index as transactionsIndex } from '@/routes/transactions';

type Category = {
    id: number;
    name: string;
    description: string | null;
    created_at: string;
};

type Product = {
    id: number;
    category_id: number;
    name: string;
    price: number;
    stock: number;
    created_at: string;
    category?: Pick<Category, 'id' | 'name'> | null;
};

type TransactionDetail = {
    id: number;
    transaction_id: number;
    product_id: number;
    qty: number;
    created_at: string;
    transaction?: Pick<Transaction, 'id' | 'buyer_name'> | null;
    product?: Pick<Product, 'id' | 'name' | 'price'> | null;
};

type Cashier = {
    id: number;
    name: string;
    email: string;
};

type Transaction = {
    id: number;
    total_price: number;
    buyer_name: string;
    cashier_id: number | null;
    status: string;
    payment_method: string | null;
    created_at: string;
    cashier?: Cashier | null;
    details?: TransactionDetail[];
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});
const PAGE_SIZE = 6;

function formatCurrency(value: number): string {
    return currencyFormatter.format(value);
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

async function getJson<T>(url: string, resourceName: string): Promise<T> {
    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Gagal memuat ${resourceName} (${response.status}).`);
    }

    return (await response.json()) as T;
}

function MetricCard({
    title,
    value,
    description,
    icon: Icon,
}: {
    title: string;
    value: string;
    description: string;
    icon: typeof Database;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                <div>
                    <CardDescription>{title}</CardDescription>
                    <CardTitle className="mt-2 text-2xl">{value}</CardTitle>
                </div>
                <Badge variant="secondary" className="mt-1">
                    <Icon className="size-3.5" />
                    Live
                </Badge>
            </CardHeader>
            <CardContent className="text-muted-foreground text-xs">{description}</CardContent>
        </Card>
    );
}

function TableToolbar({
    searchValue,
    searchPlaceholder,
    onSearchChange,
    page,
    totalPages,
    totalRows,
    onPrev,
    onNext,
}: {
    searchValue: string;
    searchPlaceholder: string;
    onSearchChange: (value: string) => void;
    page: number;
    totalPages: number;
    totalRows: number;
    onPrev: () => void;
    onNext: () => void;
}) {
    return (
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full md:max-w-sm"
            />

            <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground min-w-40 text-right">
                    {totalRows} baris • halaman {page}/{totalPages}
                </span>
                <Button variant="outline" size="sm" onClick={onPrev} disabled={page <= 1}>
                    Prev
                </Button>
                <Button variant="outline" size="sm" onClick={onNext} disabled={page >= totalPages}>
                    Next
                </Button>
            </div>
        </div>
    );
}

function getPaginatedRows<T>(rows: T[], page: number) {
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;

    return {
        rows: rows.slice(start, start + PAGE_SIZE),
        totalPages,
        safePage,
    };
}

export function PosDataHub() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [transactionDetails, setTransactionDetails] = useState<TransactionDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categorySearch, setCategorySearch] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [transactionSearch, setTransactionSearch] = useState('');
    const [transactionDetailSearch, setTransactionDetailSearch] = useState('');
    const [categoryPage, setCategoryPage] = useState(1);
    const [productPage, setProductPage] = useState(1);
    const [transactionPage, setTransactionPage] = useState(1);
    const [transactionDetailPage, setTransactionDetailPage] = useState(1);

    useEffect(() => {
        const abortController = new AbortController();

        async function loadData() {
            setLoading(true);
            setError(null);

            try {
                const [categoriesResponse, productsResponse, transactionsResponse, detailsResponse] =
                    await Promise.all([
                        getJson<Category[]>(categoriesIndex.url(), 'kategori'),
                        getJson<Product[]>(productsIndex.url(), 'produk'),
                        getJson<Transaction[]>(transactionsIndex.url(), 'transaksi'),
                        getJson<TransactionDetail[]>(transactionDetailsIndex.url(), 'detail transaksi'),
                    ]);

                if (abortController.signal.aborted) {
                    return;
                }

                setCategories(categoriesResponse);
                setProducts(productsResponse);
                setTransactions(transactionsResponse);
                setTransactionDetails(detailsResponse);
            } catch (fetchError) {
                if (abortController.signal.aborted) {
                    return;
                }

                setError(fetchError instanceof Error ? fetchError.message : 'Terjadi kesalahan saat memuat data.');
            } finally {
                if (!abortController.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void loadData();

        return () => {
            abortController.abort();
        };
    }, []);

    const totalItemsSold = useMemo(
        () => transactionDetails.reduce((sum, detail) => sum + detail.qty, 0),
        [transactionDetails]
    );

    const totalRevenue = useMemo(
        () => transactions.reduce((sum, transaction) => sum + transaction.total_price, 0),
        [transactions]
    );

    const filteredCategories = useMemo(() => {
        const keyword = categorySearch.trim().toLowerCase();

        if (!keyword) {
            return categories;
        }

        return categories.filter((category) => {
            return (
                category.name.toLowerCase().includes(keyword) ||
                category.description?.toLowerCase().includes(keyword) ||
                category.id.toString().includes(keyword)
            );
        });
    }, [categories, categorySearch]);

    const filteredProducts = useMemo(() => {
        const keyword = productSearch.trim().toLowerCase();

        if (!keyword) {
            return products;
        }

        return products.filter((product) => {
            return (
                product.name.toLowerCase().includes(keyword) ||
                product.category?.name?.toLowerCase().includes(keyword) ||
                product.id.toString().includes(keyword)
            );
        });
    }, [products, productSearch]);

    const filteredTransactions = useMemo(() => {
        const keyword = transactionSearch.trim().toLowerCase();

        if (!keyword) {
            return transactions;
        }

        return transactions.filter((transaction) => {
            return (
                transaction.id.toString().includes(keyword) ||
                transaction.buyer_name.toLowerCase().includes(keyword) ||
                transaction.cashier?.name?.toLowerCase().includes(keyword)
            );
        });
    }, [transactions, transactionSearch]);

    const filteredTransactionDetails = useMemo(() => {
        const keyword = transactionDetailSearch.trim().toLowerCase();

        if (!keyword) {
            return transactionDetails;
        }

        return transactionDetails.filter((detail) => {
            return (
                detail.id.toString().includes(keyword) ||
                detail.transaction_id.toString().includes(keyword) ||
                detail.product?.name?.toLowerCase().includes(keyword)
            );
        });
    }, [transactionDetails, transactionDetailSearch]);

    const paginatedCategories = useMemo(
        () => getPaginatedRows(filteredCategories, categoryPage),
        [filteredCategories, categoryPage]
    );
    const paginatedProducts = useMemo(
        () => getPaginatedRows(filteredProducts, productPage),
        [filteredProducts, productPage]
    );
    const paginatedTransactions = useMemo(
        () => getPaginatedRows(filteredTransactions, transactionPage),
        [filteredTransactions, transactionPage]
    );
    const paginatedTransactionDetails = useMemo(
        () => getPaginatedRows(filteredTransactionDetails, transactionDetailPage),
        [filteredTransactionDetails, transactionDetailPage]
    );

    useEffect(() => {
        setCategoryPage((currentPage) => Math.min(currentPage, paginatedCategories.totalPages));
    }, [paginatedCategories.totalPages]);

    useEffect(() => {
        setProductPage((currentPage) => Math.min(currentPage, paginatedProducts.totalPages));
    }, [paginatedProducts.totalPages]);

    useEffect(() => {
        setTransactionPage((currentPage) => Math.min(currentPage, paginatedTransactions.totalPages));
    }, [paginatedTransactions.totalPages]);

    useEffect(() => {
        setTransactionDetailPage((currentPage) => Math.min(currentPage, paginatedTransactionDetails.totalPages));
    }, [paginatedTransactionDetails.totalPages]);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-8 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-3 w-36" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-60" />
                        <Skeleton className="h-4 w-72" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <CircleAlert className="size-4" />
                    <AlertTitle>Data belum bisa ditampilkan</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Kategori"
                    value={categories.length.toString()}
                    description="Data dari endpoint categories"
                    icon={Shapes}
                />
                <MetricCard
                    title="Produk"
                    value={products.length.toString()}
                    description="Data dari endpoint products"
                    icon={Package}
                />
                <MetricCard
                    title="Transaksi"
                    value={transactions.length.toString()}
                    description="Data dari endpoint transactions"
                    icon={ReceiptText}
                />
                <MetricCard
                    title="Total Omzet"
                    value={formatCurrency(totalRevenue)}
                    description={`${totalItemsSold} item terjual`}
                    icon={Database}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Kategori</CardTitle>
                    <CardDescription>Berikut seluruh kategori yang tersimpan di model Category.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TableToolbar
                        searchValue={categorySearch}
                        searchPlaceholder="Cari kategori (nama / deskripsi / id)..."
                        onSearchChange={(value) => {
                            setCategorySearch(value);
                            setCategoryPage(1);
                        }}
                        page={paginatedCategories.safePage}
                        totalPages={paginatedCategories.totalPages}
                        totalRows={filteredCategories.length}
                        onPrev={() => setCategoryPage((value) => Math.max(1, value - 1))}
                        onNext={() =>
                            setCategoryPage((value) => Math.min(paginatedCategories.totalPages, value + 1))
                        }
                    />
                    <Table>
                        <TableCaption>
                            Menampilkan {paginatedCategories.rows.length} dari {filteredCategories.length} kategori
                        </TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Nama</TableHead>
                                <TableHead>Deskripsi</TableHead>
                                <TableHead>Dibuat</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedCategories.rows.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell>#{category.id}</TableCell>
                                    <TableCell className="font-medium">{category.name}</TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        {category.description ?? '-'}
                                    </TableCell>
                                    <TableCell>{formatDate(category.created_at)}</TableCell>
                                </TableRow>
                            ))}
                            {paginatedCategories.rows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-muted-foreground py-6 text-center">
                                        Tidak ada kategori yang cocok.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Produk</CardTitle>
                    <CardDescription>
                        Menampilkan relasi Product ke Category dari controller ProductController.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TableToolbar
                        searchValue={productSearch}
                        searchPlaceholder="Cari produk (nama / kategori / id)..."
                        onSearchChange={(value) => {
                            setProductSearch(value);
                            setProductPage(1);
                        }}
                        page={paginatedProducts.safePage}
                        totalPages={paginatedProducts.totalPages}
                        totalRows={filteredProducts.length}
                        onPrev={() => setProductPage((value) => Math.max(1, value - 1))}
                        onNext={() =>
                            setProductPage((value) => Math.min(paginatedProducts.totalPages, value + 1))
                        }
                    />
                    <Table>
                        <TableCaption>
                            Menampilkan {paginatedProducts.rows.length} dari {filteredProducts.length} produk
                        </TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Nama Produk</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Harga</TableHead>
                                <TableHead>Stok</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedProducts.rows.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>#{product.id}</TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.category?.name ?? 'Tanpa kategori'}</TableCell>
                                    <TableCell>{formatCurrency(product.price)}</TableCell>
                                    <TableCell>
                                        <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                                            {product.stock}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {paginatedProducts.rows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-muted-foreground py-6 text-center">
                                        Tidak ada produk yang cocok.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Separator />

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Transaksi</CardTitle>
                    <CardDescription>
                        Menampilkan relasi ke cashier dan details.product dari TransactionController.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TableToolbar
                        searchValue={transactionSearch}
                        searchPlaceholder="Cari transaksi (buyer / kasir / id)..."
                        onSearchChange={(value) => {
                            setTransactionSearch(value);
                            setTransactionPage(1);
                        }}
                        page={paginatedTransactions.safePage}
                        totalPages={paginatedTransactions.totalPages}
                        totalRows={filteredTransactions.length}
                        onPrev={() => setTransactionPage((value) => Math.max(1, value - 1))}
                        onNext={() =>
                            setTransactionPage((value) => Math.min(paginatedTransactions.totalPages, value + 1))
                        }
                    />
                    <Table>
                        <TableCaption>
                            Menampilkan {paginatedTransactions.rows.length} dari {filteredTransactions.length} transaksi
                        </TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Pembeli</TableHead>
                                <TableHead>Kasir</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Metode</TableHead>
                                <TableHead>Jumlah Item</TableHead>
                                <TableHead>Total Harga</TableHead>
                                <TableHead>Dibuat</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedTransactions.rows.map((transaction) => {
                                const totalQty = transaction.details?.reduce((sum, detail) => sum + detail.qty, 0) ?? 0;

                                return (
                                    <TableRow key={transaction.id}>
                                        <TableCell>#{transaction.id}</TableCell>
                                        <TableCell className="font-medium">{transaction.buyer_name}</TableCell>
                                        <TableCell>{transaction.cashier?.name ?? 'Belum ditentukan'}</TableCell>
                                        <TableCell>
                                            <Badge variant={transaction.status === 'completed' ? 'default' : transaction.status === 'cancelled' ? 'destructive' : 'secondary'}>
                                                {transaction.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{transaction.payment_method ?? '-'}</TableCell>
                                        <TableCell>{totalQty}</TableCell>
                                        <TableCell>{formatCurrency(transaction.total_price)}</TableCell>
                                        <TableCell>{formatDate(transaction.created_at)}</TableCell>
                                    </TableRow>
                                );
                            })}
                            {paginatedTransactions.rows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-muted-foreground py-6 text-center">
                                        Tidak ada transaksi yang cocok.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Detail Transaksi</CardTitle>
                    <CardDescription>Data item per transaksi dari model TransactionDetail.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TableToolbar
                        searchValue={transactionDetailSearch}
                        searchPlaceholder="Cari detail (id detail / id transaksi / produk)..."
                        onSearchChange={(value) => {
                            setTransactionDetailSearch(value);
                            setTransactionDetailPage(1);
                        }}
                        page={paginatedTransactionDetails.safePage}
                        totalPages={paginatedTransactionDetails.totalPages}
                        totalRows={filteredTransactionDetails.length}
                        onPrev={() => setTransactionDetailPage((value) => Math.max(1, value - 1))}
                        onNext={() =>
                            setTransactionDetailPage((value) =>
                                Math.min(paginatedTransactionDetails.totalPages, value + 1)
                            )
                        }
                    />
                    <Table>
                        <TableCaption>
                            Menampilkan {paginatedTransactionDetails.rows.length} dari{' '}
                            {filteredTransactionDetails.length} baris detail transaksi
                        </TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>ID Transaksi</TableHead>
                                <TableHead>Produk</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Subtotal</TableHead>
                                <TableHead>Dibuat</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedTransactionDetails.rows.map((detail) => {
                                const subtotal = (detail.product?.price ?? 0) * detail.qty;

                                return (
                                    <TableRow key={detail.id}>
                                        <TableCell>#{detail.id}</TableCell>
                                        <TableCell>#{detail.transaction_id}</TableCell>
                                        <TableCell>{detail.product?.name ?? 'Produk tidak tersedia'}</TableCell>
                                        <TableCell>{detail.qty}</TableCell>
                                        <TableCell>{formatCurrency(subtotal)}</TableCell>
                                        <TableCell>{formatDate(detail.created_at)}</TableCell>
                                    </TableRow>
                                );
                            })}
                            {paginatedTransactionDetails.rows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-muted-foreground py-6 text-center">
                                        Tidak ada detail transaksi yang cocok.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
