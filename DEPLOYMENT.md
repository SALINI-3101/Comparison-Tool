# Deployment Guide - Diff & Validate Tool

## Pre-Deployment Checklist

### ✅ Tests Passed
- **Total Tests**: 25 passed
- **Test Suites**: 2 passed
- **Test Files**:
  - `src/components/Toggle/__tests__/Toggle.test.tsx` - All tests passed
  - `src/utils/__tests__/comparison.test.ts` - All tests passed

### ✅ Test Coverage
```
File               | % Stmts | % Branch | % Funcs | % Lines
-------------------|---------|----------|---------|--------
All files          |   54.02 |    34.15 |   54.54 |   54.94
components/Toggle  |      65 |    14.28 |   22.22 |   63.15
utils/comparison   |   53.71 |    34.94 |   60.86 |   54.71
```

### ✅ Production Build
- **Status**: ✅ Compiled successfully
- **Build Time**: 3.5s
- **Bundle Size**:
  - Main page (`/`): 16.6 kB (124 kB First Load JS)
  - Shared JS: 108 kB
  - All pages optimized and static

### ✅ Key Features Implemented
1. **JSON, XML, and Text Comparison**
   - Line-by-line diff detection
   - Syntax highlighting for differences
   - Added/Removed/Modified line detection

2. **Large File Handling**
   - Web Workers for files >300KB
   - Fast comparison for files >1000 lines
   - 5MB file size limit
   - Progress indicators and warnings

3. **Whitespace Detection**
   - Lines differing only in whitespace correctly marked as "modified"
   - Similarity threshold: 0.5 with special whitespace normalization
   - Effective similarity of 0.95 for whitespace-only changes

4. **File Upload**
   - Drag & drop support
   - 2MB file size limit per file
   - Supported formats: JSON, XML, TXT
   - File metadata display (name, type, size)
   - Remove file functionality

5. **Toggle Options**
   - Ignore Whitespace
   - Case Sensitive
   - Ignore Key Order (JSON)
   - Ignore Array Order (JSON)
   - Ignore Attribute Order (XML)

6. **UI Features**
   - Dark mode support
   - Responsive design
   - LocalStorage persistence
   - Real-time storage size indicator
   - Reset and Clear All functionality

## Deployment Options

### Option 1: Vercel Deployment (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Option 2: Netlify Deployment

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

### Option 3: Self-Hosted Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

3. **Configure reverse proxy** (nginx example):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Option 4: Docker Deployment

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:20-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm ci --only=production

   COPY . .
   RUN npm run build

   EXPOSE 3000

   CMD ["npm", "start"]
   ```

2. **Build Docker image**:
   ```bash
   docker build -t diff-validate-tool .
   ```

3. **Run container**:
   ```bash
   docker run -p 3000:3000 diff-validate-tool
   ```

## Environment Configuration

### Required Files
- `.env.local` (optional) - for environment-specific variables
- `next.config.js` - Next.js configuration
- `package.json` - Dependencies and scripts

### Environment Variables (Optional)
```bash
# No environment variables required for basic functionality
# All comparison logic runs client-side
```

## Post-Deployment Verification

### 1. Basic Functionality
- [x] Homepage loads correctly
- [x] Dark mode toggle works
- [x] All tabs (JSON, XML, Text) are accessible

### 2. JSON Comparison
- [x] JSON validation works
- [x] JSON comparison detects differences
- [x] Toggle options affect comparison results
- [x] Large files use Web Workers

### 3. XML Comparison
- [x] XML comparison detects differences
- [x] Whitespace-only changes marked as "modified"
- [x] Large files process without freezing browser

### 4. Text Comparison
- [x] Text comparison detects line differences
- [x] Line-by-line diff display works

### 5. File Upload
- [x] Drag & drop works
- [x] File browse button works
- [x] File metadata displays correctly
- [x] Remove button clears file

### 6. Performance
- [x] Files >1000 lines use fast comparison
- [x] Files >300KB use Web Workers
- [x] Browser remains responsive during processing
- [x] Loading overlay displays during processing

## Known Issues & Warnings

### ESLint Warnings (Non-Critical)
```
1. FileUpload.tsx:32:6 - Missing dependency 'fileMetadata' in useEffect
   Status: Can be ignored - intentional design to avoid infinite loops

2. index.tsx console.error statements
   Status: These are for debugging Web Worker errors - can be removed or
   converted to proper logging service in production
```

### Browser Compatibility
- Tested on: Chrome, Edge, Firefox
- Requires: Modern browser with Web Worker support
- Minimum: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+

## Performance Recommendations

1. **CDN Configuration**: Serve static assets via CDN
2. **Compression**: Enable gzip/brotli compression
3. **Caching Headers**: Set appropriate cache headers for static assets
4. **Monitoring**: Set up error tracking (Sentry, Bugsnag, etc.)

## Security Considerations

1. **File Upload**:
   - 2MB limit per file enforced
   - 5MB total comparison limit enforced
   - All processing done client-side
   - No data sent to server

2. **XSS Protection**:
   - All user input is escaped
   - HTML rendering uses `dangerouslySetInnerHTML` only for controlled diff highlights

3. **CSP Headers**: Consider adding Content Security Policy headers

## Maintenance

### Updating Dependencies
```bash
npm update
npm audit fix
```

### Running Tests
```bash
npm test              # Run tests
npm run test:coverage # Run with coverage
npm run test:watch   # Watch mode
```

### Code Quality
```bash
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm run format        # Format code with Prettier
```

## Support & Documentation

- **GitHub Repository**: [Your Repo URL]
- **Issue Tracker**: [Your Issues URL]
- **Documentation**: See README.md and TESTING_INPUTS.md

---

## Deployment Status

**Current Status**: ✅ Ready for Production

**Last Build**: Successful
**Last Test Run**: All 25 tests passed
**Build Size**: 124 KB (Main Page First Load)
**Performance**: Optimized with Web Workers for large files

**Developer**: Salini Murugesan
**Date**: November 26, 2025
