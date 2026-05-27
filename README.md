# 🛍️ SahaPicks Website

SahaPicks is a modern affiliate product discovery platform designed to help users explore curated products and seamlessly redirect to trusted ecommerce partners for purchasing.

The platform focuses on clean UI/UX, responsive design, affiliate conversion optimization, and scalable deployment architecture.

---

# 🌐 Live Website

🔗 https://sahapicks.online/

> Domain purchased via Hostinger and connected to Netlify hosting for fast global delivery.

---

# 🚀 USP & Value Proposition

SahaPicks simplifies product discovery by combining curated recommendations with fast affiliate redirection workflows.

## Why Users Use SahaPicks

- 🛒 Discover curated and trending products
- ⚡ Seamless “Buy Now” affiliate redirection
- 📱 Mobile-first responsive experience
- 🎯 Optimized product showcase funnel
- 🔗 Direct checkout on trusted ecommerce partner platforms
- 💡 Fast-loading lightweight frontend

---

# 🔄 Affiliate Funnel Workflow

```text
Product Discovery
        ↓
Product Recommendation Display
        ↓
Affiliate Link Generation / Tracking
        ↓
Buy Now Redirect
        ↓
Checkout on Partner Ecommerce Platform
```

The website acts as a discovery and referral layer rather than directly processing payments or storing customer payment information.

---

# ✨ Core Features

- Responsive modern UI
- Curated product collections
- Affiliate “Buy Now” redirection system
- Firebase-powered product management
- Newsletter subscription integration
- Lightweight optimized frontend
- Fast Netlify deployment pipeline
- Custom domain integration via Hostinger

---

# 🛠️ Tech Stack

## Frontend

- HTML5
- CSS3
- JavaScript

### Frontend Architecture
- Responsive component-based structure
- Vanilla JavaScript / framework-based implementation (depending on project setup)
- Optimized asset loading
- Mobile-first UI approach

---

# ☁️ Backend & Storage

## Firebase Services

Firebase is used for:

- Product data storage
- Image asset hosting
- Database management
- Optional authentication handling

### Firebase Components
- Firestore Database
- Firebase Storage
- Firebase Hosting utilities (optional)

### Security Rules
Firebase security rules should restrict:
- Unauthorized write access
- Public modification of product data
- Access to sensitive admin operations

> Secrets, API keys, and credentials are never stored directly inside the repository.

---

# 🌍 Hosting & Deployment

## Netlify Hosting

The application is deployed using Netlify for:

- Global CDN delivery
- Continuous deployment
- HTTPS support
- Fast static hosting
- GitHub-based auto deployments

---

# 🌐 Domain & DNS Setup

## Domain Provider
- Hostinger

## Hosting Provider
- Netlify

### DNS Workflow

```text
Hostinger Domain
        ↓
DNS Configuration
        ↓
Netlify Nameservers / DNS Records
        ↓
Website Hosted on Netlify CDN
```

### DNS Configuration Includes
- A records
- CNAME records
- SSL provisioning
- DNS propagation handling

### DNS Propagation
DNS changes may take:
- Few minutes to 24 hours globally

---

# 🔌 Integrations

## Formspree
Used for:
- Newsletter subscriptions
- Contact forms
- Lead capture workflows

## Development Tools

### ChatGPT
Used for:
- Base Code development 
- Documentation assistance
- UI/UX ideation
- Code optimization guidance

### GitHub Copilot
Used for:
- Code suggestions
- Faster development workflows
- Refactoring assistance

---

# 📂 Project Structure

```bash
sahapicks-wesbite/
│
├── public/
│
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── firebase/
│   ├── styles/
│   └── utils/
│
├── .env.example
├── package.json
├── vite.config.js
├── README.md
└── .gitignore
```

---

# ⚙️ Local Development Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/Supratik7712/sahapicks-wesbite.git
```

---

## 2️⃣ Navigate Into Project

```bash
cd sahapicks-wesbite
```

---

## 3️⃣ Install Dependencies

```bash
npm install
```

---

## 4️⃣ Configure Environment Variables

Create a `.env` file:

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FORMSPREE_ENDPOINT=your_formspree_endpoint
```

> Never commit `.env` files or secrets to GitHub.

---

## 5️⃣ Start Development Server

```bash
npm run dev
```

---

## 6️⃣ Open In Browser

```bash
http://localhost:5173
```

---

# 🚀 Deployment Workflow

## GitHub → Netlify CI/CD

Whenever code is pushed to GitHub:

```bash
git add .
git commit -m "Updated project"
git push origin main
```

Netlify automatically:
- Detects changes
- Builds the project
- Deploys the latest version

---

# ☁️ Netlify Deployment Setup

## Build Command

```bash
npm run build
```

## Publish Directory

```bash
dist
```

---

# 🌐 Connecting Hostinger Domain To Netlify

## Step 1 — Add Domain In Netlify

- Site Settings
- Domain Management
- Add Custom Domain

---

## Step 2 — Configure DNS In Hostinger

Add records provided by Netlify.

Typical configuration:

### A Record

```text
75.2.60.5
```

### CNAME Record

```text
your-site.netlify.app
```

---

## Step 3 — SSL Provisioning

Netlify automatically provisions:
- HTTPS
- SSL certificates
- Secure CDN delivery

---

# 📧 Formspree Integration

## Setup Workflow

1. Create Formspree account
2. Create newsletter form
3. Copy generated endpoint
4. Add endpoint to frontend form action

Example:

```html
<form action="https://formspree.io/f/your-id" method="POST">
```

---

# 🔄 Data Flow Architecture

## Product Data Flow

```text
Admin/Product Source
        ↓
Firebase Firestore
        ↓
Frontend Fetches Product Data
        ↓
Products Rendered On Website
        ↓
Affiliate Link Redirect Triggered
```

---

# 🔗 Affiliate Link Flow

```text
User Clicks Buy Now
        ↓
Affiliate URL Loaded
        ↓
Referral Parameters Attached
        ↓
Redirect To Ecommerce Platform
```

---

# 🔒 Security & Privacy

## Security Practices

- Environment variables hidden
- Firebase rules configured
- No payment processing handled locally
- Sensitive credentials excluded from repository
- HTTPS enabled via Netlify SSL

## User Data Handling

Newsletter/contact form submissions:
- Processed through Formspree
- Not publicly exposed
- Not stored directly in frontend code.

# 📋 First Run Checklist

## ✅ Before Running

- Install Node.js
- Configure Firebase project
- Configure Formspree endpoint
- Create `.env` file
- Install dependencies

---

# 🔧 Available Scripts

## Development

```bash
npm run dev
```

## Production Build

```bash
npm run build
```

## Preview Build

```bash
npm run preview
```

---

# ⚠️ Known Limitations

- No direct payment gateway integration
- Affiliate conversion depends on partner platforms
- Firebase free tier limitations may apply
- DNS propagation delays may occur during setup

---

# 📈 Future Improvements

Planned upgrades include:

- Advanced affiliate analytics
- AI-powered recommendations
- Authentication system
- Wishlist functionality.

# 🤝 Contributing

Contributions are welcome.

# 🐛 Support & Issues

For bugs, issues, or suggestions:

- Open a GitHub issue
- Contact project maintainer

---

# 👨‍💻 Author

## Supratik Saha

### GitHub
https://github.com/Supratik7712

### Website
https://sahapicks.online/

---

# 📄 License

This project is licensed under the MIT License.

---
# ⭐ For any query contact
--- supratiksaha2022s@gmail.com

# ⭐ Support The Project

If you found this project useful:

- ⭐ Star the repository
- 🍴 Fork the project
- 📢 Share the project

---

# 🙌 Acknowledgements

Special thanks to:

- Netlify
- Firebase
- Hostinger
- Formspree
- GitHub
- Open-source community
- ChatGPT
- GitHub Copilot.
