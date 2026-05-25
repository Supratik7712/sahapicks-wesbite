/**
 * Products Module
 * Handles product filtering, searching, and sorting logic
 */

const Products = {
    /**
     * Get all products
     * @returns {Array} Array of products
     */
    getAll() {
        return Storage.getProducts();
    },

    /**
     * Sort products
     * @param {Array} products - Array of products to sort
     * @param {string} sortType - Sort type: 'newest', 'oldest', 'price-low', 'price-high'
     * @returns {Array} Sorted products
     */
    sort(products, sortType = 'newest') {
        const sorted = [...products];

        switch (sortType) {
            case 'newest':
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'price-low':
                sorted.sort((a, b) => (a.price || a.offerPrice || 0) - (b.price || b.offerPrice || 0));
                break;
            case 'price-high':
                sorted.sort((a, b) => (b.price || b.offerPrice || 0) - (a.price || a.offerPrice || 0));
                break;
            default:
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        return sorted;
    },

    /**
     * Search products by title and description
     * @param {Array} products - Array of products to search
     * @param {string} query - Search query
     * @returns {Array} Filtered products
     */
    search(products, query) {
        if (!query.trim()) return products;

        const searchTerm = query.toLowerCase();
        return products.filter(
            product =>
                (product.title && product.title.toLowerCase().includes(searchTerm)) ||
                (product.description && product.description.toLowerCase().includes(searchTerm)) ||
                (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    },

    /**
     * Filter products by tags
     * @param {Array} products - Array of products to filter
     * @param {string|Array} tags - Tag or array of tags to filter by
     * @returns {Array} Filtered products
     */
    filterByTag(products, tags) {
        if (!tags || (Array.isArray(tags) && tags.length === 0)) {
            return products;
        }

        const tagsArray = Array.isArray(tags) ? tags : [tags];

        return products.filter(product => {
            if (!product.tags || !Array.isArray(product.tags)) {
                return false;
            }
            return tagsArray.some(tag => product.tags.includes(tag));
        });
    },

    /**
     * Get products filtered by tag (single tag)
     * @param {Array} products - Array of products
     * @param {string} tag - Tag to filter by
     * @returns {Array} Filtered products
     */
    getByTag(products, tag) {
        if (tag === 'all') return products;
        return this.filterByTag(products, tag);
    },

    /**
     * Apply multiple filters
     * @param {Object} options - Filter options
     * @returns {Array} Filtered products
     */
    filter(options = {}) {
        let products = this.getAll();

        // Apply search filter
        if (options.search) {
            products = this.search(products, options.search);
        }

        // Apply tag filter
        if (options.tag && options.tag !== 'all') {
            products = this.filterByTag(products, options.tag);
        }

        // Apply sorting
        if (options.sort) {
            products = this.sort(products, options.sort);
        } else {
            // Default sort by newest
            products = this.sort(products, 'newest');
        }

        return products;
    },

    /**
     * Get trending products (hot deals and trending tags)
     * @returns {Array} Trending products
     */
    getTrending() {
        const products = this.getAll();
        return products.filter(p => p.tags && (p.tags.includes('hot-deal') || p.tags.includes('trending')));
    },

    /**
     * Get newest products
     * @param {number} limit - Number of products to return
     * @returns {Array} Newest products
     */
    getNewest(limit = 6) {
        const products = this.sort(this.getAll(), 'newest');
        return products.slice(0, limit);
    },

    /**
     * Get product by ID
     * @param {string} id - Product ID
     * @returns {Object|null} Product or null
     */
    getById(id) {
        return Storage.getProduct(id);
    },

    /**
     * Create new product
     * @param {Object} productData - Product data
     * @returns {Object} Created product
     */
    async create(productData) {
        return Storage.addProduct(productData);
    },

    /**
     * Update product
     * @param {string} id - Product ID
     * @param {Object} updates - Updates to apply
     * @returns {Object|null} Updated product or null
     */
    async update(id, updates) {
        return Storage.updateProduct(id, updates);
    },

    /**
     * Delete product
     * @param {string} id - Product ID
     * @returns {boolean} True if deleted
     */
    async delete(id) {
        return Storage.deleteProduct(id);
    },

    /**
     * Get unique tags from all products
     * @returns {Array} Array of unique tags
     */
    getAllTags() {
        const products = this.getAll();
        const tagsSet = new Set();

        products.forEach(product => {
            if (product.tags && Array.isArray(product.tags)) {
                product.tags.forEach(tag => tagsSet.add(tag));
            }
        });

        return Array.from(tagsSet);
    },

    /**
     * Format product data for display
     * @param {Object} product - Product object
     * @returns {Object} Formatted product
     */
    format(product) {
        return {
            ...product,
            priceFormatted: this.formatPrice(product.price || product.offerPrice || 0),
            originalPriceFormatted: product.originalPrice ? this.formatPrice(product.originalPrice) : '',
            dateFormatted: new Date(product.createdAt).toLocaleDateString(),
            timeAgo: this.getTimeAgo(product.createdAt),
        };
    },

    /**
     * Get time ago string
     * @param {string} dateString - ISO date string
     * @returns {string} Time ago text
     */
    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + ' years ago';

        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + ' months ago';

        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + ' days ago';

        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + ' hours ago';

        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + ' minutes ago';

        return Math.floor(seconds) + ' seconds ago';
    },

    /**
     * Validate product data
     * @param {Object} product - Product object
     * @returns {Object} Validation result with isValid and errors
     */
    validate(product) {
        const errors = [];

        if (!product.title || !product.title.trim()) {
            errors.push('Title is required');
        }

        if (!product.price || isNaN(parseFloat(product.price)) || parseFloat(product.price) < 0) {
            errors.push('Valid offer price is required');
        }

        if (!product.originalPrice || isNaN(parseFloat(product.originalPrice)) || parseFloat(product.originalPrice) < 0) {
            errors.push('Valid original price is required');
        }

        if (
            product.price &&
            product.originalPrice &&
            parseFloat(product.originalPrice) < parseFloat(product.price)
        ) {
            errors.push('Original price should be higher than or equal to offer price');
        }

        if (!product.description || !product.description.trim()) {
            errors.push('Description is required');
        }

        if (!product.affiliateUrl || !this.isValidUrl(product.affiliateUrl)) {
            errors.push('Valid affiliate URL is required');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    },

    /**
     * Check if URL is valid
     * @param {string} url - URL to validate
     * @returns {boolean} True if valid URL
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    formatPrice(value) {
        const amount = Number.parseFloat(value || 0);
        return `₹${Number.isFinite(amount) ? amount.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        }) : '0'}`;
    },

    /**
     * Export products as JSON
     * @returns {string} JSON string
     */
    export() {
        return Storage.exportProducts();
    },

    /**
     * Import products from JSON
     * @param {string} jsonString - JSON string
     * @param {boolean} merge - Merge or replace
     * @returns {boolean} Success
     */
    async import(jsonString, merge = false) {
        return Storage.importProducts(jsonString, merge);
    },
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Products;
}
