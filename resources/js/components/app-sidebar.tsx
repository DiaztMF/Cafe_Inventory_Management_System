import { Link } from '@inertiajs/react';
import { Boxes, LayoutGrid, Package, QrCode, ReceiptText, Shapes, ShoppingBasket } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Pesanan',
        href: '/orders-page',
        icon: Package,
    },
    {
        title: 'Kategori',
        href: '/categories-page',
        icon: Shapes,
    },
    {
        title: 'Produk',
        href: '/products-page',
        icon: ShoppingBasket,
    },
    {
        title: 'Transaksi',
        href: '/transactions-page',
        icon: ReceiptText,
    },
    {
        title: 'QR Meja',
        href: '/qr-tables',
        icon: QrCode,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
