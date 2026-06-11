const WC_API_URL = import.meta.env.VITE_WC_API_URL;
const CONSUMER_KEY = import.meta.env.VITE_WC_CONSUMER_KEY;
const CONSUMER_SECRET = import.meta.env.VITE_WC_CONSUMER_SECRET;

const authHeader = 'Basic ' + btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);

const CACHE_KEY_PRODUCTS = 'charistar_products_cache';

export const fetchProducts = async () => {
  // 1. Immediately return cached data if available (SWR pattern)
  const cachedData = localStorage.getItem(CACHE_KEY_PRODUCTS);
  let parsedCache = null;
  if (cachedData) {
    try {
      parsedCache = JSON.parse(cachedData);
    } catch (e) {}
  }

  // 2. Fetch fresh data in the background
  const fetchPromise = fetch(`${WC_API_URL}/products?per_page=100`, {
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    }
  }).then(async (response) => {
    if (!response.ok) throw new Error('Failed to fetch products');
    const wcProducts = await response.json();
    
    // Format products exactly how the React app expects them
    const formatted = wcProducts.map(wp => ({
      id: String(wp.id),
      title: wp.name,
      subtitle: wp.short_description ? wp.short_description.replace(/<[^>]+>/g, '') : '',
      price: '₦' + Number(wp.price).toLocaleString(),
      category: wp.categories?.length > 0 ? wp.categories[0].name : 'Uncategorized',
      image: wp.images?.length > 0 ? wp.images[0].src : '',
      img: wp.images?.length > 0 ? wp.images[0].src : '',
      sortOrder: wp.menu_order || 9999,
      active: wp.status === 'publish'
    }));
    
    formatted.sort((a, b) => a.sortOrder - b.sortOrder);
    
    // Only update cache if successful
    localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(formatted));
    
    // Dispatch event so UI can update smoothly in the background
    window.dispatchEvent(new CustomEvent('products_swr_update', { detail: formatted }));
    return formatted;
  });

  // If we have cached data, return it immediately (zero loading time)
  if (parsedCache && parsedCache.length > 0) {
    return parsedCache;
  }

  // Otherwise, wait for the fresh fetch (first time load)
  return fetchPromise;
};

export const fetchProduct = async (id) => {
  const response = await fetch(`${WC_API_URL}/products/${id}`, {
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) throw new Error('Failed to fetch product');
  return response.json();
};

export const createOrder = async (orderData) => {
  const response = await fetch(`${WC_API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  });
  if (!response.ok) throw new Error('Failed to create order');
  return response.json();
};
