# Toast Notification System

A modern, reusable toast notification system has been implemented throughout the application.

## Features

- **4 Notification Types:**
  - ✅ Success (green) - For successful operations
  - ❌ Error (red) - For errors and failures
  - ⚠️ Warning (yellow) - For warnings and alerts
  - ℹ️ Info (blue) - For informational messages

- **Auto-dismiss:** Notifications automatically disappear after 3 seconds (customizable)
- **Manual dismiss:** Users can click the X button to close immediately
- **Smooth animations:** Slide-in animation from the right
- **Icons:** Each type has a unique icon for quick recognition
- **Responsive:** Works on all screen sizes
- **Non-blocking:** Appears in top-right corner without blocking content

## Implementation

### Components Created

1. **Toast.js** - The notification component
   - Location: `frontend/src/components/Toast.js`
   - Displays the notification with icon, message, and close button
   - Auto-dismisses after specified duration

2. **useToast.js** - Custom React hook
   - Location: `frontend/src/hooks/useToast.js`
   - Manages toast state and provides show/hide functions
   - Reusable across all components

### Usage in Components

The notification system has been integrated into:

1. **Login.js**
   - Welcome message on successful login with user's name
   - Error messages for failed login attempts
   - Validation errors for empty fields

2. **Register.js**
   - Success message on account creation
   - Error messages for registration failures
   - Validation warnings for incomplete forms
   - Password length validation

3. **AddExpense.js**
   - Success confirmation when expense is added
   - Warning for budget exceeded
   - Error messages for validation failures
   - Info for missing required fields

4. **Budget.js**
   - Success message when budget is saved
   - Info message for loading budget data
   - Error messages for API failures
   - Validation warnings

5. **ExpenseList.js**
   - Success confirmation for expense deletion
   - Success messages for CSV/Excel exports
   - Error messages for failed operations

## How to Use in New Components

```javascript
import Toast from "./Toast";
import useToast from "../hooks/useToast";

export default function YourComponent() {
  const { toast, showToast, hideToast } = useToast();

  const handleAction = () => {
    // Show success notification
    showToast("Action completed successfully!", "success");
    
    // Show error notification
    showToast("Something went wrong", "error");
    
    // Show warning with custom duration (5 seconds)
    showToast("Warning message", "warning", 5000);
    
    // Show info notification
    showToast("Here's some information", "info");
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}
      
      {/* Your component content */}
    </>
  );
}
```

## Notification Types

### Success
```javascript
showToast("Operation successful! ✅", "success");
```
- Green background
- Checkmark icon
- Use for: Successful saves, updates, deletions, logins

### Error
```javascript
showToast("Operation failed", "error");
```
- Red background
- X circle icon
- Use for: API errors, validation failures, network issues

### Warning
```javascript
showToast("Budget exceeded!", "warning");
```
- Yellow background
- Warning triangle icon
- Use for: Budget alerts, data warnings, cautionary messages

### Info
```javascript
showToast("Please select a date", "info");
```
- Blue background
- Info circle icon
- Use for: Helpful tips, informational messages, guidance

## Customization

### Duration
Default is 3000ms (3 seconds). To customize:
```javascript
showToast("Message", "success", 5000); // 5 seconds
```

### Styling
Toast styles are defined in `Toast.js` using Tailwind CSS classes. To customize:
- Edit the `styles` object for background colors
- Edit the `iconColors` object for icon colors
- Modify the animation in `frontend/src/index.css`

### Animation
The slide-in animation is defined in `index.css`:
```css
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

## Benefits Over alert()

1. **Non-blocking:** Doesn't stop code execution
2. **Better UX:** Modern, professional appearance
3. **Customizable:** Different types, durations, and styles
4. **Accessible:** Proper colors and icons for different message types
5. **Dismissible:** Users can close manually or wait for auto-dismiss
6. **Animated:** Smooth entrance and exit
7. **Positioned:** Top-right corner doesn't block content

## Examples in the App

### Login Success
```javascript
showToast(`Welcome back, ${userName}! 🎉`, "success");
```

### Expense Added
```javascript
showToast("Expense added successfully! ✅", "success");
```

### Budget Exceeded
```javascript
showToast(
  `Budget Exceeded! Budget: ₹${budget}, Spent: ₹${spent}`,
  "warning",
  5000
);
```

### Export Success
```javascript
showToast("CSV exported successfully! 📊", "success");
```

### Validation Error
```javascript
showToast("All fields are required", "warning");
```

## Future Enhancements

Possible improvements:
1. Stack multiple notifications
2. Add sound effects
3. Add progress bar for duration
4. Add action buttons (Undo, View, etc.)
5. Persist notifications across page navigation
6. Add notification history/log
7. Add notification preferences (enable/disable)
