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
import { destroy, index, store, update } from '@/routes/categories';

type Category = {
    id: number;
    name: string;
    description: string | null;
    created_at: string;
};

type CategoryForm = {
    name: string;
    description: string;
};

const initialForm: CategoryForm = {
    name: '',
    description: '',
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

export default function CategoriesPage() {
    const [rows, setRows] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<CategoryForm>(initialForm);

    async function loadRows() {
        setLoading(true);
        setError(null);

        try {
            const data = await apiRequest<Category[]>(index.url());
            setRows(data);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Gagal memuat kategori.');
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

    function openEdit(row: Category) {
        setEditingId(row.id);
        setForm({
            name: row.name,
            description: row.description ?? '',
        });
        setIsDialogOpen(true);
    }

    async function submitForm(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const payload = {
                name: form.name,
                description: form.description.trim() || null,
            };

            if (editingId) {
                await apiRequest(update.url({ category: editingId }), 'PUT', payload);
            } else {
                await apiRequest(store.url(), 'POST', payload);
            }

            setIsDialogOpen(false);
            setForm(initialForm);
            setEditingId(null);
            await loadRows();
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Gagal menyimpan kategori.');
        } finally {
            setSaving(false);
        }
    }

    async function deleteRow(id: number) {
        const isConfirmed = window.confirm('Hapus kategori ini?');

        if (!isConfirmed) {
            return;
        }

        setError(null);

        try {
            await apiRequest(destroy.url({ category: id }), 'DELETE');
            await loadRows();
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'Gagal menghapus kategori.');
        }
    }

    return (
        <>
            <Head title="Kategori" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Kategori</CardTitle>
                            <CardDescription>Kelola seluruh data kategori (CRUD).</CardDescription>
                        </div>
                        <Button onClick={openCreate}>
                            <Plus className="size-4" />
                            Tambah Kategori
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
                                        <TableHead>Deskripsi</TableHead>
                                        <TableHead>Dibuat</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>#{row.id}</TableCell>
                                            <TableCell className="font-medium">{row.name}</TableCell>
                                            <TableCell>{row.description ?? '-'}</TableCell>
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
                                            <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                                                Belum ada kategori.
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
                        <DialogTitle>{editingId ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
                        <DialogDescription>
                            Isi data kategori di bawah ini lalu simpan perubahan.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitForm} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="category-name">Nama</Label>
                            <Input
                                id="category-name"
                                value={form.name}
                                onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category-description">Deskripsi</Label>
                            <Input
                                id="category-description"
                                value={form.description}
                                onChange={(event) =>
                                    setForm((value) => ({ ...value, description: event.target.value }))
                                }
                            />
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

CategoriesPage.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Kategori',
            href: '/categories-page',
        },
    ],
};
