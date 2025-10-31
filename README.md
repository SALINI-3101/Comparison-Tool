# Next.js React Starter Template

A modern, production-ready Next.js starter template with TypeScript, styled-components, and a comprehensive component library.

## Features

- Next.js 15+ with TypeScript
- Styled Components for styling
- Pre-built reusable components (Button, Modal, TextInput, Tabs, Spinner)
- Custom hooks library
- Theme system
- Jest testing setup
- ESLint + Prettier configuration
- Organized folder structure

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn 4.7.0 or npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd framework-template
```

2. Install dependencies:
```bash
yarn install
# or
npm install
```

3. Create environment variables file:
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
yarn dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

```
framework-template/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── layouts/        # Layout components
│   ├── pages/          # Next.js pages
│   │   └── api/        # API routes
│   ├── services/       # API services and external integrations
│   ├── utils/          # Utility functions
│   ├── constants/      # App constants and configuration
│   ├── types/          # TypeScript type definitions
│   ├── lib/            # Shared libraries
│   └── theme/          # Theme configuration
├── .eslintrc.js        # ESLint configuration
├── .prettierrc         # Prettier configuration
├── jest.config.js      # Jest configuration
├── next.config.ts      # Next.js configuration
└── tsconfig.json       # TypeScript configuration
```

## Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn test` - Run tests

## Components

### Button
```tsx
import { Button } from '@/components';

<Button variant="primary" onClick={handleClick}>
  Click me
</Button>
```

### Modal
```tsx
import { Modal } from '@/components';

<Modal isOpen={isOpen} onClose={handleClose}>
  Modal content
</Modal>
```

### TextInput
```tsx
import { TextInput } from '@/components';

<TextInput
  placeholder="Enter text..."
  value={value}
  onChange={handleChange}
/>
```

### Tabs
```tsx
import { Tabs } from '@/components';

<Tabs tabs={[
  { label: 'Tab 1', content: <div>Content 1</div> },
  { label: 'Tab 2', content: <div>Content 2</div> }
]} />
```

### Spinner
```tsx
import { Spinner } from '@/components';

<Spinner size="large" />
```

## Styling

This project uses styled-components for styling. Theme configuration can be found in `src/theme/`.

## Testing

Run tests with:
```bash
yarn test
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Styled Components Documentation](https://styled-components.com/docs)

## License

MIT
