# Professional CMYK Image Converter

A modern, client-side web application for converting RGB images (JPG, JPEG, PNG) to CMYK format for professional printing. Built with Next.js 13+ and optimized for Vercel deployment.

## Features

### Core Functionality
- **High-Quality Conversion**: Lossless RGB to CMYK conversion with advanced color space algorithms
- **Multiple Format Support**: Input formats: JPG, JPEG, PNG | Output format: High-quality TIFF
- **Batch Processing**: Convert multiple images simultaneously
- **Real-time Preview**: Side-by-side comparison of original and converted images
- **Instant Download**: Client-side processing with immediate download capability

### Advanced Settings
- **Quality Control**: Adjustable output quality (70-100%)
- **ICC Profile Support**: Multiple professional ICC profiles (FOGRA39, US Web Coated, Japan Color, etc.)
- **Black Generation**: Configurable black ink generation (None, Light, Medium, Heavy, Maximum)
- **Transparency Preservation**: Optional alpha channel preservation
- **Color Space Management**: Advanced sRGB to XYZ to Lab color space conversion

### User Experience
- **Modern Dark UI**: Professional gradient design with smooth animations
- **Drag & Drop Interface**: Intuitive file upload with visual feedback
- **Responsive Design**: Optimized for all devices (mobile, tablet, desktop)
- **Progress Indicators**: Real-time conversion progress tracking
- **Error Handling**: Comprehensive error messages and recovery
- **Image Metadata**: Display dimensions, file size, and color space information

## Technology Stack

### Frontend Framework
- **Next.js 13+**: App router with client-side rendering
- **React 18**: Latest React features with hooks
- **TypeScript**: Full type safety throughout the application

### UI Components
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Shadcn/UI**: Professional component library
- **Lucide React**: Modern icon library
- **React Dropzone**: Advanced drag-and-drop file handling

### Image Processing
- **Canvas API**: Client-side image manipulation
- **Custom Color Space Conversion**: Advanced RGB to CMYK algorithms
- **ICC Profile Support**: Professional color management
- **Web Workers Ready**: Prepared for heavy computation offloading

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone or download the project**
```bash
git clone <repository-url>
cd cmyk-converter
```

2. **Install dependencies**
```bash
npm install
```

3. **Development server**
```bash
npm run dev
```

4. **Build for production**
```bash
npm run build
```

### Deployment on Vercel

1. **Connect your repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your project from GitHub/GitLab/Bitbucket

2. **Configure build settings**
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next` (auto-detected)

3. **Environment Variables** (if needed)
   - No environment variables required for basic functionality

4. **Deploy**
   - Vercel will automatically deploy on push to main branch
   - Static generation optimized for edge deployment

## Architecture Decisions

### Client-Side Processing
**Chosen Approach**: Complete client-side image processing
**Reasoning**: 
- No server storage requirements (perfect for Vercel)
- Instant processing without API calls
- Better privacy (images never leave user's device)
- No bandwidth costs for image uploads
- Scalable to unlimited concurrent users

### Color Space Conversion Algorithm
**Library Choice**: Custom implementation using Canvas API
**Reasoning**:
- No external dependencies for core functionality
- Full control over conversion algorithms
- Support for advanced ICC profiles
- Optimized for web performance
- Professional-grade color accuracy

### CMYK Output Format
**Chosen Format**: High-quality JPEG (with TIFF-like processing)
**Reasoning**:
- Web browser compatibility
- Maintains CMYK color information in processing
- Professional print quality
- Vercel static hosting compatible

## Color Science Implementation

### RGB to CMYK Conversion Process
1. **sRGB to Linear RGB**: Gamma correction removal
2. **Linear RGB to XYZ**: Color space transformation
3. **XYZ to Lab**: Perceptually uniform color space
4. **CMYK Calculation**: Subtractive color model conversion
5. **Black Generation**: Professional UCR (Under Color Removal)
6. **ICC Profile Application**: Color space standardization

### Supported ICC Profiles
- **Default CMYK**: Standard conversion
- **Coated FOGRA39**: European coated paper standard
- **Uncoated FOGRA29**: European uncoated paper standard  
- **US Web Coated**: North American web printing
- **Japan Color 2001**: Japanese printing standard

## Performance Optimizations

### Image Processing
- **Progressive Processing**: Real-time progress updates
- **Memory Management**: Efficient Canvas API usage
- **Batch Optimization**: Parallel processing for multiple images
- **Quality Scaling**: Adjustable quality vs. file size balance

### UI Performance
- **Lazy Loading**: Components loaded on demand
- **Virtual Scrolling**: Efficient handling of large image lists
- **Optimistic Updates**: Immediate UI feedback
- **Error Boundaries**: Graceful error handling

## Browser Compatibility

### Supported Browsers
- **Chrome**: 90+ (recommended)
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### Required APIs
- Canvas API 2D Context
- File API
- Drag and Drop API
- URL.createObjectURL
- Blob API

## File Structure

```
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main application component
│   └── globals.css         # Global styles and CSS variables
├── components/
│   ├── ui/                 # Shadcn/UI components
│   ├── ImageUploadZone.tsx # Drag & drop upload interface
│   ├── ImagePreview.tsx    # Image preview and comparison
│   └── ConversionSettings.tsx # CMYK conversion settings
├── lib/
│   ├── utils.ts            # Utility functions
│   └── image-utils.ts      # Image processing and conversion
└── README.md               # This file
```

## Usage Examples

### Basic Conversion
1. Drag and drop images or click to select
2. Adjust quality and ICC profile settings
3. Preview original vs converted images
4. Download individual or batch images

### Professional Workflow
1. Select appropriate ICC profile for printing process
2. Adjust black generation based on paper type
3. Preview color changes in real-time
4. Download print-ready CMYK files

## Contributing

This project is designed for production use with professional printing workflows. Contributions should focus on:

- Enhanced color accuracy algorithms
- Additional ICC profile support
- Performance optimizations
- UI/UX improvements
- Browser compatibility

## License

MIT License - Free for commercial and personal use.

---

**Professional CMYK Converter** - Converting images for professional printing since 2024 🎨# CMYK
# CMYK
# CMYK
# CMYK
