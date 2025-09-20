# Virtual Wedding Invitation

An elegant and modern digital wedding invitation built with React, Vite, TypeScript, and TailwindCSS. This web application provides an immersive experience for sharing your wedding details with guests.

## ✨ Features

- **📱 Responsive Design**: Perfectly adapts to mobile and desktop devices
- **🎬 Elegant Animations**: Smooth transitions and attractive visual effects using Framer Motion
- **📋 Interactive Sections**: Detailed information about ceremony, reception, and celebration
- **🎵 Audio Player**: Share your special song with guests
- **⏰ Countdown Timer**: Shows time remaining until the big day
- **🎨 Customizable Aesthetics**: Easy to adapt to different wedding styles and themes
- **⚡ Performance Optimized**: Fast loading and smooth experience
- **♿ Accessible**: ARIA labels, semantic HTML, and keyboard navigation
- **📦 Lazy Loading**: Optimized image loading for better performance

## 🏗️ Architecture

### Main Sections

1. **Hero Section**: Features a biblical quote and couple's initials
2. **Names & Music**: Displays couple's names with background music player
3. **Photo Gallery**: Showcases couple's photographs with elegant design
4. **Event Details**: Information about ceremony, reception, and celebration
5. **Locations**: Maps and directions to important venues
6. **Photo Gallery**: Additional couple photos
7. **Timeline**: Wedding day schedule and events
8. **RSVP & Gifts**: WhatsApp confirmation and gift suggestions

### Component Structure

```
src/
├── components/
│   ├── InvitationSection1.tsx    # Hero section with quote
│   ├── InvitationSection2.tsx    # Photo display
│   ├── InvitationSection3.tsx    # Names and audio player
│   ├── InvitationSection4.tsx    # Main photo
│   ├── InvitationSection5.tsx    # Event details
│   ├── InvitationSection6.tsx    # Location information
│   ├── InvitationSection7.tsx    # Timeline
│   ├── InvitationSection8.tsx    # RSVP and gifts
│   ├── InvitationSection9.tsx    # Photo gallery
│   └── ui/
│       ├── AudioPlayer.tsx       # Custom music player
│       ├── Button.tsx            # Reusable button component
│       ├── LazyImage.tsx         # Optimized image component
│       ├── DressCodeIcons.tsx    # Dress code illustrations
│       └── EventIcons.tsx        # Event type icons
├── hooks/
│   ├── useImagePreload.ts        # Image preloading hook
│   └── useLazyImage.ts          # Intersection observer hook
├── lib/
│   └── utils.ts                 # Utility functions
└── assets/                      # Static images and media
```

## 🛠️ Technologies Used

### Core Technologies

- **React 19.1.1**: Modern React with latest features
- **TypeScript**: Type-safe development with strict mode
- **Vite 7.1.6**: Ultra-fast development environment with optimized builds
- **TailwindCSS 4.1.13**: Utility-first CSS framework
- **pnpm**: Fast, disk space efficient package manager

### Animation & UI

- **Framer Motion 12.23.16**: Smooth animations and transitions
- **Lucide React**: Modern minimalist icons
- **Class Variance Authority**: Type-safe component variants
- **Tailwind Merge**: Efficient class merging utility

### Development Tools

- **ESLint**: Code linting with React hooks and refresh plugins
- **PostCSS**: CSS processing with autoprefixer
- **@types/react**: TypeScript definitions for React

## ⚡ Performance Optimizations

### Bundle Analysis

- **Total Size**: ~120 kB gzipped
- **Code Splitting**: Optimized chunks for better caching
  - `vendor.js`: 11.72 kB (React/React-DOM)
  - `animations.js`: 116.71 kB (Framer Motion)
  - `ui.js`: 3.23 kB (UI components)
  - `main.js`: 234.42 kB (Application logic)

### Optimization Features

- **Lazy Loading**: Images load as they enter viewport
- **Image Preloading**: Custom hooks for optimized loading
- **Manual Chunks**: Strategic code splitting for optimal caching
- **ESBuild Minification**: Fast and efficient code compression
- **CSS Code Splitting**: Separate CSS chunks for better loading

## 🚀 Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd virtual-wedding-invitation-v2
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start development server**

   ```bash
   pnpm dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

## 🎨 Customization

This project is easily customizable to fit your needs:

### Content Customization

- **Images**: Replace files in `/public` directory
- **Wedding Information**: Update details in respective components
- **Colors**: Modify TailwindCSS theme in `tailwind.config.ts`
- **Music**: Replace `/public/cancion.mp3` with your song
- **WhatsApp Numbers**: Update phone numbers in `InvitationSection8.tsx`

### Styling

- **Color Scheme**: Modify CSS custom properties in `src/index.css`
- **Fonts**: Update font imports and TailwindCSS font configuration
- **Animations**: Customize Framer Motion variants in components

### Example Color Customization

```css
:root {
  --primary: 221 83% 20%; /* Navy blue */
  --secondary: 43 74% 66%; /* Gold */
  --background: 0 0% 100%; /* White */
}
```

## 📱 Browser Support

- **Chrome**: 88+
- **Firefox**: 85+
- **Safari**: 14+
- **Edge**: 88+

## 📝 License

This project is private and proprietary. All rights reserved.

## 🙋‍♂️ Support

For customization requests or technical support, please create an issue in the repository.

---

**Built with ❤️ for unforgettable wedding moments**
