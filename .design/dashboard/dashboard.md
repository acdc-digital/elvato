# SmolAccount Dashboard Architecture

> **VS Code-Inspired Financial Management Interface**  
> A modern, professional dashboard for tradies to manage invoices, expenses, and financial reporting.

---

## 📐 Overview

The SmolAccount dashboard implements a VS Code-inspired interface design pattern, providing tradies with a familiar, powerful environment for financial management. The architecture emphasizes modularity, maintainability, and visual clarity through a dark-mode-first design system.

### Project Context
- **Location**: `/tradies/smolaccount/app/dashboard/`
- **Framework**: Next.js 15+ with React 19
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui + Lucide React icons
- **Design Philosophy**: Dark mode first, VS Code aesthetics, professional financial management

---

## 🏗️ Architecture

### Layout Hierarchy

```
┌─────────────────────────────────────────────────────┐
│                    HEADER (32px)                    │
├──┬──────────┬───────────────────────────────────────┤
│  │          │                                        │
│A │          │                                        │
│C │   SIDE   │            EDITOR                     │
│T │   PANEL  │         (Main Content)                │
│I │  (240px) │                                        │
│V │          │  ┌─────────────────────────────────┐ │
│I │          │  │   TERMINAL (Overlay, 250px)     │ │
│T │          │  └─────────────────────────────────┘ │
│Y │          │                                        │
│  │          │                                        │
│B │          │                                        │
│A │          │                                        │
│R │          │                                        │
│  │          │                                        │
│48│          │                                        │
│px│          │                                        │
├──┴──────────┴───────────────────────────────────────┤
│                   FOOTER (22px)                     │
└─────────────────────────────────────────────────────┘
```

### Component Structure

| Component | File Path | Purpose | Dimensions |
|-----------|-----------|---------|------------|
| **Header** | `_components/Header.tsx` | Top navigation bar with branding | 32px height |
| **ActivityBar** | `_components/ActivityBar.tsx` | Left-side icon navigation | 48px width |
| **SidePanel** | `_components/SidePanel.tsx` | Context-specific sidebar menu | 240px width |
| **Editor** | `_components/Editor.tsx` | Main content area with tabs | Flex-fill |
| **Terminal** | `_components/Terminal.tsx` | Collapsible overlay terminal | 35-250px height |
| **Navigator** | `_components/Navigator.tsx` | Hidden placeholder (future) | Hidden |
| **Footer** | `_components/Footer.tsx` | Status bar at bottom | 22px height |
| **Dashboard** | `dashboard.tsx` | Main orchestrator component | Full viewport |

---

## 🎨 Design System

### Color Palette

| Element | Color Code | Usage |
|---------|-----------|-------|
| **Background (Deep)** | `#0e0e0e` | Root background |
| **Background (Dark)** | `#181818` | Header, ActivityBar |
| **Background (Medium)** | `#1e1e1e` | SidePanel, Editor, Terminal |
| **Background (Card)** | `#252526` | Badges, highlights |
| **Border** | `#2d2d2d` | All borders, separators |
| **Text (Primary)** | `#cccccc` | Active text, headings |
| **Text (Secondary)** | `#858585` | Inactive text, labels |
| **Accent (Blue)** | `#007acc` | Active indicators, CTAs |
| **Accent (Disabled)** | `#3d3d3d` | Disabled elements |

### Typography

- **Font Family**: System default (sans-serif)
- **Monospace**: For terminal and code display
- **Scale**:
  - `text-xs` (12px) - Primary UI text
  - `text-xl` (20px) - Section headers
  - `text-3xl` (30px) - Page titles

### Spacing Standards

- **Header**: 32px fixed height
- **Activity Bar**: 48px width, 48px button height (no padding)
- **SidePanel**: 240px width
- **Tab Bar**: 35px height
- **Terminal (collapsed)**: 35px height
- **Terminal (expanded)**: 250px height
- **Footer**: 22px height

---

## 🧩 Component Details

### 1. Header Component

**File**: `_components/Header.tsx`

**Responsibilities**:
- Display SmolAccount branding with logo
- Show application title and tagline
- Future: Theme toggle placement

**Key Features**:
- SmolTrades logo icon (16px height, auto width)
- Text: "SmolAccount | Financial Management for Tradies"
- Background: `#181818`
- Border: Bottom border `#2d2d2d`

**Implementation**:
```tsx
<header className="h-8 bg-[#181818] border-b border-[#2d2d2d]">
  <SmolTradesLogo className="h-4 w-auto text-[#858585]" />
  <span className="text-xs text-[#858585]">SmolAccount | ...</span>
</header>
```

---

### 2. ActivityBar Component

**File**: `_components/ActivityBar.tsx`

**Responsibilities**:
- Primary navigation between dashboard sections
- Visual indicator for active panel
- User account quick access

**Navigation Items** (Top Section):

| Icon | ID | Label | Description |
|------|----|----|-------------|
| 👑 Crown | `dashboard` | Dashboard | Main overview and quick stats |
| 📄 FileText | `invoices` | Invoices | Invoice management and creation |
| 💰 DollarSign | `expenses` | Expenses | Expense tracking and categories |
| 📊 BarChart3 | `reports` | Reports | Financial reports and analytics |
| 📅 Calendar | `calendar` | Calendar | Schedule and payment dates |
| 👤 User (Circle) | `account` | Account | User profile and settings |

**Navigation Items** (Bottom Section):

| Icon | ID | Label | Description |
|------|----|----|-------------|
| ⚙️ Settings | `settings` | Settings | Application configuration |

**Key Features**:
- **No padding/spacing**: Each button is 48x48px square
- **Active indicator**: 1px blue line on RIGHT edge (not left)
- **Account icon**: Special circular border with user initial
- **Hover states**: `bg-[#2d2d2d]` on hover
- **Active states**: Blue indicator + lighter text color

**State Management**:
```tsx
export type PanelType = 
  | "dashboard" | "invoices" | "expenses" 
  | "reports" | "calendar" | "settings" | "account" | null;
```

**Design Pattern**:
```tsx
// Standard icon button (48x48px, NO padding)
<button className="w-12 h-12 hover:bg-[#2d2d2d]">
  <Icon className="w-4.5 h-4.5" />
  {isActive && <div className="absolute right-0 w-[1px] bg-[#007acc]" />}
</button>

// Account icon (special case)
<button className="w-12 h-12">
  <div className="w-6 h-6 rounded-full border">
    {getUserInitial()} // Returns 'U'
  </div>
</button>
```

---

### 3. SidePanel Component

**File**: `_components/SidePanel.tsx`

**Responsibilities**:
- Display context-specific navigation and options
- Filter and categorization controls
- Quick actions for active panel

**Content by Panel**:

#### Dashboard Panel
- Quick Stats
- Recent Activity

#### Invoices Panel
- All Invoices
- Draft
- Sent
- Paid
- Overdue

#### Expenses Panel
- All Expenses
- Materials
- Tools & Equipment
- Vehicle
- Other

#### Reports Panel
- Income Statement
- Cash Flow
- Tax Summary

#### Calendar Panel
- Upcoming Jobs
- Payment Due Dates

#### Settings Panel
- Profile
- Business Details
- Integrations

#### Account Panel
- Profile
- Subscription
- Sign Out

**Key Features**:
- 240px fixed width
- Simple `<div>` wrapper (not shadcn Sidebar component)
- `flex-shrink-0` to prevent collapse
- Conditional rendering based on `activePanel`

**Implementation Note**:
> ⚠️ **Design Decision**: We replaced shadcn's `<Sidebar>` component with a simple `<div>` because the Sidebar uses `fixed` positioning which caused overlay issues with the header and footer. Our custom implementation uses flexbox for proper layout integration.

---

### 4. Editor Component

**File**: `_components/Editor.tsx`

**Responsibilities**:
- Main content display area
- Tab management for multiple views
- Future: Data visualization, heatmaps, invoice editing

**Tab System**:
- Tab bar: 35px height
- Tab width: 200px fixed
- Scroll controls: 8px buttons on left/right
- Add tab button: Right edge

**Current Content**:
Two placeholder badges with philosophical quotes:
1. "this could be my second language."
2. "gamblers think about profit, traders think about risk."

**Future Content Areas**:
- Invoice creation/editing forms
- Expense entry interfaces
- Financial reports with charts
- Calendar views
- Data visualizations (heatmaps)
- Settings panels

**Tab Bar Layout**:
```
┌───┬──────────────────────────────────────┬────┬────┬───┐
│ ◀ │  [Tab 1]  [Tab 2]  [Tab 3]  ...     │  ▶ │  + │   │
└───┴──────────────────────────────────────┴────┴────┴───┘
 8px           Scrollable area            8px  8px
```

**Key Features**:
- Tab scrolling with chevron controls (disabled when no overflow)
- Hover-to-show close button on tabs
- Active tab highlighting: `bg-[#1a1a1a]` vs `bg-[#0e0e0e]`
- Content area: `overflow-auto` for scrolling
- Background: `#1e1e1e`

---

### 5. Terminal Component

**File**: `_components/Terminal.tsx`

**Responsibilities**:
- Overlay terminal interface at bottom of editor
- Expand/collapse functionality
- Future: Command execution, logs, debugging

**States**:

| State | Height | Behavior |
|-------|--------|----------|
| Collapsed | 35px | Header bar only |
| Expanded | 250px | Full terminal with content |

**Key Features**:
- **Overlay positioning**: Uses `absolute` positioning with `z-10`
- **Positioned over Editor only**: Does not extend over SidePanel
- **Smooth transitions**: `duration-200` animation
- **Header controls**: 
  - Chevron up/down: Toggle expand/collapse
  - X button: Close terminal (also collapses)
- **Placeholder content**: Terminal prompt and coming soon message

**Implementation**:
```tsx
// In Dashboard.tsx
<div className="absolute bottom-0 left-0 right-0 z-10">
  <Terminal isCollapsed={isTerminalCollapsed} onToggle={...} />
</div>
```

**Design Pattern**:
> The terminal overlays the editor content rather than pushing it up. This maintains the editor's content position and provides a VS Code-like experience.

---

### 6. Navigator Component

**File**: `_components/Navigator.tsx`

**Status**: Hidden placeholder (`h-0 w-0 opacity-0`)

**Purpose**: Reserved for future implementation of advanced navigation features

**Future Capabilities**:
- Multi-file management
- Advanced tab system with file icons
- Breadcrumb navigation
- Context-aware toolbars

**Current Implementation**:
```tsx
export function Navigator() {
  return <div className="h-0 w-0 opacity-0" />;
}
```

---

### 7. Footer Component

**File**: `_components/Footer.tsx`

**Responsibilities**:
- Display status information
- Show error counts
- Display tech stack and version

**Layout**:

**Left Section**:
- © ACDC.digital
- Error count (with AlertCircle icon)
- Version: "SmolAccount v0.1.0"

**Right Section**:
- "▲ Next.js 15"
- "Financial Management Platform"

**Styling**:
- Background: `#2d2d2d` (darker than other components)
- Text: `#cccccc` primary, `#858585` secondary
- Height: 22px
- Font size: `text-xs` (12px)

---

### 8. Dashboard Container

**File**: `dashboard.tsx`

**Responsibilities**:
- Orchestrate all child components
- Manage global dashboard state
- Handle layout positioning and overflow

**State Management**:
```tsx
const [activePanel, setActivePanel] = useState<PanelType>("dashboard");
const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(true);
```

**Layout Structure**:
```tsx
<div className="h-screen w-screen flex flex-col">
  <Header />
  
  <div className="flex-1 flex overflow-hidden">
    <ActivityBar />
    <SidePanel />
    
    <div className="flex-1 flex flex-col relative">
      <div className="absolute inset-0">
        <Editor />
      </div>
      <div className="absolute bottom-0 z-10">
        <Terminal />
      </div>
    </div>
  </div>
  
  <Navigator /> {/* Hidden */}
  <Footer />
</div>
```

**Key Design Decisions**:

1. **Full viewport container**: `h-screen w-screen` ensures no scroll on body
2. **Flexbox hierarchy**: Proper stacking without overlaps
3. **Overflow control**: `overflow-hidden` prevents unwanted scrollbars
4. **Relative/absolute positioning**: Editor and Terminal use this pattern for overlay
5. **Z-index layering**: Terminal (`z-10`) over Editor (default)

---

## 🔧 Implementation Guide

### File Organization

```
/app/dashboard/
├── dashboard.tsx              # Main container orchestrator
├── page.tsx                   # Next.js page wrapper
├── layout.tsx                 # Dashboard-specific layout (if needed)
└── _components/
    ├── index.ts              # Barrel exports
    ├── Header.tsx            # Top navigation bar
    ├── ActivityBar.tsx       # Left icon navigation
    ├── SidePanel.tsx         # Context sidebar
    ├── Editor.tsx            # Main content area
    ├── Navigator.tsx         # Hidden placeholder
    ├── Terminal.tsx          # Bottom overlay terminal
    ├── Footer.tsx            # Status bar
    └── SmolTradesLogo.tsx    # Brand logo component
```

### Component Export Pattern

**File**: `_components/index.ts`

```tsx
export { Header } from "./Header";
export { ActivityBar, type PanelType } from "./ActivityBar";
export { SidePanel } from "./SidePanel";
export { Editor } from "./Editor";
export { Navigator } from "./Navigator";
export { Terminal } from "./Terminal";
export { Footer } from "./Footer";
```

**Usage**:
```tsx
import { Header, ActivityBar, SidePanel, ... } from "./_components";
```

---

## 📊 State Management

### Current Architecture

**Local State** (Dashboard.tsx):
- `activePanel`: Tracks which section is active
- `isTerminalCollapsed`: Terminal expand/collapse state

**Component State**:
- Editor: Tab management (tabs array, activeTabId)
- ActivityBar: User initial getter (placeholder for auth)
- Terminal: Internal UI state

### Future Considerations

As the application grows, consider migrating to:

**Option 1: Zustand**
```tsx
// store/dashboardStore.ts
export const useDashboardStore = create((set) => ({
  activePanel: "dashboard",
  isTerminalCollapsed: true,
  tabs: [],
  // ... actions
}));
```

**Option 2: Jotai**
```tsx
// atoms/dashboard.ts
export const activePanelAtom = atom<PanelType>("dashboard");
export const terminalCollapsedAtom = atom(true);
```

**State Migration Plan**:
1. Create central store for dashboard state
2. Migrate terminal state
3. Centralize tab management
4. Add user preferences persistence
5. Integrate with Convex for backend state

---

## 🎯 Key Features

### ✅ Implemented

- [x] VS Code-inspired dark theme
- [x] Activity bar with 7 navigation options
- [x] Context-specific side panel rendering
- [x] Tab management in editor
- [x] Collapsible terminal overlay
- [x] Brand logo integration (SmolTrades)
- [x] Responsive layout hierarchy
- [x] Active state indicators (1px blue right border)
- [x] No-padding activity buttons (full 48x48px)
- [x] Proper component architecture
- [x] Type-safe panel switching

### 🔄 Planned

- [ ] Authentication integration
- [ ] Real invoice creation/editing
- [ ] Expense tracking functionality
- [ ] Financial report generation
- [ ] Calendar with job scheduling
- [ ] Data visualization (heatmaps, charts)
- [ ] Terminal command execution
- [ ] File/document management
- [ ] Settings persistence
- [ ] Theme customization
- [ ] Mobile responsive layout

---

## 🚀 Development Workflow

### Running the Dashboard

```bash
# Navigate to project
cd /tradies/smolaccount

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Access dashboard
# http://localhost:3000/dashboard
```

### Adding New Features

**Example: Adding a New Activity Panel**

1. **Update PanelType**:
```tsx
// _components/ActivityBar.tsx
export type PanelType = 
  | "dashboard" | "invoices" | "expenses"
  | "reports" | "calendar" | "settings" | "account"
  | "new-feature"  // Add here
  | null;
```

2. **Add Navigation Item**:
```tsx
const activityItems = [
  // ... existing items
  { id: "new-feature", icon: NewIcon, label: "New Feature" },
];
```

3. **Add SidePanel Content**:
```tsx
// _components/SidePanel.tsx
case "new-feature":
  return <div>New feature sidebar content</div>;
```

4. **Add Editor Handling**:
```tsx
// _components/Editor.tsx
// Add logic to render content for new feature
```

### Component Modification Guidelines

1. **Maintain color palette**: Always use defined color codes
2. **Preserve spacing**: Follow established dimension standards
3. **Type safety**: Update TypeScript types when adding features
4. **Accessibility**: Include `title` attributes and ARIA labels
5. **Performance**: Use React.memo for expensive components
6. **Testing**: Test with collapsed/expanded terminal states

---

## 📝 Best Practices

### Layout Rules

1. **No overlapping elements**: Use proper flexbox/grid hierarchy
2. **Fixed dimensions**: Header, ActivityBar, Footer, SidePanel have fixed sizes
3. **Flexible content**: Editor fills remaining space
4. **Overlay pattern**: Terminal uses absolute positioning over Editor
5. **Scroll containment**: Only Editor content area scrolls

### Styling Conventions

1. **Tailwind classes**: Use utility-first approach
2. **Inline styles**: Avoid unless dynamic (e.g., transform values)
3. **Color consistency**: Always reference design system colors
4. **Spacing**: Use Tailwind spacing scale (p-2, p-4, etc.)
5. **Transitions**: Apply to interactive elements (buttons, panels)

### Component Patterns

1. **Props interface**: Always define TypeScript interfaces
2. **Client components**: Use `"use client"` directive for interactive components
3. **Conditional rendering**: Handle null/empty states
4. **Event handlers**: Prefix with `handle` (e.g., `handleActivityClick`)
5. **State naming**: Use clear, descriptive names

---

## 🐛 Common Issues & Solutions

### Issue: Sidebar Overlapping Header/Footer

**Problem**: shadcn's `<Sidebar>` component uses `fixed` positioning with `inset-y-0`

**Solution**: Replace with simple `<div>` wrapper:
```tsx
<div className="w-[240px] bg-[#1e1e1e] border-r border-[#2d2d2d] flex-shrink-0">
  {/* Content */}
</div>
```

### Issue: Terminal Pushes Content Up

**Problem**: Terminal in flex column layout affects editor height

**Solution**: Use absolute positioning overlay:
```tsx
<div className="absolute bottom-0 left-0 right-0 z-10">
  <Terminal />
</div>
```

### Issue: Activity Bar Not Visible

**Problem**: Layout hierarchy causing ActivityBar to be hidden

**Solution**: Ensure ActivityBar is at same flex level as work area:
```tsx
<div className="flex-1 flex">
  <ActivityBar />
  <SidePanel />
  <Editor />
</div>
```

### Issue: Active Indicator Wrong Position

**Problem**: Blue indicator on left instead of right, or 2px instead of 1px

**Solution**: Use 1px absolute positioned div on right edge:
```tsx
{isActive && (
  <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-[#007acc]" />
)}
```

---

## 📚 Additional Resources

### Related Documentation

- [QUICKSTART.md](../../tradies/smolaccount/QUICKSTART.md) - Setup instructions
- [README.md](../../tradies/smolaccount/README.md) - Project overview
- [Convex Instructions](../../.github/copilot-instructions.md) - Backend patterns

### Design References

- VS Code interface design
- Dark theme color systems
- Financial dashboard best practices
- Tradie-friendly UX patterns

### Tech Stack Documentation

- [Next.js 15 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)

---

## 🎓 Architecture Decisions

### Why VS Code Pattern?

1. **Familiarity**: Many developers use VS Code daily
2. **Professional**: Clean, modern aesthetic suitable for business software
3. **Scalable**: Pattern supports complex multi-panel layouts
4. **Accessible**: Clear visual hierarchy and navigation
5. **Customizable**: Easy to extend with new panels/features

### Why Dark Mode First?

1. **Reduced eye strain**: Better for extended use
2. **Professional appearance**: Modern, sleek aesthetic
3. **Battery efficiency**: Lower power consumption on OLED screens
4. **Brand consistency**: Aligns with tech-forward positioning
5. **User preference**: Growing expectation in professional tools

### Why Component Modularity?

1. **Maintainability**: Each component has single responsibility
2. **Testability**: Isolated components easier to test
3. **Reusability**: Components can be used in multiple contexts
4. **Scalability**: Easy to add new features without refactoring
5. **Collaboration**: Multiple developers can work simultaneously

---

## 🔮 Future Enhancements

### Phase 1: Core Functionality (Q1 2025)
- [ ] Convex backend integration
- [ ] Authentication system
- [ ] Invoice CRUD operations
- [ ] Expense tracking
- [ ] Basic reporting

### Phase 2: Advanced Features (Q2 2025)
- [ ] Data visualization (charts, heatmaps)
- [ ] Calendar scheduling
- [ ] Payment reminders
- [ ] Tax calculations
- [ ] Document attachments

### Phase 3: Automation (Q3 2025)
- [ ] AI-powered expense categorization
- [ ] Automated invoice generation
- [ ] Smart payment predictions
- [ ] Financial insights dashboard
- [ ] Integration with accounting software

### Phase 4: Mobile & Extensions (Q4 2025)
- [ ] Mobile responsive layout
- [ ] Native mobile app
- [ ] Browser extensions
- [ ] API for third-party integrations
- [ ] White-label options

---

## 📞 Support & Contribution

### Getting Help

- **Issues**: Check common issues section above
- **Documentation**: Review component details in this file
- **Code Examples**: See implementation guide section

### Contributing Guidelines

1. Follow established design system
2. Maintain TypeScript type safety
3. Write clear commit messages
4. Test all interactive features
5. Update documentation for new features

---

**Document Version**: 2.0  
**Last Updated**: January 2025  
**Maintained By**: ACDC Digital Development Team  
**Project**: SmolAccount - Financial Management for Tradies 