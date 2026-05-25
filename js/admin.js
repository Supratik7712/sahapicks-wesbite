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
        this.exportPdfBtn = document.getElementById('exportPdfBtn');
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
        this.exportPdfBtn?.addEventListener('click', () => this.exportProductsPdf());
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
                <td data-label="Image"><img src="${this.escapeHTML(product.image)}" alt="${this.escapeHTML(product.title)}" class="table-image" onerror="this.style.display='none'"></td>
                <td data-label="Title"><strong>${this.escapeHTML(product.title)}</strong></td>
                <td data-label="Offer Price">${this.formatPrice(product.price || product.offerPrice || 0)}</td>
                <td data-label="Original Price"><span class="old-price">${product.originalPrice ? this.formatPrice(product.originalPrice) : '-'}</span>${discountText}</td>
                <td data-label="Tags"><small>${this.escapeHTML(tagsText)}</small></td>
                <td data-label="Clicks"><span class="click-count">${clicks}</span></td>
                <td data-label="Created"><small>${date}</small></td>
                <td data-label="Actions">
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
     * Export products as a PDF report
     */
    exportProductsPdf() {
        const products = Products.sort(Products.getAll(), 'newest');
        if (products.length === 0) {
            this.showToast('No products to export', 'warning');
            return;
        }

        const pdfBlob = this.buildProductsPdf(products);
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sahapicks-products-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Products exported as PDF', 'success');
    }

    /**
     * Build a simple multi-page PDF report without extra dependencies.
     */
    buildProductsPdf(products) {
        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const margin = 40;
        const headerSize = 16;
        const bodySize = 10;
        const headerLineHeight = 22;
        const bodyLineHeight = 14;
        const maxBodyWidth = 74;
        const maxLinesPerPage = Math.floor((pageHeight - (margin * 2) - (headerLineHeight * 3) - 24) / bodyLineHeight);

        const sanitize = (value) => this.sanitizePdfText(value);
        const wrap = (value, limit = maxBodyWidth) => this.wrapPdfText(sanitize(value), limit);

        const lines = [
            `SahaPicks Product Export`,
            `Generated: ${new Date().toLocaleString()}`,
            `Total Products: ${products.length}`,
            '',
        ];

        products.forEach((product, index) => {
            const title = `${index + 1}. ${sanitize(product.title || 'Untitled Product')}`;
            const price = `Price: ${this.formatPdfMoney(product.price || product.offerPrice || 0)}`;
            const originalPrice = product.originalPrice ? `Original: ${this.formatPdfMoney(product.originalPrice)}` : 'Original: -';
            const clicks = `Clicks: ${Number(product.clickCount || 0)}`;
            const tags = `Tags: ${(product.tags || []).map((tag) => this.getBadgeText(tag)).join(', ') || 'None'}`;
            const created = `Created: ${new Date(product.createdAt || Date.now()).toLocaleDateString()}`;
            const link = `Link: ${sanitize(product.affiliateUrl || '-')}`;
            const description = product.description ? wrap(`Description: ${product.description}`) : [];

            lines.push(title);
            lines.push(`${price} | ${originalPrice} | ${clicks}`);
            lines.push(tags);
            lines.push(created);
            lines.push(link);
            lines.push(...description);
            lines.push('');
        });

        const pages = [];
        const headerLines = [
            'SahaPicks Product Export',
            `Generated: ${new Date().toLocaleString()}`,
            `Total Products: ${products.length}`,
            '',
        ];

        let current = [];
        let remainingLines = maxLinesPerPage;

        const flushPage = () => {
            if (!current.length) return;
            pages.push([...headerLines, ...current]);
            current = [];
            remainingLines = maxLinesPerPage;
        };

        lines.slice(4).forEach((line) => {
            const wrappedLines = line ? wrap(line) : [''];
            if (wrappedLines.length > remainingLines) {
                flushPage();
            }
            current.push(...wrappedLines);
            remainingLines -= wrappedLines.length;
            if (remainingLines <= 0) {
                flushPage();
            }
        });

        flushPage();

        const objects = [];
        const pageObjectNumbers = [];

        for (let i = 0; i < pages.length; i += 1) {
            const pageObjectNumber = 4 + (i * 2);
            const contentObjectNumber = pageObjectNumber + 1;
            pageObjectNumbers.push(pageObjectNumber);

            const pageLines = pages[i];
            const content = this.createPdfPageContent(pageLines, {
                pageWidth,
                pageHeight,
                margin,
                headerSize,
                bodySize,
                headerLineHeight,
                bodyLineHeight,
            });

            objects.push({
                number: pageObjectNumber,
                body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
            });
            objects.push({
                number: contentObjectNumber,
                body: `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
            });
        }

        const pdfObjects = [
            { number: 1, body: '<< /Type /Catalog /Pages 2 0 R >>' },
            { number: 2, body: `<< /Type /Pages /Kids [${pageObjectNumbers.map((num) => `${num} 0 R`).join(' ')}] /Count ${pages.length} >>` },
            { number: 3, body: '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>' },
            ...objects,
        ];

        let pdf = '%PDF-1.4\n';
        const offsets = ['0000000000 65535 f \n'];

        pdfObjects.forEach((object) => {
            offsets.push(this.padPdfOffset(pdf.length));
            pdf += `${object.number} 0 obj\n${object.body}\nendobj\n`;
        });

        const xrefStart = pdf.length;
        pdf += `xref\n0 ${pdfObjects.length + 1}\n`;
        pdf += offsets.join('');
        pdf += `trailer\n<< /Size ${pdfObjects.length + 1} /Root 1 0 R >>\n`;
        pdf += `startxref\n${xrefStart}\n%%EOF`;

        return new Blob([pdf], { type: 'application/pdf' });
    }

    /**
     * Create the text stream for a single PDF page.
     */
    createPdfPageContent(lines, config) {
        const {
            pageHeight,
            margin,
            headerSize,
            bodySize,
            headerLineHeight,
            bodyLineHeight,
        } = config;

        const content = [];
        let cursorY = pageHeight - margin;

        const addLine = (text, size, lineHeight) => {
            const safeText = this.escapePdfText(text);
            const nextY = cursorY - lineHeight;
            content.push(`BT /F1 ${size} Tf 1 0 0 1 ${margin} ${nextY} Tm (${safeText}) Tj ET`);
            cursorY = nextY;
        };

        addLine(lines[0] || 'SahaPicks Product Export', headerSize, headerLineHeight);
        addLine(lines[1] || '', bodySize, bodyLineHeight);
        addLine(lines[2] || '', bodySize, bodyLineHeight);
        cursorY -= 6;

        for (let i = 3; i < lines.length; i += 1) {
            const line = lines[i];
            if (line === '') {
                cursorY -= bodyLineHeight;
                continue;
            }
            const wrapped = this.wrapPdfText(this.sanitizePdfText(line), 74);
            wrapped.forEach((wrappedLine) => addLine(wrappedLine, bodySize, bodyLineHeight));
        }

        return content.join('\n');
    }

    /**
     * Wrap plain text for Courier-based PDF rendering.
     */
    wrapPdfText(text, limit = 74) {
        const words = String(text || '').split(/\s+/).filter(Boolean);
        if (!words.length) {
            return [''];
        }

        const lines = [];
        let current = '';

        words.forEach((word) => {
            const next = current ? `${current} ${word}` : word;
            if (next.length > limit) {
                if (current) {
                    lines.push(current);
                }
                if (word.length > limit) {
                    for (let i = 0; i < word.length; i += limit) {
                        lines.push(word.slice(i, i + limit));
                    }
                    current = '';
                } else {
                    current = word;
                }
            } else {
                current = next;
            }
        });

        if (current) {
            lines.push(current);
        }

        return lines.length ? lines : [''];
    }

    /**
     * Convert text to PDF-safe ASCII.
     */
    sanitizePdfText(text) {
        return String(text ?? '')
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[^\x20-\x7E]/g, '?');
    }

    /**
     * Escape PDF text string characters.
     */
    escapePdfText(text) {
        return String(text)
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)');
    }

    /**
     * Pad a PDF byte offset for the xref table.
     */
    padPdfOffset(offset) {
        return `${String(offset).padStart(10, '0')} 00000 n \n`;
    }

    /**
     * Format currency for PDF output.
     */
    formatPdfMoney(value) {
        const amount = Number.parseFloat(value || 0);
        return `Rs. ${Number.isFinite(amount) ? amount.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        }) : '0'}`;
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
