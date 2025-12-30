# Dashboard Components

This directory contains the modular components that make up the SmolAccount dashboard, inspired by VS Code's interface design.

## Architecture Overview

The dashboard follows a VS Code-inspired layout with the following component hierarchy:

```
Dashboard (Main Container)
├── Header (Top bar)
├── Main Content Area
│   ├── ActivityBar (Left sidebar navigation)
│   ├── Work Area
│   │   ├── SidePanel (Context-specific left panel)
│   │   ├── Editor (Main content area)
│   │   └── Terminal (Right expandable sidebar)
│   └── Navigator (Hidden placeholder)
└── Footer (Status bar)
```

## Component Details

### Header
- **File**: `Header.tsx`
- **Purpose**: Top bar with app title and future theme toggle
- **Height**: 32px (h-8)
- **Colors**: bg-[#181818], border-[#2d2d2d]

### ActivityBar
- **File**: `ActivityBar.tsx`
- **Purpose**: Left navigation bar with icon buttons
- **Width**: 48px (w-12)
- **Features**: 
  - Dashboard, Invoices, Expenses, Reports, Calendar icons
  - Account and Settings icons at bottom
  - Active state indication with left border
- **Colors**: bg-[#181818], active: border-[#007acc]

### SidePanel
- **File**: `SidePanel.tsx`
- **Purpose**: Context-sensitive navigation panel using shadcn sidebar
- **Width**: 240px (w-[240px])
- **Features**: 
  - Dynamically updates based on active panel
  - Uses shadcn/ui Sidebar components for consistency
- **Colors**: bg-[#1e1e1e], border-[#2d2d2d]

### Editor
- **File**: `Editor.tsx`
- **Purpose**: Main content area with tabbed interface
- **Features**:
  - Tab bar (35px height) with scroll controls
  - Tab management (add, close, switch)
  - Large scrollable content area for data visualization
  - Placeholder for heatmap and charts
- **Colors**: bg-[#1e1e1e], tabs: bg-[#1a1a1a]

### Navigator
- **File**: `Navigator.tsx`
- **Purpose**: Placeholder for future navigation menu
- **Status**: Currently hidden (h-0 w-0 opacity-0)
- **Note**: Will be scaffolded and expanded as functionality is added

### Terminal
- **File**: `Terminal.tsx`
- **Purpose**: Expandable terminal panel on right side
- **Width**: 400px (w-[400px])
- **Features**: 
  - Opens as Sheet from right side
  - Floating button trigger at bottom-right
  - Uses shadcn/ui Sheet component
- **Colors**: bg-[#1e1e1e], border-[#2d2d2d]

### Footer
- **File**: `Footer.tsx`
- **Purpose**: Status bar at bottom
- **Height**: 22px (h-[22px])
- **Features**:
  - Left: Copyright, error count, version
  - Right: Tech stack, platform info
- **Colors**: bg-[#2d2d2d], text-[#cccccc]

## Color Palette

The dashboard uses a VS Code-inspired dark theme:

- **Background (darkest)**: `#0e0e0e`
- **Background (dark)**: `#181818`
- **Background (medium)**: `#1e1e1e`
- **Background (panels)**: `#252526`
- **Borders**: `#2d2d2d`
- **Accent (blue)**: `#007acc`
- **Text (primary)**: `#cccccc`
- **Text (secondary)**: `#858585`
- **Text (disabled)**: `#3d3d3d`

## Component Types

```typescript
export type PanelType = 
  | "dashboard"
  | "invoices" 
  | "expenses"
  | "reports"
  | "calendar"
  | "settings"
  | "account"
  | null;
```

## Usage

Import the main Dashboard component:

```tsx
import { Dashboard } from "@/app/dashboard/dashboard";

export default function HomePage() {
  return <Dashboard />;
}
```

Or import individual components:

```tsx
import { 
  Header, 
  ActivityBar, 
  SidePanel, 
  Editor, 
  Terminal, 
  Footer 
} from "@/app/dashboard/_components";
```

## Future Enhancements

1. **Navigator**: Full navigation menu with routing
2. **Terminal**: Interactive terminal with command execution
3. **Editor**: 
   - Data visualization components
   - Financial heatmap
   - Chart integrations
4. **State Management**: Consider Zustand or Jotai for complex state
5. **Authentication**: Integrate auth provider for user sessions
6. **Real-time Updates**: Convex integration for live data

## Design Principles

1. **Modularity**: Each component is self-contained and reusable
2. **Dark Mode First**: Built with dark theme as primary
3. **Accessibility**: Proper ARIA labels and keyboard navigation
4. **Performance**: Efficient rendering and state management
5. **Maintainability**: Clear file structure and TypeScript types
