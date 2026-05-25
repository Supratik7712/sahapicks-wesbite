/**
 * Admin Panel Module
 * Handles product management, import/export, and backup functionalities
 */

class AdminPanel {
    constructor() {
        this.editingId = null;
        this.init();
    }

    /**
     * Initialize admin panel
     */
    async init() {
        this.cacheElements();
        this.attachEventListeners();
        this.setupTheme();
        await Storage.init();
        Storage.onChange(() => this.loadProducts());
        if (Storage.mode === 'firebase-error' && Storage.firebaseError) {
            this.showToast(`Firebase error: ${Storage.firebaseError.message || 'connection failed'}`, 'error');
        }
        this.loadProducts();
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        // Theme
        this.themeToggle = document.getElementById('themeToggle');

        // Tab buttons
        this.tabButtons = document.querySelectorAll('.admin-nav-item');

        // Tabs
        this.productsTab = document.getElementById('products-tab');
        this.addProductTab = document.getElementById('add-product-tab');
        this.importExportTab = document.getElementById('import-export-tab');

        // Products table
        this.productsTableBody = document.getElementById('productsTableBody');
        this.totalProducts = document.getElementById('totalProducts');
        this.totalClicks = document.getElementById('totalClicks');

        // Product form
        this.productForm = document.getElementById('productForm');
        this.formTitle = document.getElementById('formTitle');
        this.productImageUrl = document.getElementById('productImageUrl');
        this.imagePreview = document.getElementById('imagePreview');
        this.productTitle = document.getElementById('productTitle');
        this.productPrice = document.getElementById('productPrice');
        this.productOriginalPrice = document.getElementById('productOriginalPrice');
        this.productDescription = document.getElementById('productDescription');
        this.productAffiliateUrl = document.getElementById('productAffiliateUrl');
        this.productTags = document.querySelectorAll('.tag-input');
        this.cancelBtn = document.getElementById('cancelBtn');

        // Import/Export
        this.exportBtn = document.getElementById('exportBtn');
        this.importFile = document.getElementById('importFile');
        this.importPlaceholder = document.querySelector('.import-placeholder');
        this.importBtn = document.getElementById('importBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');

        // Modal
        this.confirmModal = document.getElementById('confirmModal');
        this.confirmTitle = document.getElementById('confirmTitle');
        this.confirmMessage = document.getElementById('confirmMessage');
        this.confirmCancel = document.getElementById('confirmCancel');
        this.confirmDelete = document.getElementById('confirmDelete');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Tab buttons
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn));
        });

        // Theme
        this.themeToggle?.addEventListener('click', () => this.toggleTheme());

        // Form
        this.productForm?.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.cancelBtn?.addEventListener('click', () => this.resetForm());

        // Image URL preview
        this.productImageUrl?.addEventListener('input', () => this.handleImageUrlChange());
        this.productImageUrl?.addEventListener('blur', () => this.handleImageUrlChange());

        // Import/Export
        this.exportBtn?.addEventListener('click', () => this.exportProducts());
        this.importFile?.addEventListener('change', (e) => this.handleImportFile(e));
        this.importPlaceholder?.addEventListener('click', () => this.importFile?.click());
        this.importPlaceholder?.addEventListener('dragover', (e) => e.preventDefault());
        this.importPlaceholder?.addEventListener('drop', (e) => this.handleImportDrop(e));
        this.importBtn?.addEventListener('click', () => this.importProducts());
        this.clearAllBtn?.addEventListener('click', () => this.confirmClearAll());

        // Modal
        this.confirmCancel?.addEventListener('click', () => this.closeConfirm());
        this.confirmDelete?.addEventListener('click', () => this.executeConfirmedAction());

        // Add first product link
        document.querySelector('.add-first')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchTab(this.tabButtons[1]);
        });
    }

    /**
     * Switch tab
     */
    switchTab(btn) {
        // Deactivate all tabs
        this.tabButtons.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));

        // Activate clicked tab
        btn.classList.add('active');
        const tabName = btn.dataset.tab;

        if (tabName === 'products') {
            this.productsTab.classList.add('active');
            this.loadProducts();
        } else if (tabName === 'add-product') {
            this.addProductTab.classList.add('active');
            this.resetForm();
        } else if (tabName === 'import-export') {
            this.importExportTab.classList.add('active');
        }
    }

    /**
     * Load and display products
     */
    loadProducts() {
        const products = Products.getAll();

        // Update stats
        this.totalProducts.textContent = products.length;
        this.totalClicks.textContent = Storage.getTotalClicks();

        // Clear table
        this.productsTableBody.innerHTML = '';

        if (products.length === 0) {
            this.productsTableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="8">No products yet. <a href="#" class="add-first">Add your first product</a></td>
                </tr>
            `;
            document.querySelector('.add-first')?.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(this.tabButtons[1]);
            });
            return;
        }

        // Sort by newest first
        const sorted = Products.sort(products, 'newest');

        // Render products
        sorted.forEach(product => {
            const row = document.createElement('tr');
            const tagsText = (product.tags || []).map(tag => this.getBadgeText(tag)).join(', ');
            const clicks = typeof product.clickCount === 'number' ? product.clickCount : Storage.getClickCount(product.id);
            const date = new Date(product.createdAt).toLocaleDateString();
            const discountPercent = product.originalPrice ? this.calculateDiscountPercentage(product.originalPrice, product.price || product.offerPrice) : 0;
            const discountText = discountPercent ? ` <small style="color:var(--green);">(${discountPercent}% off)</small>` : '';

            row.innerHTML = `
                <td><img src="${this.escapeHTML(product.image)}" alt="${this.escapeHTML(product.title)}" class="table-image" onerror="this.style.display='none'"></td>
                <td><strong>${this.escapeHTML(product.title)}</strong></td>
                <td>${this.formatPrice(product.price || product.offerPrice || 0)}</td>
                <td><span class="old-price">${product.originalPrice ? this.formatPrice(product.originalPrice) : '-'}</span>${discountText}</td>
                <td><small>${this.escapeHTML(tagsText)}</small></td>
                <td><span class="click-count">${clicks}</span></td>
                <td><small>${date}</small></td>
                <td>
                    <div class="table-actions">
                        <button class="icon-btn edit" data-product-id="${product.id}" title="Edit">Edit</button>
                        <button class="icon-btn delete" data-product-id="${product.id}" title="Delete">Del</button>
                    </div>
                </td>
            `;

            // Attach event listeners
            row.querySelector('.edit').addEventListener('click', () => this.editProduct(product.id));
            row.querySelector('.delete').addEventListener('click', () => this.confirmDeleteProduct(product.id));

            this.productsTableBody.appendChild(row);
        });
    }

    /**
     * Edit product
     */
    editProduct(productId) {
        const product = Products.getById(productId);
        if (!product) return;

        // Switch to form tab
        this.switchTab(this.tabButtons[1]);

        // Populate form
        this.editingId = productId;
        this.formTitle.textContent = 'Edit Product';
        this.productTitle.value = product.title;
        this.productPrice.value = product.price;
        this.productOriginalPrice.value = product.originalPrice || '';
        this.productDescription.value = product.description;
        this.productAffiliateUrl.value = product.affiliateUrl;
        this.productImageUrl.value = product.image || '';
        this.handleImageUrlChange();

        // Set tags
        this.productTags.forEach(input => {
            input.checked = product.tags && product.tags.includes(input.value);
        });

        // Scroll to form
        this.productForm.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Confirm delete product
     */
    confirmDeleteProduct(productId) {
        this.pendingAction = { type: 'deleteProduct', productId };
        this.confirmTitle.textContent = 'Delete Product?';
        this.confirmMessage.textContent = 'This action cannot be undone. Are you sure?';
        this.openConfirm();
    }

    /**
     * Confirm clear all
     */
    confirmClearAll() {
        this.pendingAction = { type: 'clearAll' };
        this.confirmTitle.textContent = 'Delete All Products?';
        this.confirmMessage.textContent = 'This will permanently delete all products. This cannot be undone.';
        this.openConfirm();
    }

    /**
     * Execute confirmed action
     */
    async executeConfirmedAction() {
        if (!this.pendingAction) return;

        if (this.pendingAction.type === 'deleteProduct') {
            const success = await Products.delete(this.pendingAction.productId);
            if (success) {
                this.showToast('Product deleted', 'success');
                this.loadProducts();
            } else {
                this.showToast('Failed to delete product', 'error');
            }
        } else if (this.pendingAction.type === 'clearAll') {
            await Storage.clearAllProducts();
            this.showToast('All products deleted', 'success');
            this.loadProducts();
        }

        this.closeConfirm();
        this.pendingAction = null;
    }

    /**
     * Handle form submit
     */
    async handleFormSubmit(e) {
        e.preventDefault();

        const productData = {
            title: this.productTitle.value.trim(),
            price: parseFloat(this.productPrice.value),
            offerPrice: parseFloat(this.productPrice.value),
            originalPrice: parseFloat(this.productOriginalPrice.value),
            description: this.productDescription.value.trim(),
            affiliateUrl: this.productAffiliateUrl.value.trim(),
            tags: Array.from(this.productTags)
                .filter(input => input.checked)
                .map(input => input.value),
            image: this.productImageUrl.value.trim(),
        };

        // Validate
        const validation = Products.validate(productData);
        if (!validation.isValid) {
            this.showToast(validation.errors[0], 'error');
            return;
        }

        if (!productData.image) {
            this.showToast('Please add an image URL', 'error');
            return;
        }

        // Save product
        try {
            if (this.editingId) {
                await Products.update(this.editingId, productData);
                this.showToast('Product updated', 'success');
            } else {
                await Products.create(productData);
                this.showToast('Product added', 'success');
            }
        } catch (error) {
            console.error('Failed to save product:', error);
            this.showToast(`Save failed: ${error.message || 'Firebase write failed'}`, 'error');
            return;
        }

        // Reset form
        this.resetForm();

        // Reload products
        this.loadProducts();

        // Switch to products tab
        setTimeout(() => {
            this.switchTab(this.tabButtons[0]);
        }, 500);
    }

    handleImageUrlChange() {
        const url = this.productImageUrl?.value.trim() || '';
        if (!url) {
            this.imagePreview.innerHTML = '<span class="upload-icon">Image</span><span>Paste an image URL to preview it here</span>';
            this.imagePreview.classList.remove('has-image');
            return;
        }

        this.imagePreview.innerHTML = `<img src="${this.escapeHTML(url)}" alt="preview" onerror="this.style.display='none'">`;
        this.imagePreview.classList.add('has-image');
    }

    /**
     * Reset form
     */
    resetForm() {
        this.productForm.reset();
        this.editingId = null;
        this.formTitle.textContent = 'Add New Product';
        this.imagePreview.innerHTML = '<span class="upload-icon">Image</span><span>Paste an image URL to preview it here</span>';
        this.imagePreview.classList.remove('has-image');
        this.productImageUrl.value = '';
        this.productTags.forEach(input => input.checked = false);
    }

    /**
     * Export products
     */
    exportProducts() {
        const products = Products.getAll();
        if (products.length === 0) {
            this.showToast('No products to export', 'warning');
            return;
        }

        const json = Products.export();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sahapicks-products-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Products exported', 'success');
    }

    /**
     * Handle import file change
     */
    handleImportFile(e) {
        const file = e.target.files?.[0];
        if (file) {
            this.importBtn.disabled = false;
            this.importPlaceholder.textContent = file.name;
        }
    }

    /**
     * Handle import drop
     */
    handleImportDrop(e) {
        e.preventDefault();
        const file = e.dataTransfer?.files?.[0];
        if (file && file.name.endsWith('.json')) {
            this.importFile.files = e.dataTransfer.files;
            this.handleImportFile({ target: { files: e.dataTransfer.files } });
        }
    }

    /**
     * Import products
     */
    async importProducts() {
        const file = this.importFile.files?.[0];
        if (!file) {
            this.showToast('Please select a file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const jsonString = event.target?.result;
                const success = await Products.import(jsonString, false);
                if (success) {
                    this.showToast('Products imported successfully', 'success');
                    this.importFile.value = '';
                    this.importPlaceholder.innerHTML = '<span class="upload-icon">JSON</span><span>Click to select JSON file</span>';
                    this.importBtn.disabled = true;
                    this.loadProducts();
                } else {
                    this.showToast('Failed to import products', 'error');
                }
            } catch (error) {
                this.showToast('Invalid JSON file', 'error');
                console.error(error);
            }
        };
        reader.readAsText(file);
    }

    /**
     * Setup theme
     */
    setupTheme() {
        const theme = Storage.getTheme();
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            this.themeToggle.textContent = '☀';
        } else {
            document.body.classList.remove('dark-mode');
            this.themeToggle.textContent = '☾';
        }
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        const newTheme = Storage.toggleTheme();
        if (newTheme === 'dark') {
            document.body.classList.add('dark-mode');
            this.themeToggle.textContent = '☀';
        } else {
            document.body.classList.remove('dark-mode');
            this.themeToggle.textContent = '☾';
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    /**
     * Open confirm modal
     */
    openConfirm() {
        this.confirmModal.classList.add('active');
    }

    /**
     * Close confirm modal
     */
    closeConfirm() {
        this.confirmModal.classList.remove('active');
    }

    /**
     * Get badge text
     */
    getBadgeText(tag) {
        const badges = {
            'new': 'New',
            'hot-deal': 'Hot Deal',
            'trending': 'Trending',
            'mobiles': 'Mobiles',
            'audio': 'Audio',
            'laptops': 'Laptops & Desk Setup',
            'wearables': 'Wearables',
            'creator-gadgets': 'Content Creator Gadgets',
            'budget-tech': 'Budget Tech Gadgets',
            'accessories': 'Accessories',
            'smart-home': 'Smart Home',
            'gaming': 'Gaming',
            'tech': 'Tech',
            'lifestyle': 'Lifestyle',
            'home': 'Home',
        };
        return badges[tag] || tag;
    }

    /**
     * Escape HTML
     */
    escapeHTML(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    formatPrice(value) {
        const amount = Number.parseFloat(value || 0);
        return `₹${Number.isFinite(amount) ? amount.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        }) : '0'}`;
    }

    /**
     * Calculate discount percentage
     */
    calculateDiscountPercentage(originalPrice, offerPrice) {
        const original = Number.parseFloat(originalPrice) || 0;
        const offer = Number.parseFloat(offerPrice) || 0;
        
        if (original <= 0 || offer >= original) return 0;
        
        const discount = ((original - offer) / original) * 100;
        return Math.round(discount);
    }
}

// Initialize admin when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new AdminPanel();
});
