# Professional Error Handling Guide

## Overview

The Parkway platform now has a comprehensive, user-friendly error handling system that provides:

- ✅ **Structured Error Types** - Categorized errors with user-friendly messages
- ✅ **Global Error Handling** - Automatic error logging and processing
- ✅ **Error Boundary** - Catches React component errors
- ✅ **Offline Detection** - Detects and handles offline scenarios
- ✅ **Consistent Error Display** - Standardized error UI across the app

---

## 🎯 **Quick Start**

### **Basic Usage in Components**

```tsx
import { useErrorHandler } from '@/hooks';
import { ErrorDisplay } from '@/components/ui';

function MyComponent() {
  const { handleError } = useErrorHandler({ context: 'MyComponent' });
  
  const handleSubmit = async () => {
    try {
      await api.post('/endpoint', data);
    } catch (error) {
      // Automatically shows toast and logs error
      handleError(error);
      // OR use ErrorDisplay for inline errors
    }
  };
  
  return (
    <div>
      {error && <ErrorDisplay error={error} inline />}
    </div>
  );
}
```

---

## 📚 **Error Handling Patterns**

### **1. Form Errors (Inline + Toast)**

```tsx
import { useErrorHandler } from '@/hooks';
import { ErrorDisplay } from '@/components/ui';

function FormComponent() {
  const { handleError } = useErrorHandler();
  const [error, setError] = useState(null);
  
  const onSubmit = async (e) => {
    try {
      await api.post('/endpoint', formData);
    } catch (err) {
      const appError = handleError(err); // Shows toast
      setError(err); // Show inline error
    }
  };
  
  return (
    <form>
      {error && <ErrorDisplay error={error} inline />}
      {/* form fields */}
    </form>
  );
}
```

### **2. API Errors (Toast Only)**

```tsx
import { useErrorHandler } from '@/hooks';

function DataComponent() {
  const { handleError } = useErrorHandler();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        await api.get('/data');
      } catch (err) {
        handleError(err); // Only shows toast, no inline error needed
      }
    };
    fetchData();
  }, []);
}
```

### **3. Critical Errors (Full Page)**

```tsx
import { ErrorDisplay } from '@/components/ui';

function PageComponent() {
  const [error, setError] = useState(null);
  
  if (error) {
    return <ErrorDisplay error={error} />; // Full page error
  }
  
  return <div>Content</div>;
}
```

### **4. Silent Error Handling**

```tsx
import { useErrorHandler } from '@/hooks';

function Component() {
  const { handleErrorSilently } = useErrorHandler();
  
  const checkSomething = async () => {
    try {
      await api.get('/check');
    } catch (err) {
      // Handle silently, no toast
      const appError = handleErrorSilently(err);
      // Use appError for custom logic
    }
  };
}
```

---

## 🔧 **Error Types**

The system categorizes errors automatically:

| Error Type | Status Code | User Message | Retryable |
|------------|-------------|--------------|-----------|
| **NETWORK** | - | "Unable to connect..." | ✅ Yes |
| **TIMEOUT** | - | "Request took too long..." | ✅ Yes |
| **AUTHENTICATION** | 401 | "Session expired..." | ❌ No |
| **AUTHORIZATION** | 403 | "No permission..." | ❌ No |
| **NOT_FOUND** | 404 | "Resource not found..." | ❌ No |
| **VALIDATION** | 400/422 | "Check your input..." | ❌ No |
| **SERVER_ERROR** | 500+ | "Server error..." | ✅ Yes |

---

## 🎨 **Error Display Components**

### **ErrorDisplay Component**

```tsx
<ErrorDisplay
  error={error}
  title="Custom Title" // Optional
  onRetry={() => retry()} // Optional
  inline={true} // Show inline vs full page
  className="custom-class" // Optional
/>
```

### **ErrorMessage Component**

```tsx
<ErrorMessage
  title="Error Title"
  message="Error message"
  onRetry={() => retry()} // Optional
/>
```

---

## 🌐 **Offline Detection**

```tsx
import { useOffline } from '@/hooks';

function Component() {
  const { isOffline } = useOffline();
  
  if (isOffline) {
    return <div>You are offline. Some features may not work.</div>;
  }
  
  return <div>Online content</div>;
}
```

---

## 🔍 **Error Logging**

Errors are automatically logged with:
- Timestamp
- Context/Component name
- Error type and category
- User-friendly message
- Technical details
- Browser/user info

In development, logs appear in console.  
In production, integrate with Sentry (see TODO in `lib/errors.ts`).

---

## 📋 **Best Practices**

### ✅ **Do:**
- Use `useErrorHandler` hook for consistent error handling
- Show inline errors for form validation
- Use toast for non-critical API errors
- Use ErrorDisplay for full-page errors
- Provide context when calling `handleError`

### ❌ **Don't:**
- Don't catch errors and do nothing
- Don't show technical error messages to users
- Don't use console.error for user-facing errors
- Don't handle errors inconsistently across components

---

## 🚀 **Migration Guide**

### **Before (Old Pattern):**
```tsx
try {
  await api.post('/endpoint', data);
} catch (error) {
  showToast(error.response?.data?.message || 'Error occurred', 'error');
}
```

### **After (New Pattern):**
```tsx
const { handleError } = useErrorHandler({ context: 'ComponentName' });

try {
  await api.post('/endpoint', data);
} catch (error) {
  handleError(error); // Automatically shows user-friendly toast
}
```

---

## 📊 **Error Categories**

| Category | Display | Use Case |
|----------|---------|----------|
| **CRITICAL** | Full page ErrorMessage | Network errors, app crashes |
| **WARNING** | Toast + inline (optional) | API errors, validation issues |
| **INFO** | Toast only | Non-critical notifications |

---

## 🎯 **Summary**

The error handling system provides:

1. **Automatic Error Processing** - Errors are categorized and formatted automatically
2. **User-Friendly Messages** - Technical errors converted to readable messages
3. **Consistent UI** - Standardized error display across the app
4. **Error Logging** - Structured logging ready for production monitoring
5. **Offline Support** - Automatic offline detection and user notification

For more details, see the error handling implementation in:
- `apps/web/src/lib/errors.ts` - Error utilities
- `apps/web/src/hooks/useErrorHandler.ts` - Error handler hook
- `apps/web/src/components/ui/ErrorDisplay.tsx` - Error display component

