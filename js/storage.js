/**
 * Storage Module
 * Firebase-first product storage with localStorage fallback for preview/offline use
 */

const Storage = {
    PRODUCTS_KEY: 'sahapicks_products',
    CLICKS_KEY: 'sahapicks_clicks',
    THEME_KEY: 'sahapicks_theme',

    mode: 'local',
    initialized: false,
    productsCache: [],
    listeners: new Set(),
    unsubscribeRemote: null,
    firebaseError: null,

    async init() {
        if (this.initialized) {
            return this.mode;
        }

        this.initialized = true;

        const firebaseReady =
            typeof window !== 'undefined' &&
            window.FirebaseBridge &&
            typeof window.FirebaseBridge.isConfigured === 'function' &&
            window.FirebaseBridge.isConfigured();

        if (firebaseReady) {
            try {
                const bridged = await window.FirebaseBridge.init();
                if (bridged) {
                    this.firebaseError = null;
                    this.mode = 'firebase';
                    this.productsCache = this.normalizeProducts(await window.FirebaseBridge.getProducts());

                    if (!this.productsCache.length) {
                        await window.FirebaseBridge.seedProducts(this.getSeedProducts());
                        this.productsCache = this.normalizeProducts(await window.FirebaseBridge.getProducts());
                    }

                    if (this.unsubscribeRemote) {
                        this.unsubscribeRemote();
                    }
                    this.unsubscribeRemote = await window.FirebaseBridge.onProductsChange((products) => {
                        this.productsCache = this.normalizeProducts(products);
                        this.notifyChange();
                    });

                    this.notifyChange();
                    return this.mode;
                }
            } catch (error) {
                this.firebaseError = error;
                this.mode = 'firebase-error';
                this.productsCache = [];
                console.error('Firebase connection failed.', error);
                this.notifyChange();
                return this.mode;
            }
        }

        this.mode = 'local';
        this.productsCache = this.getLocalProducts();

        if (!this.productsCache.length) {
            this.productsCache = this.getSeedProducts();
            this.saveLocalProducts(this.productsCache);
        } else {
            this.notifyChange();
        }

        return this.mode;
    },

    onChange(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    },

    notifyChange() {
        const snapshot = this.getProducts();
        this.listeners.forEach((callback) => {
            try {
                callback(snapshot);
            } catch (error) {
                console.error('Storage listener failed:', error);
            }
        });
    },

    normalizeProducts(products) {
        if (!Array.isArray(products)) {
            return [];
        }
        return products.map((product, index) => this.normalizeProduct(product, index));
    },

    normalizeProduct(product = {}, fallbackIndex = 0) {
        const price = Number(product.price ?? product.offerPrice ?? 0) || 0;
        const originalPrice = product.originalPrice === '' || product.originalPrice == null
            ? ''
            : Number(product.originalPrice);

        return {
            id: product.id || `${Date.now()}-${fallbackIndex}-${Math.random().toString(36).slice(2, 8)}`,
            title: product.title || '',
            description: product.description || '',
            price,
            offerPrice: Number(product.offerPrice ?? price) || 0,
            originalPrice: Number.isFinite(originalPrice) ? originalPrice : '',
            image: product.image || '',
            affiliateUrl: product.affiliateUrl || '',
            tags: Array.isArray(product.tags) ? product.tags : [],
            createdAt: product.createdAt || new Date().toISOString(),
            clickCount: Number(product.clickCount || 0),
        };
    },

    getLocalClicksFromProducts(products) {
        return products.reduce((acc, product) => {
            acc[product.id] = Number(product.clickCount || 0);
            return acc;
        }, {});
    },

    getLocalProducts() {
        try {
            const raw = localStorage.getItem(this.PRODUCTS_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            const clicks = this.getLocalClicks();
            return this.normalizeProducts(parsed).map((product) => ({
                ...product,
                clickCount: Number(product.clickCount || clicks[product.id] || 0),
            }));
        } catch (error) {
            console.error('Error reading products:', error);
            return [];
        }
    },

    saveLocalProducts(products) {
        try {
            const normalized = this.normalizeProducts(products);
            localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(normalized));
            localStorage.setItem(this.CLICKS_KEY, JSON.stringify(this.getLocalClicksFromProducts(normalized)));
            this.productsCache = normalized;
            this.notifyChange();
        } catch (error) {
            console.error('Error saving products:', error);
        }
    },

    getLocalClicks() {
        try {
            const raw = localStorage.getItem(this.CLICKS_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (error) {
            console.error('Error reading clicks:', error);
            return {};
        }
    },

    getProducts() {
        return [...this.productsCache];
    },

    async refreshProducts() {
        if (this.mode === 'firebase' && window.FirebaseBridge) {
            this.productsCache = this.normalizeProducts(await window.FirebaseBridge.getProducts());
        } else if (this.mode === 'firebase-error') {
            this.productsCache = [];
        } else {
            this.productsCache = this.getLocalProducts();
        }

        this.notifyChange();
        return this.getProducts();
    },

    async addProduct(product) {
        await this.init();
        const normalized = this.normalizeProduct(product);

        if (this.mode === 'firebase' && window.FirebaseBridge) {
            const created = await window.FirebaseBridge.addProduct(normalized);
            await this.refreshProducts();
            return created;
        }

        if (this.mode === 'firebase-error') {
            throw this.firebaseError || new Error('Firebase is configured but not available.');
        }

        const products = [normalized, ...this.getLocalProducts()];
        this.saveLocalProducts(products);
        return normalized;
    },

    async updateProduct(id, updates) {
        await this.init();

        if (this.mode === 'firebase' && window.FirebaseBridge) {
            const updated = await window.FirebaseBridge.updateProduct(id, updates);
            await this.refreshProducts();
            return updated;
        }

        if (this.mode === 'firebase-error') {
            throw this.firebaseError || new Error('Firebase is configured but not available.');
        }

        const products = this.getLocalProducts();
        const index = products.findIndex((product) => product.id === id);

        if (index === -1) {
            return null;
        }

        const merged = this.normalizeProduct({
            ...products[index],
            ...updates,
            id,
        });
        products[index] = merged;
        this.saveLocalProducts(products);
        return merged;
    },

    async deleteProduct(id) {
        await this.init();

        if (this.mode === 'firebase' && window.FirebaseBridge) {
            const deleted = await window.FirebaseBridge.deleteProduct(id);
            await this.refreshProducts();
            return deleted;
        }

        if (this.mode === 'firebase-error') {
            throw this.firebaseError || new Error('Firebase is configured but not available.');
        }

        const products = this.getLocalProducts().filter((product) => product.id !== id);
        if (products.length === this.productsCache.length) {
            return false;
        }

        this.saveLocalProducts(products);
        return true;
    },

    getProduct(id) {
        return this.getProducts().find((product) => product.id === id) || null;
    },

    getClickCount(productId) {
        return Number(this.getProduct(productId)?.clickCount || 0);
    },

    async incrementClickCount(productId) {
        await this.init();

        if (this.mode === 'firebase' && window.FirebaseBridge) {
            const updated = await window.FirebaseBridge.incrementClickCount(productId);
            await this.refreshProducts();
            return updated;
        }

        if (this.mode === 'firebase-error') {
            throw this.firebaseError || new Error('Firebase is configured but not available.');
        }

        const products = this.getLocalProducts();
        const index = products.findIndex((product) => product.id === productId);
        if (index === -1) {
            return null;
        }

        products[index].clickCount = Number(products[index].clickCount || 0) + 1;
        this.saveLocalProducts(products);
        return products[index].clickCount;
    },

    getTotalClicks() {
        return this.getProducts().reduce((sum, product) => sum + Number(product.clickCount || 0), 0);
    },

    exportProducts() {
        return JSON.stringify(this.getProducts(), null, 2);
    },

    async importProducts(jsonString, merge = false) {
        await this.init();

        try {
            const imported = JSON.parse(jsonString);
            if (!Array.isArray(imported)) {
                throw new Error('Invalid format: expected array');
            }

            const normalizedImported = this.normalizeProducts(imported).filter((product) => product.title && product.affiliateUrl);

            if (this.mode === 'firebase' && window.FirebaseBridge) {
                const success = await window.FirebaseBridge.importProducts(normalizedImported, merge);
                await this.refreshProducts();
                return success;
            }

            if (this.mode === 'firebase-error') {
                throw this.firebaseError || new Error('Firebase is configured but not available.');
            }

            const current = merge ? this.getLocalProducts() : [];
            const byId = new Map(current.map((product) => [product.id, product]));
            normalizedImported.forEach((product) => {
                byId.set(product.id, product);
            });

            this.saveLocalProducts(Array.from(byId.values()));
            return true;
        } catch (error) {
            console.error('Error importing products:', error);
            return false;
        }
    },

    async clearAllProducts() {
        await this.init();

        if (this.mode === 'firebase' && window.FirebaseBridge) {
            const success = await window.FirebaseBridge.clearProducts();
            await this.refreshProducts();
            return success;
        }

        if (this.mode === 'firebase-error') {
            throw this.firebaseError || new Error('Firebase is configured but not available.');
        }

        localStorage.removeItem(this.PRODUCTS_KEY);
        localStorage.removeItem(this.CLICKS_KEY);
        this.productsCache = [];
        this.notifyChange();
        return true;
    },

    getTheme() {
        return localStorage.getItem(this.THEME_KEY) || 'light';
    },

    setTheme(theme) {
        localStorage.setItem(this.THEME_KEY, theme);
    },

    toggleTheme() {
        const current = this.getTheme();
        const next = current === 'light' ? 'dark' : 'light';
        this.setTheme(next);
        return next;
    },

    setSeedData() {
        const seedProducts = this.getSeedProducts();
        if (this.mode === 'firebase' && window.FirebaseBridge) {
            return window.FirebaseBridge.seedProducts(seedProducts).then(() => seedProducts);
        }

        if (this.mode === 'firebase-error') {
            throw this.firebaseError || new Error('Firebase is configured but not available.');
        }

        this.saveLocalProducts(seedProducts);
        return seedProducts;
    },

    getSeedProducts() {
        return [
            {
                id: '1',
                title: 'Premium Wireless Headphones',
                description: 'High-quality wireless headphones with active noise cancellation and 30-hour battery life.',
                price: 4999,
                originalPrice: 7999,
                image: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Crect fill=%22%234F46E5%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2224%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EHeadphones%3C/text%3E%3C/svg%3E',
                affiliateUrl: 'https://www.amazon.in/s?k=wireless+headphones',
                tags: ['new', 'hot-deal', 'audio'],
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                clickCount: 0,
            },
            {
                id: '2',
                title: 'Smart Home Security Camera',
                description: 'Full HD smart security camera with night vision, motion detection, and mobile app alerts.',
                price: 2499,
                originalPrice: 3999,
                image: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Crect fill=%22%23EC4899%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2220%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ESecurity Cam%3C/text%3E%3C/svg%3E',
                affiliateUrl: 'https://www.amazon.in/s?k=security+camera',
                tags: ['trending', 'smart-home', 'hot-deal'],
                createdAt: new Date(Date.now() - 172800000).toISOString(),
                clickCount: 0,
            },
            {
                id: '3',
                title: 'Android 5G Smartphone',
                description: 'Feature-packed 5G smartphone with AMOLED display, fast charging, and a large battery.',
                price: 17999,
                originalPrice: 22999,
                image: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Crect fill=%2210B981%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2220%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ESmartphone%3C/text%3E%3C/svg%3E',
                affiliateUrl: 'https://www.amazon.in/s?k=5g+smartphone',
                tags: ['mobiles', 'trending'],
                createdAt: new Date(Date.now() - 259200000).toISOString(),
                clickCount: 0,
            },
            {
                id: '4',
                title: 'Portable USB-C Hub',
                description: '7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader, and 100W power delivery.',
                price: 1499,
                originalPrice: 2499,
                image: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Crect fill=%23F59E0B width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2224%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EUSB-C Hub%3C/text%3E%3C/svg%3E',
                affiliateUrl: 'https://www.amazon.in/s?k=usb-c+hub',
                tags: ['new', 'accessories'],
                createdAt: new Date(Date.now() - 3600000).toISOString(),
                clickCount: 0,
            },
            {
                id: '5',
                title: 'Premium Mechanical Keyboard',
                description: 'RGB mechanical keyboard with custom switches, hot-swap design, and programmable keys.',
                price: 3499,
                originalPrice: 5499,
                image: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Crect fill=%236366F1 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2220%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EKeyboard%3C/text%3E%3C/svg%3E',
                affiliateUrl: 'https://www.amazon.in/s?k=mechanical+keyboard',
                tags: ['hot-deal', 'trending', 'gaming'],
                createdAt: new Date(Date.now() - 7200000).toISOString(),
                clickCount: 0,
            },
            {
                id: '6',
                title: 'Thin and Light Laptop',
                description: 'Portable laptop for work, study, browsing, and streaming with all-day battery backup.',
                price: 42999,
                originalPrice: 52999,
                image: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Crect fill=%238B5CF6 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2220%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ELaptop%3C/text%3E%3C/svg%3E',
                affiliateUrl: 'https://www.amazon.in/s?k=laptop',
                tags: ['laptops', 'trending'],
                createdAt: new Date(Date.now() - 10800000).toISOString(),
                clickCount: 0,
            },
        ];
    },
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
