/*
 * Firebase bridge for SahaPicks.
 * Paste your Firebase project config below.
 * Required: apiKey, authDomain, projectId, messagingSenderId, appId
 */

window.FIREBASE_CONFIG = window.FIREBASE_CONFIG || {
   apiKey: "AIzaSyCvQ9bOG70HQv_YNtEJZguiKo3Kg0mee0I",
    authDomain: "sahapicks-website.firebaseapp.com",
    projectId: "sahapicks-website",
    storageBucket: "sahapicks-website.firebasestorage.app",
    messagingSenderId: "362774914689",
    appId: "1:362774914689:web:042752f815571b8840cf80",
    measurementId: "G-0FG515X05P"
};

const FirebaseBridge = {
    app: null,
    db: null,
    initialized: false,

    isConfigured() {
        const config = window.FIREBASE_CONFIG || {};
        return Boolean(
            config.apiKey &&
            config.authDomain &&
            config.projectId &&
            config.messagingSenderId &&
            config.appId &&
            typeof window.firebase !== 'undefined'
        );
    },

    async init() {
        if (!this.isConfigured()) {
            return false;
        }

        if (this.initialized) {
            return true;
        }

        if (!window.firebase.apps.length) {
            window.firebase.initializeApp(window.FIREBASE_CONFIG);
        }

        this.app = window.firebase.app();
        this.db = window.firebase.firestore();
        this.initialized = true;
        return true;
    },

    async getProducts() {
        await this.init();
        if (!this.initialized) return [];

        const snapshot = await this.db.collection('products').orderBy('createdAt', 'desc').get();
        return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
    },

    async onProductsChange(callback) {
        await this.init();
        if (!this.initialized) {
            return () => {};
        }

        return this.db.collection('products')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                const products = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
                callback(products);
            });
    },

    async seedProducts(products) {
        await this.init();
        if (!this.initialized) return false;

        const snapshot = await this.db.collection('products').get();
        if (!snapshot.empty) {
            return false;
        }

        const batch = this.db.batch();
        products.forEach((product) => {
            const ref = this.db.collection('products').doc(product.id);
            const { id, ...rest } = product;
            batch.set(ref, {
                ...rest,
                createdAt: rest.createdAt || new Date().toISOString(),
                clickCount: Number(rest.clickCount || 0),
            });
        });

        await batch.commit();
        return true;
    },

    async addProduct(product) {
        await this.init();
        if (!this.initialized) return null;

        const ref = this.db.collection('products').doc();
        const { id, ...rest } = product;
        const payload = {
            ...rest,
            createdAt: rest.createdAt || new Date().toISOString(),
            clickCount: Number(rest.clickCount || 0),
        };
        await ref.set(payload);
        return { ...payload, id: ref.id };
    },

    async updateProduct(id, updates) {
        await this.init();
        if (!this.initialized) return null;

        const ref = this.db.collection('products').doc(id);
        const snapshot = await ref.get();
        if (!snapshot.exists) return null;

        await ref.update({
            ...updates,
        });

        const updated = await ref.get();
        return { ...updated.data(), id: updated.id };
    },

    async deleteProduct(id) {
        await this.init();
        if (!this.initialized) return false;

        const ref = this.db.collection('products').doc(id);
        const snapshot = await ref.get();
        if (!snapshot.exists) return false;

        await ref.delete();
        return true;
    },

    async clearProducts() {
        await this.init();
        if (!this.initialized) return false;

        const snapshot = await this.db.collection('products').get();
        const batch = this.db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        return true;
    },

    async incrementClickCount(id) {
        await this.init();
        if (!this.initialized) return null;

        const ref = this.db.collection('products').doc(id);
        await ref.update({
            clickCount: window.firebase.firestore.FieldValue.increment(1),
        });

        const updated = await ref.get();
        return { ...updated.data(), id: updated.id };
    },

    async importProducts(products, merge = false) {
        await this.init();
        if (!this.initialized) return false;

        if (!merge) {
            await this.clearProducts();
        }

        for (const product of products) {
            if (product.title && product.affiliateUrl) {
                await this.addProduct(product);
            }
        }

        return true;
    },
};

window.FirebaseBridge = FirebaseBridge;
