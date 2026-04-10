import { Head } from '@inertiajs/react';
import { PosDataHub } from '@/components/pos-data-hub';
import { dashboard } from '@/routes';

export default function ProductPage() {
    return (
        <>
            <Head title="Product" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <PosDataHub />
            </div>
        </>
    );
}

ProductPage.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'POS Data',
            href: '/product',
        },
    ],
};