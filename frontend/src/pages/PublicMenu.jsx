import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

function PublicMenu() {
	const { tenantSlug, branchSlug } = useParams();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [activeCategory, setActiveCategory] = useState(0);
	const [imageErrors, setImageErrors] = useState({});
	const categoriesRef = useRef([]);

	useEffect(() => {
		async function fetchMenu() {
			try {
				setLoading(true);
				const path = `/menu/public/${tenantSlug}/${branchSlug ? `${branchSlug}/` : ''}`;
				const res = await api.get(path);
				setData(res.data);
			} catch (err) {
				console.error('Failed to load public menu', err);
				toast.error('Failed to load menu');
			} finally {
				setLoading(false);
			}
		}
		fetchMenu();
	}, [tenantSlug, branchSlug]);

	const handleShare = async () => {
		const url = window.location.href;
		if (navigator.share) {
			try {
				await navigator.share({ title: data?.tenant?.business_name, text: `Check out ${data?.tenant?.business_name} menu`, url });
			} catch (e) {
				// user cancelled
			}
		} else {
			await navigator.clipboard.writeText(url);
			toast.success('Link copied to clipboard');
		}
	};

	const scrollToCategory = (index) => {
		setActiveCategory(index);
		categoriesRef.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	const handleScroll = useCallback(() => {
		if (!categoriesRef.current.length) return;
		const scrollPosition = window.scrollY + 120;
		let current = 0;
		categoriesRef.current.forEach((ref, index) => {
			if (ref && ref.offsetTop <= scrollPosition) {
				current = index;
			}
		});
		setActiveCategory(current);
	}, []);

	useEffect(() => {
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, [handleScroll]);

	const handleImageError = (itemId) => {
		setImageErrors(prev => ({ ...prev, [itemId]: true }));
	};

	if (loading) {
		return (
			<div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
				<div className="max-w-2xl mx-auto px-4 py-8">
					<div className="animate-pulse space-y-4">
						<div className="h-8 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
						<div className="h-4 rounded-lg w-2/3" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
						<div className="grid grid-cols-2 gap-4 mt-8">
							{[1,2,3,4].map(i => (
								<div key={i} className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
									<div className="h-32 w-full"></div>
									<div className="p-3 space-y-2">
										<div className="h-4 rounded w-3/4"></div>
										<div className="h-3 rounded w-1/2"></div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
				<div className="text-lg" style={{ color: 'var(--text-muted)' }}>Menu not found</div>
			</div>
		);
	}

	const isExpired = data.subscription_status === 'expired';
	const featuredItems = data.categories?.flatMap(c => c.items?.filter(i => i.featured) || []) || [];

	return (
		<div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
			{/* Hero Header */}
			<div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%)' }}>
				<div className="absolute inset-0 opacity-10">
					<div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white blur-2xl"></div>
					<div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-white blur-3xl"></div>
				</div>
				<div className="max-w-2xl mx-auto px-4 py-8 relative">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl md:text-4xl font-bold text-white mb-1">{data.tenant.business_name}</h1>
							<p className="text-white/80 text-sm md:text-base">📍 {data.branch.name}</p>
							{data.branch.location && (
								<p className="text-white/70 text-xs md:text-sm mt-1">{data.branch.location}</p>
							)}
						</div>
						<div className="flex gap-2">
							{data.branch.phone && (
								<a href={`tel:${data.branch.phone}`} className="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 hover:scale-110">
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.04 12.04 0 01-7.143-7.143c-.162-.441.004-.928.38-1.211l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
								</a>
							)}
							<button onClick={handleShare} className="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 hover:scale-110">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100-2.186m0 2.186v.375c0 .621.504 1.125 1.125 1.125h.375m-3.75 0h3.75m-3.75 0h3.75m-3.75 0h3.75M5.25 6.75h13.5m-13.5 0v9.75a2.25 2.25 0 002.25 2.25h.375m13.5-9.75v9.75a2.25 2.25 0 01-2.25 2.25h-.375m-13.5 0h13.5" /></svg>
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Expired Banner */}
			{isExpired && (
				<div className="max-w-2xl mx-auto px-4 mt-6 animate-fadeIn">
					<div className="rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
						<div className="text-4xl mb-2">😔</div>
						<p className="font-semibold text-lg" style={{ color: 'var(--error)' }}>Menu currently unavailable</p>
						<p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Subscription has expired. Please contact us to place an order.</p>
					</div>
				</div>
			)}

			{/* Featured Items */}
			{featuredItems.length > 0 && !isExpired && (
				<div className="max-w-2xl mx-auto px-4 mt-6">
					<h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
						<span>⭐</span> Featured
					</h2>
					<div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
						{featuredItems.map((item, index) => (
							<div key={item.id} className="card flex-shrink-0 w-64 snap-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: `${index * 100}ms` }}>
								{item.image_url && !imageErrors[item.id] ? (
									<img src={item.image_url} alt={item.name} className="w-full h-36 object-cover rounded-t-xl" onError={() => handleImageError(item.id)} />
								) : (
									<div className="w-full h-36 rounded-t-xl flex items-center justify-center text-4xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>🍽️</div>
								)}
								<div className="p-3">
									<h3 className="font-medium text-sm">{item.name}</h3>
									<p className="font-semibold text-sm mt-1" style={{ color: 'var(--accent)' }}>{item.price} {item.currency}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Category Tabs */}
			{!isExpired && data.categories?.length > 0 && (
				<div className="sticky top-0 z-30 border-b backdrop-blur-md" style={{ backgroundColor: 'rgba(var(--bg-card-rgb, 255,255,255), 0.9)', borderColor: 'var(--border-color)' }}>
					<div className="max-w-2xl mx-auto px-4">
						<div className="flex gap-2 overflow-x-auto py-3" style={{ scrollbarWidth: 'none' }}>
							{data.categories.map((cat, idx) => (
								<button
									key={cat.id}
									onClick={() => scrollToCategory(idx)}
									className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${activeCategory === idx ? 'shadow-lg scale-105' : 'hover:scale-105'}`}
									style={{
										backgroundColor: activeCategory === idx ? 'var(--accent)' : 'var(--bg-tertiary)',
										color: activeCategory === idx ? '#fff' : 'var(--text-secondary)',
										border: `1px solid ${activeCategory === idx ? 'var(--accent)' : 'var(--border-color)'}`
									}}
								>
									{cat.name}
								</button>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Menu Items */}
			{!isExpired && (
				<div className="max-w-2xl mx-auto px-4 pb-28">
					{data.categories?.map((cat, idx) => (
						<section key={cat.id} ref={el => categoriesRef.current[idx] = el} className="mt-6 scroll-mt-24">
							<div className="flex items-center gap-3 mb-4">
								<h2 className="text-xl font-bold">{cat.name}</h2>
								<div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }}></div>
							</div>
							<div className="space-y-3">
								{cat.items?.map((item) => (
									<div key={item.id} className="card p-0 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
										{item.image_url && !imageErrors[item.id] ? (
											<div className="relative overflow-hidden">
												<img src={item.image_url} alt={item.name} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500" onError={() => handleImageError(item.id)} />
												{item.is_out_of_stock && (
													<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
														<span className="px-3 py-1 rounded-full bg-white/90 text-sm font-semibold text-red-600">Out of Stock</span>
													</div>
												)}
											</div>
										) : (
											<div className="w-full h-32 flex items-center justify-center text-5xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>🍽️</div>
										)}
										<div className="p-4">
											<div className="flex justify-between items-start gap-3">
												<div className="flex-1">
													<h3 className="font-semibold text-base">{item.name}</h3>
													{item.description && (
														<p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
													)}
												</div>
												<div className="text-right flex-shrink-0">
													<span className="font-bold text-lg" style={{ color: 'var(--accent)' }}>{item.price} {item.currency}</span>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						</section>
					))}
				</div>
			)}

			{/* Bottom Action Bar */}
			{!isExpired && data.branch?.phone && (
				<div className="fixed bottom-0 left-0 right-0 border-t z-40 animate-slideUp" style={{ backgroundColor: 'rgba(var(--bg-card-rgb, 255,255,255), 0.95)', borderColor: 'var(--border-color)', backdropFilter: 'blur(12px)' }}>
					<div className="max-w-2xl mx-auto p-3 flex gap-3">
						<a href={`tel:${data.branch.phone}`} className="flex-1 text-center py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.04 12.04 0 01-7.143-7.143c-.162-.441.004-.928.38-1.211l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
							Call to Order
						</a>
						<button onClick={handleShare} className="flex-1 py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100-2.186m0 2.186v.375c0 .621.504 1.125 1.125 1.125h.375m-3.75 0h3.75m-3.75 0h3.75m-3.75 0h3.75M5.25 6.75h13.5m-13.5 0v9.75a2.25 2.25 0 002.25 2.25h.375m13.5-9.75v9.75a2.25 2.25 0 01-2.25 2.25h-.375m-13.5 0h13.5" /></svg>
							Share Menu
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default PublicMenu;
