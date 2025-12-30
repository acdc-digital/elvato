#!/bin/bash

# ACDC Digital - Package Generator Script
# Creates a new Next.js + Convex package following workspace standards
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 <package-name> [options]"
    echo ""
    echo "Options:"
    echo "  -p, --port <port>     Port number for dev server (default: auto-detect)"
    echo "  -d, --description     Package description (default: auto-generated)"
    echo "  --no-convex          Skip Convex setup"
    echo "  --no-install         Skip npm install"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 my-app"
    echo "  $0 my-app --port 3001"
    echo "  $0 my-app --description \"My awesome app\""
}

# Parse command line arguments
PACKAGE_NAME=""
CUSTOM_PORT=""
CUSTOM_DESCRIPTION=""
SKIP_CONVEX=false
SKIP_INSTALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            CUSTOM_PORT="$2"
            shift 2
            ;;
        -d|--description)
            CUSTOM_DESCRIPTION="$2"
            shift 2
            ;;
        --no-convex)
            SKIP_CONVEX=true
            shift
            ;;
        --no-install)
            SKIP_INSTALL=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        -*)
            print_error "Unknown option $1"
            show_usage
            exit 1
            ;;
        *)
            if [[ -z "$PACKAGE_NAME" ]]; then
                PACKAGE_NAME="$1"
            else
                print_error "Multiple package names provided"
                show_usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate package name
if [[ -z "$PACKAGE_NAME" ]]; then
    print_error "Package name is required"
    show_usage
    exit 1
fi

# Validate package name format (lowercase, alphanumeric, hyphens)
if [[ ! "$PACKAGE_NAME" =~ ^[a-z][a-z0-9-]*$ ]]; then
    print_error "Package name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens"
    exit 1
fi

# Set workspace root
WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_DIR="$WORKSPACE_ROOT/$PACKAGE_NAME"

# Check if package already exists
if [[ -d "$PACKAGE_DIR" ]]; then
    print_error "Package '$PACKAGE_NAME' already exists at $PACKAGE_DIR"
    exit 1
fi

# Auto-detect next available port if not provided
if [[ -z "$CUSTOM_PORT" ]]; then
    USED_PORTS=$(find "$WORKSPACE_ROOT" -name "package.json" -type f -exec grep -l "next dev -p" {} \; | xargs grep -o "next dev -p [0-9]*" | grep -o "[0-9]*" | sort -n)
    LAST_PORT=$(echo "$USED_PORTS" | tail -1)
    if [[ -z "$LAST_PORT" ]]; then
        DEV_PORT=8008
    else
        DEV_PORT=$((LAST_PORT + 1))
    fi
else
    DEV_PORT="$CUSTOM_PORT"
fi

# Set default description if not provided
if [[ -z "$CUSTOM_DESCRIPTION" ]]; then
    CUSTOM_DESCRIPTION="$PACKAGE_NAME package - part of ACDC Digital workspace"
fi

# Fetch latest Next.js version
print_status "Fetching latest Next.js version..."
NEXT_VERSION=$(npm show next version 2>/dev/null || echo "16.1.1")
print_status "Using Next.js version: $NEXT_VERSION"

print_status "Creating new package: $PACKAGE_NAME"
print_status "Directory: $PACKAGE_DIR"
print_status "Dev port: $DEV_PORT"
print_status "Description: $CUSTOM_DESCRIPTION"

# Create package directory
mkdir -p "$PACKAGE_DIR"

print_status "Creating package structure..."

# Create main directories
mkdir -p "$PACKAGE_DIR/app"
mkdir -p "$PACKAGE_DIR/components/ui"
mkdir -p "$PACKAGE_DIR/lib"

# Create additional project directories
mkdir -p "$PACKAGE_DIR/.agents"
mkdir -p "$PACKAGE_DIR/.docs"
mkdir -p "$PACKAGE_DIR/.github"
mkdir -p "$PACKAGE_DIR/.notes"
mkdir -p "$PACKAGE_DIR/.tests"
mkdir -p "$PACKAGE_DIR/.vscode"

if [[ "$SKIP_CONVEX" == false ]]; then
    mkdir -p "$PACKAGE_DIR/convex"
fi

# Create package.json
print_status "Creating package.json..."
cat > "$PACKAGE_DIR/package.json" << EOF
{
  "name": "$PACKAGE_NAME",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p $DEV_PORT",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@radix-ui/react-slot": "^1.2.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.541.0",
    "next": "^$NEXT_VERSION",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^3.3.1",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "^$NEXT_VERSION",
    "prettier": "^3.5.3",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
EOF

# Add Convex dependency if not skipped
if [[ "$SKIP_CONVEX" == false ]]; then
    # Use jq to add convex dependency and script
    if command -v jq >/dev/null 2>&1; then
        tmp_file=$(mktemp)
        jq '.dependencies.convex = "^1.23.0" | .scripts.convex = "convex dev"' "$PACKAGE_DIR/package.json" > "$tmp_file"
        mv "$tmp_file" "$PACKAGE_DIR/package.json"
    else
        # Fallback: manual editing (less elegant but functional)
        sed -i '' 's/"tailwindcss-animate": "^1.0.7"/"tailwindcss-animate": "^1.0.7",\
    "convex": "^1.23.0"/' "$PACKAGE_DIR/package.json"
        sed -i '' 's/"lint": "next lint"/"lint": "next lint",\
    "convex": "convex dev"/' "$PACKAGE_DIR/package.json"
    fi
fi

# Create Next.js configuration files
print_status "Creating Next.js configuration files..."

# next.config.ts
cat > "$PACKAGE_DIR/next.config.ts" << 'EOF'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
EOF

# tsconfig.json
cat > "$PACKAGE_DIR/tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "forceConsistentCasingInFileNames": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

# eslint.config.mjs
cat > "$PACKAGE_DIR/eslint.config.mjs" << 'EOF'
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
EOF

# tailwind.config.ts
cat > "$PACKAGE_DIR/tailwind.config.ts" << 'EOF'
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "collapsible-down": {
          from: { height: "0" },
          to: { height: "var(--radix-collapsible-content-height)" },
        },
        "collapsible-up": {
          from: { height: "var(--radix-collapsible-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "collapsible-down": "collapsible-down 0.2s ease-out",
        "collapsible-up": "collapsible-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
EOF

# postcss.config.mjs
cat > "$PACKAGE_DIR/postcss.config.mjs" << 'EOF'
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;
EOF

# next-env.d.ts
cat > "$PACKAGE_DIR/next-env.d.ts" << 'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/building-your-application/configuring/typescript for more information.
EOF

# Create app structure
print_status "Creating app structure..."

# globals.css
cat > "$PACKAGE_DIR/app/globals.css" << 'EOF'
@import "tailwindcss";

:root {
  /* VS Code inspired color palette */
  --background: #1e1e1e;
  --foreground: #cccccc;
  --card: #252526;
  --card-foreground: #cccccc;
  --primary: #007acc;
  --primary-foreground: #ffffff;
  --secondary: #2d2d30;
  --secondary-foreground: #cccccc;
  --muted: #2d2d30;
  --muted-foreground: #858585;
  --accent: #007acc;
  --accent-foreground: #ffffff;
  --border: #2d2d30;
  --input: #2d2d30;
  --ring: #007acc;
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-feature-settings: "rlig" 1, "calt" 1;
}

/* Custom scrollbar styling */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #424242;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: #4a4a4a;
}

/* Utility classes for the IDE aesthetic */
.ide-text-xs {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.glow-primary {
  box-shadow: 0 0 20px rgba(0, 122, 204, 0.3);
  transition: box-shadow 0.3s ease;
}

.glow-primary:hover {
  box-shadow: 0 0 30px rgba(0, 122, 204, 0.5);
}
EOF

# layout.tsx
CAPITALIZED_NAME="$(echo ${PACKAGE_NAME:0:1} | tr '[:lower:]' '[:upper:]')${PACKAGE_NAME:1}"

if [[ "$SKIP_CONVEX" == false ]]; then
    # Layout with ConvexClientProvider
    cat > "$PACKAGE_DIR/app/layout.tsx" << EOF
import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";

export const metadata: Metadata = {
  title: "$CAPITALIZED_NAME",
  description: "$CUSTOM_DESCRIPTION",
  icons: {
    icon: "/convex.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
EOF
else
    # Layout without ConvexClientProvider
    cat > "$PACKAGE_DIR/app/layout.tsx" << EOF
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "$CAPITALIZED_NAME",
  description: "$CUSTOM_DESCRIPTION",
  icons: {
    icon: "/convex.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
EOF
fi

# ConvexClientProvider.tsx (only if Convex is enabled)
if [[ "$SKIP_CONVEX" == false ]]; then
    cat > "$PACKAGE_DIR/app/ConvexClientProvider.tsx" << 'EOF'
"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
EOF
fi

# global.d.ts for CSS module type declarations
cat > "$PACKAGE_DIR/global.d.ts" << 'EOF'
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}
EOF

# page.tsx
cat > "$PACKAGE_DIR/app/page.tsx" << EOF
export default function ${CAPITALIZED_NAME}Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to $CAPITALIZED_NAME</h1>
        <p className="text-lg text-muted-foreground">
          $CUSTOM_DESCRIPTION
        </p>
      </div>
    </div>
  );
}
EOF

# Create components
print_status "Creating components..."

# lib/utils.ts
cat > "$PACKAGE_DIR/lib/utils.ts" << 'EOF'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF

# components/ui/button.tsx
cat > "$PACKAGE_DIR/components/ui/button.tsx" << 'EOF'
import { cn } from "@/lib/utils"

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-primary text-primary-foreground shadow hover:bg-primary/90": variant === "default",
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90": variant === "destructive",
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground": variant === "outline",
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80": variant === "secondary",
          "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
          "text-primary underline-offset-4 hover:underline": variant === "link",
        },
        {
          "h-9 px-4 py-2": size === "default",
          "h-8 rounded-md px-3 text-xs": size === "sm",
          "h-10 rounded-md px-8": size === "lg",
          "h-9 w-9": size === "icon",
        },
        className
      )}
      {...props}
    />
  )
}
EOF

# Create Convex setup (if not skipped)
if [[ "$SKIP_CONVEX" == false ]]; then
    print_status "Creating Convex setup..."
    
    # convex/convex.config.ts
    cat > "$PACKAGE_DIR/convex/convex.config.ts" << 'EOF'
// convex/convex.config.ts
import { defineApp } from "convex/server";

const app = defineApp();

export default app;
EOF

    # convex/schema.ts
    cat > "$PACKAGE_DIR/convex/schema.ts" << 'EOF'
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  projects: defineTable({
    value: v.number(),
  }),
});
EOF

    # convex/tsconfig.json
    cat > "$PACKAGE_DIR/convex/tsconfig.json" << 'EOF'
{
  /* This TypeScript project config describes the environment that
   * Convex functions run in and is used to typecheck them.
   * You can modify it, but some settings required to use Convex.
   */
  "compilerOptions": {
    /* These settings are not required by Convex and can be modified. */
    "allowJs": true,
    "strict": true,
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,

    /* These compiler options are required by Convex */
    "target": "ESNext",
    "lib": ["ES2021", "dom"],
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["./**/*"],
  "exclude": ["./_generated"]
}
EOF
fi

# Create README.md
print_status "Creating README.md..."
cat > "$PACKAGE_DIR/README.md" << EOF
# $CAPITALIZED_NAME

$CUSTOM_DESCRIPTION

## Getting Started

### Development

\`\`\`bash
cd $PACKAGE_NAME
npm install
npm run dev
\`\`\`

The application will be available at: http://localhost:$DEV_PORT

### Structure

- \`app/\` - Next.js application pages and layout
- \`components/\` - React components
- \`lib/\` - Utility functions
EOF

if [[ "$SKIP_CONVEX" == false ]]; then
    cat >> "$PACKAGE_DIR/README.md" << EOF
- \`convex/\` - Convex backend functions and schema

### Convex Setup

\`\`\`bash
npm run convex
\`\`\`
EOF
fi

cat >> "$PACKAGE_DIR/README.md" << EOF

### Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run lint\` - Run ESLint
EOF

if [[ "$SKIP_CONVEX" == false ]]; then
    cat >> "$PACKAGE_DIR/README.md" << EOF
- \`npm run convex\` - Start Convex development server
EOF
fi

# Install dependencies (if not skipped)
if [[ "$SKIP_INSTALL" == false ]]; then
    print_status "Installing dependencies..."
    cd "$PACKAGE_DIR"
    npm install
    cd "$WORKSPACE_ROOT"
else
    print_warning "Skipping dependency installation (--no-install flag)"
fi

# Update VS Code settings to add folder icon association
VSCODE_SETTINGS="$WORKSPACE_ROOT/.vscode/settings.json"
if [[ -f "$VSCODE_SETTINGS" ]]; then
    print_status "Adding folder icon association to VS Code settings..."
    if command -v jq >/dev/null 2>&1; then
        # Use jq to add the folder association
        tmp_file=$(mktemp)
        jq --arg pkg "$PACKAGE_NAME" '.["material-icon-theme.folders.associations"][$pkg] = "app"' "$VSCODE_SETTINGS" > "$tmp_file"
        mv "$tmp_file" "$VSCODE_SETTINGS"
        print_success "Folder icon association added for '$PACKAGE_NAME'"
    else
        print_warning "jq not installed - manually add \"$PACKAGE_NAME\": \"app\" to .vscode/settings.json folder associations"
    fi
else
    print_warning "VS Code settings not found - folder icon association not configured"
fi

print_success "Package '$PACKAGE_NAME' created successfully!"
print_status "Location: $PACKAGE_DIR"
print_status "Development server will run on: http://localhost:$DEV_PORT"

if [[ "$SKIP_INSTALL" == false ]]; then
    print_status "Ready to use! Run:"
    echo "  cd $PACKAGE_NAME"
    echo "  npm run dev"
else
    print_status "To finish setup:"
    echo "  cd $PACKAGE_NAME"
    echo "  npm install"
    echo "  npm run dev"
fi

if [[ "$SKIP_CONVEX" == false ]]; then
    print_status "Don't forget to setup Convex:"
    echo "  npm run convex"
fi