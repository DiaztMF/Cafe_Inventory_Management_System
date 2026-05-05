import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Coffee, MapPin, Clock, Star, Leaf, ChevronDown, Award } from 'lucide-react';

/* ─── Fade-in hook ─── */
function useFadeIn<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { el.classList.add('lunar-visible'); obs.unobserve(el); } },
            { threshold: 0.15 },
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return ref;
}

/* ─── Data ─── */
const menuItems = [
    { name: 'Espresso Classico', desc: 'Rich double-shot espresso with a velvety crema', price: 'Rp 28.000', tag: 'Signature' },
    { name: 'Lunar Latte', desc: 'Our house blend with steamed oat milk and vanilla', price: 'Rp 38.000', tag: 'Best Seller' },
    { name: 'Matcha Serenity', desc: 'Ceremonial-grade matcha whisked with creamy milk', price: 'Rp 42.000', tag: 'New' },
    { name: 'Caramel Macchiato', desc: 'Espresso layered with caramel and foamed milk', price: 'Rp 40.000', tag: '' },
    { name: 'Cold Brew Tonic', desc: 'Slow-steeped cold brew over sparkling tonic water', price: 'Rp 35.000', tag: 'Refreshing' },
    { name: 'Affogato Bliss', desc: 'Vanilla gelato drowned in a shot of hot espresso', price: 'Rp 45.000', tag: '' },
];

const testimonials = [
    { name: 'Fadlan Khoirul A.', text: 'The coziest coffee spot in town. Their Lunar Latte is absolutely divine!', rating: 5 },
    { name: 'Marcell Dimas S.', text: 'Perfect atmosphere for remote work. Great wifi and even better coffee.', rating: 5 },
    { name: 'Naufal Azzam H.', text: 'I love the minimalist vibe. The matcha latte is a must-try!', rating: 4 },
    { name: 'Fadlan Khoirul A.', text: 'The coziest coffee spot in town. Their Lunar Latte is absolutely divine!', rating: 5 },
    { name: 'Marcell Dimas S.', text: 'Perfect atmosphere for remote work. Great wifi and even better coffee.', rating: 5 },
    { name: 'Naufal Azzam H.', text: 'I love the minimalist vibe. The matcha latte is a must-try!', rating: 4 },
];

/* ─── Component ─── */
export default function Welcome({ canRegister = true }: { canRegister?: boolean }) {
    const { auth } = usePage().props;
    const [mobileOpen, setMobileOpen] = useState(false);
    const heroRef = useFadeIn<HTMLDivElement>();
    const aboutRef = useFadeIn<HTMLElement>();
    const menuRef = useFadeIn<HTMLElement>();
    const galleryRef = useFadeIn<HTMLElement>();
    const reviewRef = useFadeIn<HTMLElement>();
    const ctaRef = useFadeIn<HTMLElement>();

    return (
        <>
            <Head title="Lunar Coffee — Your Quiet Morning Escape">
                <meta name="description" content="Lunar Coffee is a cozy, minimalist cafe offering artisan coffee, fresh pastries, and a serene atmosphere." />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;500;600;700&family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            <div className="landing-light min-h-screen bg-lunar-creamy-white text-lunar-dark-espresso font-sans antialiased overflow-x-hidden">
                {/* ═══ NAVBAR ═══ */}
                <nav className="fixed inset-x-0 top-0 z-50 bg-lunar-creamy-white/85 backdrop-blur-xl border-b border-lunar-warm-latte/50" id="navbar">
                    <div className="mx-auto max-w-[1200px] flex items-center justify-between px-6 py-3.5 lg:px-8">
                        <Link href="/" className="flex items-center gap-2.5 font-serif text-xl font-bold text-lunar-deep-roast hover:opacity-80 transition-opacity">
                            <Coffee className="size-7" />
                            <span>Lunar Coffee</span>
                        </Link>

                        <div className="hidden md:flex items-center gap-8">
                            {['About', 'Menu', 'Gallery', 'Reviews'].map((item) => (
                                <a key={item} href={`#${item.toLowerCase()}`} className="relative text-sm font-medium text-lunar-dark-espresso hover:text-lunar-deep-roast transition-colors after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-0.5 after:bg-lunar-deep-roast after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left">
                                    {item}
                                </a>
                            ))}
                        </div>

                        <div className="hidden md:flex items-center gap-3">
                            {auth.user ? (
                                <Button asChild className="bg-lunar-deep-roast hover:bg-lunar-deep-roast-light"><Link href={dashboard()}>Dashboard</Link></Button>
                            ) : (
                                <>
                                    <Button variant="ghost" asChild className="text-lunar-deep-roast hover:bg-lunar-warm-latte-light"><Link href={login()}>Log in</Link></Button>
                                    {canRegister && <Button asChild className="bg-lunar-deep-roast hover:bg-lunar-deep-roast-light"><Link href={register()}>Register</Link></Button>}
                                </>
                            )}
                        </div>

                        <button className="flex flex-col gap-[5px] md:hidden p-1" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu" id="mobile-menu-toggle">
                            <span className={`block w-[22px] h-0.5 bg-lunar-deep-roast rounded transition-all ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                            <span className={`block w-[22px] h-0.5 bg-lunar-deep-roast rounded transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
                            <span className={`block w-[22px] h-0.5 bg-lunar-deep-roast rounded transition-all ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
                        </button>
                    </div>

                    {mobileOpen && (
                        <div className="flex flex-col gap-3 px-6 pb-5 border-t border-lunar-warm-latte md:hidden" id="mobile-menu">
                            {['About', 'Menu', 'Gallery', 'Reviews'].map((item) => (
                                <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileOpen(false)} className="text-base font-medium py-2">{item}</a>
                            ))}
                            <Separator className="bg-lunar-warm-latte" />
                            <div className="flex flex-col gap-2">
                                {auth.user ? (
                                    <Button asChild className="w-full bg-lunar-deep-roast hover:bg-lunar-deep-roast-light"><Link href={dashboard()}>Dashboard</Link></Button>
                                ) : (
                                    <>
                                        <Button variant="outline" asChild className="w-full border-lunar-warm-latte text-lunar-deep-roast"><Link href={login()}>Log in</Link></Button>
                                        {canRegister && <Button asChild className="w-full bg-lunar-deep-roast hover:bg-lunar-deep-roast-light"><Link href={register()}>Register</Link></Button>}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </nav>

                {/* ═══ HERO ═══ */}
                <section className="min-h-screen flex flex-col lg:flex-row items-center gap-10 lg:gap-16 mx-auto max-w-[1200px] px-6 pt-28 pb-12 lg:px-8 lg:pt-32" id="hero">
                    <div className="flex-1 text-center lg:text-left lunar-fade-in" ref={heroRef}>
                        <Badge variant="secondary" className="mb-6 bg-lunar-warm-latte-light text-lunar-deep-roast-light border-transparent rounded-full px-4 py-1.5 text-[0.8125rem] font-semibold tracking-wide">
                            <Leaf className="size-4" /> Artisan Coffee Experience
                        </Badge>
                        <h1 className="font-serif text-[clamp(2.5rem,5.5vw,4rem)] font-bold leading-[1.1] text-lunar-deep-roast mb-6">
                            Your Quiet<br />Morning Escape
                        </h1>
                        <p className="text-lg leading-relaxed text-lunar-deep-roast-light font-light max-w-[480px] mb-8 mx-auto lg:mx-0">
                            Savor the moment with hand-crafted coffee, warm pastries, and the gentle hum of a space designed for calm.
                        </p>
                        <div className="flex gap-4 justify-center lg:justify-start flex-wrap mb-10">
                            <Button asChild size="lg" className="bg-lunar-deep-roast hover:bg-lunar-deep-roast-light px-8 text-[0.9375rem]">
                                <a href="#menu">Explore Our Menu</a>
                            </Button>
                            <Button variant="outline" asChild size="lg" className="border-lunar-warm-latte text-lunar-deep-roast hover:bg-lunar-warm-latte-light hover:border-lunar-deep-roast px-8">
                                <a href="#about">Our Story <ChevronDown className="size-4" /></a>
                            </Button>
                        </div>
                        <div className="flex items-center gap-6 justify-center lg:justify-start">
                            {[{ num: '12+', label: 'Coffee Origins' }, { num: '5K+', label: 'Happy Customers' }, { num: '4.9', label: 'Rating' }].map((stat, i) => (
                                <div key={stat.label} className="flex items-center gap-6">
                                    {i > 0 && <Separator orientation="vertical" className="h-10 bg-lunar-warm-latte" />}
                                    <div className="text-center">
                                        <span className="block font-serif text-2xl font-bold text-lunar-deep-roast">{stat.num}</span>
                                        <span className="text-xs font-medium text-lunar-brown-muted tracking-wide">{stat.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 relative flex justify-center lunar-fade-in" ref={useFadeIn<HTMLDivElement>()}>
                        <img src="/images/hero-coffee.png" alt="Latte art coffee on wooden table" className="w-full max-w-[435px] rounded-2xl shadow-lg object-cover aspect-[4/5]" loading="eager" />
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-lunar-creamy-white/92 backdrop-blur-sm px-5 py-2.5 rounded-full text-[0.8125rem] font-semibold text-lunar-deep-roast shadow-md whitespace-nowrap">
                            <Coffee className="size-5" />
                            <span>Freshly Roasted Daily</span>
                        </div>
                    </div>
                </section>

                {/* ═══ ABOUT ═══ */}
                <section className="py-20 lg:py-24 px-6 lg:px-8 bg-lunar-warm-latte-light lunar-fade-in" id="about" ref={aboutRef}>
                    <div className="mx-auto max-w-[1200px] flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
                        <div className="flex-1 min-w-0">
                            <img src="/images/cafe-interior.png" alt="Lunar Coffee warm interior" className="w-full rounded-2xl shadow-lg object-cover aspect-[4/3]" loading="lazy" />
                        </div>
                        <div className="flex-1">
                            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-lunar-deep-roast-light mb-3 block">Our Story</span>
                            <h2 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-lunar-deep-roast leading-tight mb-4">
                                Brewed with Passion,<br />Served with Love
                            </h2>
                            <p className="text-base leading-relaxed text-lunar-deep-roast-light font-light mb-4">
                                Born from a love of slow mornings and perfectly pulled espresso, Lunar Coffee is more than a cafe — it's a sanctuary. Every bean is ethically sourced, every cup crafted with intention.
                            </p>
                            <p className="text-base leading-relaxed text-lunar-deep-roast-light font-light mb-6">
                                We believe that great coffee deserves a great atmosphere. That's why our space is designed with generous whitespace, warm materials, and soft lighting — so you can truly unwind.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {[{ icon: <Leaf className="size-5" />, text: 'Ethically Sourced' }, { icon: <Coffee className="size-5" />, text: 'Fresh Daily Roasts' }, { icon: <Star className="size-5" />, text: 'Award-Winning Blends' }].map((f) => (
                                    <div key={f.text} className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-[0.8125rem] font-semibold text-lunar-deep-roast shadow-sm">
                                        {f.icon}<span>{f.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ MENU ═══ */}
                <section className="py-20 lg:py-24 px-6 lg:px-8 lunar-fade-in" id="menu" ref={menuRef}>
                    <div className="mx-auto max-w-[1200px]">
                        <div className="text-center mb-12">
                            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-lunar-deep-roast-light mb-3 block">Our Menu</span>
                            <h2 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-lunar-deep-roast leading-tight mb-4">Crafted to Perfection</h2>
                            <p className="text-base text-lunar-brown-muted max-w-[480px] mx-auto leading-relaxed">Every drink tells a story. From classic espresso to signature creations, find your perfect cup.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {menuItems.map((item) => (
                                <Card key={item.name} className="relative border-lunar-warm-latte/50 bg-white hover:border-lunar-deep-roast hover:shadow-md hover:-translate-y-1 transition-all cursor-default" id={`menu-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}>
                                    <CardHeader>
                                        {item.tag && (
                                            <Badge className="absolute top-4 right-4 bg-lunar-fresh-mint text-lunar-mint-deep border-transparent rounded-full text-[0.6875rem] uppercase tracking-wide">
                                                {item.tag}
                                            </Badge>
                                        )}
                                        <CardTitle className="font-serif text-lg text-lunar-deep-roast">{item.name}</CardTitle>
                                        <CardDescription className="text-lunar-brown-muted leading-relaxed">{item.desc}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <span className="font-serif text-lg font-bold text-lunar-deep-roast">{item.price}</span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ GALLERY ═══ */}
                <section className="py-20 lg:py-24 px-6 lg:px-8 bg-lunar-warm-latte-light lunar-fade-in" id="gallery" ref={galleryRef}>
                    <div className="mx-auto max-w-[1200px] text-center">
                        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-lunar-deep-roast-light mb-3 block">Gallery</span>
                        <h2 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-lunar-deep-roast leading-tight mb-10">A Glimpse Inside</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 md:row-span-2 rounded-2xl overflow-hidden shadow-sm group">
                                <img src="/images/featured-drinks.png" alt="Signature drinks lineup" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                            </div>
                            <div className="rounded-2xl overflow-hidden shadow-sm group">
                                <img src="/images/hero-coffee.png" alt="Latte art detail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                            </div>
                            <div className="rounded-2xl overflow-hidden shadow-sm group">
                                <img src="/images/cafe-interior.png" alt="Cafe interior" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ TESTIMONIALS ═══ */}
                <section className="py-20 lg:py-24 px-6 lg:px-8 lunar-fade-in" id="reviews" ref={reviewRef}>
                    <div className="mx-auto max-w-[1200px] text-center">
                        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-lunar-deep-roast-light mb-3 block">Reviews</span>
                        <h2 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-lunar-deep-roast leading-tight mb-10">What Our Guests Say</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                            {testimonials.map((t) => (
                                <Card key={t.name} className="border-lunar-warm-latte/50 bg-white hover:shadow-md transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="flex gap-0.5 text-lunar-gold mb-4">
                                            {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="size-4" />)}
                                        </div>
                                        <p className="text-[0.9375rem] leading-relaxed text-lunar-dark-espresso italic mb-4">"{t.text}"</p>
                                        <span className="text-[0.8125rem] font-semibold text-lunar-deep-roast-light">— {t.name}</span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ CTA ═══ */}
                <section className="py-20 lg:py-24 px-6 lg:px-8 bg-lunar-deep-roast text-lunar-creamy-white lunar-fade-in" ref={ctaRef}>
                    <div className="mx-auto max-w-[640px] text-center">
                        <Coffee className="size-10 mx-auto mb-6 text-lunar-fresh-mint" />
                        <h2 className="font-serif text-[clamp(1.5rem,4vw,2.25rem)] font-bold mb-4">Ready for Your First Cup?</h2>
                        <p className="text-base leading-relaxed text-lunar-warm-latte mb-8">
                            Join the Lunar Coffee community. Create an account to pre-order, earn rewards, and never miss a new blend.
                        </p>
                        <div className="flex justify-center gap-4 flex-wrap">
                            {auth.user ? (
                                <Button asChild size="lg" className="bg-lunar-creamy-white text-lunar-deep-roast hover:bg-lunar-warm-latte px-8"><Link href={dashboard()}>Go to Dashboard</Link></Button>
                            ) : (
                                <>
                                    {canRegister && (
                                        <Button asChild size="lg" className="bg-lunar-creamy-white text-lunar-deep-roast hover:bg-lunar-warm-latte border-lunar-creamy-white px-8">
                                            <Link href={register()}>Create Account</Link>
                                        </Button>
                                    )}
                                    <Button variant="outline" asChild size="lg" className="bg-lunar-creamy-white text-lunar-deep-roast hover:bg-lunar-warm-latte border-lunar-creamy-white px-8">
                                        <Link href={login()}>Sign In</Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {/* ═══ FOOTER ═══ */}
                <footer className="bg-lunar-footer-bg text-lunar-warm-latte px-6 lg:px-8 pt-12 pb-6">
                    <div className="mx-auto max-w-[1200px]">
                        <div className="mb-6">
                            <div className="flex items-center gap-2 font-serif text-lg font-bold text-lunar-creamy-white mb-1">
                                <Coffee className="size-6" /><span>Lunar Coffee</span>
                            </div>
                            <p className="text-sm text-lunar-brown-soft">Your quiet morning escape.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-6 sm:gap-16 mb-8">
                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-lunar-fresh-mint-dark mb-2">Visit Us</h4>
                                <p className="text-sm leading-relaxed"><MapPin className="size-4 inline -mt-0.5 mr-1" />Jl. Setiabudi No. 12, Bandung</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-lunar-fresh-mint-dark mb-2">Hours</h4>
                                <p className="text-sm leading-relaxed"><Clock className="size-4 inline -mt-0.5 mr-1" />Mon–Sat: 7AM – 9PM</p>
                                <p className="text-sm leading-relaxed"><Clock className="size-4 inline -mt-0.5 mr-1" />Sun: 8AM – 6PM</p>
                            </div>
                        </div>
                        <Separator className="bg-lunar-warm-latte/15 mb-6" />
                        <p className="text-[0.8125rem] text-lunar-brown-muted">&copy; {new Date().getFullYear()} Lunar Coffee. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
