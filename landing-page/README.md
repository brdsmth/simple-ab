# SimpleAB Landing Page

A modern, responsive landing page for SimpleAB - a Google Optimize replacement A/B testing platform. Built with React, TypeScript, and Vite for optimal performance and SEO.

## 🚀 Features

- **Modern Design**: Clean, professional design inspired by industry leaders like Optimizely and ABTasty
- **Fully Responsive**: Optimized for all devices and screen sizes
- **SEO Optimized**: Meta tags, semantic HTML, and performance optimizations
- **Fast Loading**: Built with Vite for lightning-fast build times and optimal bundle size
- **TypeScript**: Full type safety and better developer experience

## 📦 Project Structure

```
src/
├── components/
│   ├── Header.tsx/css      # Navigation and branding
│   ├── Hero.tsx/css        # Hero section with main value proposition
│   ├── Features.tsx/css    # Feature showcase and comparison table
│   ├── Pricing.tsx/css     # Pricing plans and FAQ
│   └── Footer.tsx/css      # Footer with links and contact info
├── App.tsx/css             # Main app component
├── main.tsx               # App entry point
└── index.css              # Global styles
```

## 🛠 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎨 Design Features

### Hero Section
- Compelling headline positioning SimpleAB as a Google Optimize replacement
- Clear value propositions (2-minute setup, 99.9% uptime, 50% cost savings)
- Interactive dashboard mockup
- Strong call-to-action buttons

### Features Section
- 6 key differentiators highlighting competitive advantages
- Comparison table showing SimpleAB vs Optimizely vs ABTasty
- Focus on ease of use, privacy, and transparent pricing

### Pricing Section
- 3-tier pricing structure (Starter, Growth, Enterprise)
- Clear feature comparison
- FAQ section addressing common concerns
- Competitive pricing against industry leaders

### Design System
- **Colors**: Purple gradient (#667eea to #764ba2) for brand elements
- **Typography**: Inter font family for modern, readable text
- **Components**: Consistent button styles, cards, and spacing
- **Animations**: Subtle hover effects and transitions

## 🚀 Deployment

The landing page is configured for deployment to AWS S3 + CloudFront. See [deploy.md](./deploy.md) for detailed instructions.

### Quick Deploy

```bash
# Build and deploy to S3 (requires AWS CLI configured)
npm run deploy
```

### Manual Deployment Steps

1. **Build the project**: `npm run build`
2. **Upload to S3**: Upload `dist/` contents to your S3 bucket
3. **Configure CloudFront**: Set up CDN with custom domain
4. **Update DNS**: Point your domain to CloudFront distribution

## 🎯 Competitive Positioning

The landing page positions SimpleAB as:

- **vs Google Optimize**: Drop-in replacement with continued support
- **vs Optimizely**: Easier setup, more affordable, no vendor lock-in
- **vs ABTasty**: Better pricing, faster implementation, simpler interface

### Key Messaging
- "The Simple A/B Testing Platform That Actually Works"
- 2-minute setup vs weeks for competitors
- Starting at $29/month vs $500-2000+ for competitors
- No vendor lock-in, privacy-first approach

## 📱 Responsive Design

- **Desktop**: Full-width hero with side-by-side content
- **Tablet**: Stacked layouts with adjusted spacing
- **Mobile**: Single-column layout with touch-friendly interactions

## 🔧 Technical Details

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: CSS modules with custom properties
- **Bundle Size**: ~200KB total (61KB gzipped)
- **Performance**: Optimized for Core Web Vitals

## 📈 SEO Optimization

- Semantic HTML structure
- Meta tags for social sharing
- Structured data markup ready
- Fast loading times
- Mobile-first responsive design

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the build: `npm run build`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Ready to deploy?** Check out [deploy.md](./deploy.md) for step-by-step AWS deployment instructions.