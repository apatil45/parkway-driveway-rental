# Parkway Design System - Robust Structure

## 🎯 **Design System Principles**

### 1. **Consistency First**
- All components must use design system classes
- No hardcoded colors, spacing, or typography
- Systematic approach to all visual elements

### 2. **Scalability**
- Easy to maintain and update
- Clear component variants
- Predictable behavior

### 3. **Accessibility**
- WCAG 2.1 AA compliance
- Proper contrast ratios
- Keyboard navigation support

## 🎨 **Color System**

### Primary Colors
- `primary-600` (#276EF1) - Main brand color
- `primary-700` (#1d4ed8) - Hover states
- `primary-100` (#dbeafe) - Light backgrounds

### Semantic Colors
- `success-500` (#00D4AA) - Success states
- `warning-500` (#FFB800) - Warning states
- `error-500` (#E53E3E) - Error states

### Neutral Colors
- `gray-50` to `gray-900` - Text and backgrounds
- `white` - Primary background
- `black` - Primary text

## 📏 **Spacing System**

### Base Unit: 4px (0.25rem)
- `space-1` = 4px
- `space-2` = 8px
- `space-3` = 12px
- `space-4` = 16px
- `space-6` = 24px
- `space-8` = 32px
- `space-12` = 48px
- `space-16` = 64px

### Component Spacing
- **Padding**: `p-4`, `p-6`, `p-8`
- **Margins**: `m-4`, `m-6`, `m-8`
- **Gaps**: `gap-4`, `gap-6`, `gap-8`

## 🔤 **Typography System**

### Font Sizes
- `text-xs` (12px) - Small labels
- `text-sm` (14px) - Body text
- `text-base` (16px) - Default text
- `text-lg` (18px) - Large text
- `text-xl` (20px) - Headings
- `text-2xl` (24px) - Section headers
- `text-3xl` (30px) - Page titles

### Font Weights
- `font-normal` (400) - Body text
- `font-medium` (500) - Emphasized text
- `font-semibold` (600) - Headings
- `font-bold` (700) - Important headings

## 🎭 **Component Variants**

### Button Variants
- `.btn-primary` - Primary actions
- `.btn-secondary` - Secondary actions
- `.btn-outline` - Outline buttons
- `.btn-ghost` - Subtle actions

### Button Sizes
- `.btn-sm` - Small buttons
- `.btn` - Default buttons
- `.btn-lg` - Large buttons

### Card Variants
- `.card` - Default cards
- `.card-compact` - Compact cards
- `.card-lg` - Large cards

## 🔧 **Implementation Rules**

### 1. **No Hardcoded Values**
❌ `className="px-4 py-2 bg-blue-600"`
✅ `className="btn btn-secondary"`

### 2. **Use Design System Classes**
❌ `className="rounded-lg shadow-md"`
✅ `className="card"`

### 3. **Consistent Spacing**
❌ `className="p-3 m-2"`
✅ `className="p-4 m-4"`

### 4. **Semantic Color Usage**
❌ `className="text-blue-600"`
✅ `className="text-primary-600"`
