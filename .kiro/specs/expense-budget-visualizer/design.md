# Technical Design Document: Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a single-page application built with vanilla HTML, CSS, and JavaScript. It provides a clean, mobile-first interface for tracking expenses and visualizing spending patterns. All data persists in browser Local Storage, enabling offline functionality without backend infrastructure.

**Key Design Principles:**
- Single responsibility: each module handles one concern
- Local-first storage: all data persists immediately to Local Storage
- Real-time reactivity: UI updates instantly when state changes
- Mobile-optimized: responsive design from 320px to 1920px
- Progressive enhancement: core functionality works without optional features

---

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                      │
│  ┌──────────┬──────────────┬──────────────┬──────────────┐  │
│  │ Balance  │ Add Txn Form │ Transaction  │   Chart &    │  │
│  │ Display  │              │   History    │  Analytics   │  │
│  └──────────┴──────────────┴──────────────┴──────────────┘  │
└────────────────────────┬─────────────────────────────────────┘
                         │ Event Handlers
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Application State Management                     │
│  ┌──────────────┬─────────────┬──────────────┬──────────┐   │
│  │ Transactions │  Categories │   Settings   │ Filters  │   │
│  └──────────────┴─────────────┴──────────────┴──────────┘   │
│              (Maintained in AppState)                         │
└────────────────────────┬─────────────────────────────────────┘
                         │ Read/Write
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Storage Layer (Local Storage)               │
│  Keys: transactions, categories, settings, balance           │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Input** → Event handler captures user action
2. **Validation** → Input is validated against rules
3. **State Update** → AppState is mutated with new data
4. **Persistence** → Updated state is immediately saved to Local Storage
5. **Rendering** → UI components re-render to reflect new state
6. **Display** → Updated UI is visible to user

### Module Structure

```
app.js (Main entry point)
├── StorageManager (Local Storage abstraction)
├── AppState (Application state container)
├── UIManager (Rendering and event delegation)
├── TransactionManager (Transaction operations)
├── CategoryManager (Category operations)
├── ChartRenderer (Chart generation)
├── FilterManager (Sorting and filtering)
└── ThemeManager (Dark/Light mode)
```

---

## Components and Interfaces

### 1. StorageManager

Handles all Local Storage read/write operations.

```javascript
StorageManager.get(key)        // Returns parsed JSON or null
StorageManager.set(key, data)  // Serializes and stores data
StorageManager.remove(key)     // Deletes a key
StorageManager.clear()         // Clears all application data
StorageManager.validate(data)  // Validates data integrity
```

**Stored Keys:**
- `ebv_transactions`: Array of transaction objects
- `ebv_categories`: Array of category objects
- `ebv_initial_balance`: Number
- `ebv_settings`: Object with spending limits and preferences
- `ebv_theme`: String ('light' or 'dark')

### 2. AppState

Central state container managing all application data.

```javascript
AppState.init()              // Initialize or restore state
AppState.get()               // Return current state object
AppState.addTransaction(txn) // Add transaction, update balance
AppState.removeTransaction(id) // Remove transaction
AppState.updateTransaction(id, updates) // Modify transaction
AppState.addCategory(name)   // Add custom category
AppState.setInitialBalance(amount) // Set starting balance
AppState.getBalance()        // Calculate current balance
AppState.subscribe(callback) // Subscribe to state changes
AppState.setState(newState)  // Replace entire state (for persistence recovery)
```

**State Structure:**
```javascript
{
  initialBalance: number,
  transactions: [
    {
      id: string (UUID),
      amount: number,
      category: string,
      date: string (YYYY-MM-DD),
      description: string,
      timestamp: number (milliseconds)
    }
  ],
  categories: [
    {
      id: string,
      name: string,
      color: string (hex),
      isCustom: boolean
    }
  ],
  settings: {
    totalBudget: number or null,
    categoryBudgets: { categoryId: number },
    sortBy: 'date' | 'amount' | 'category',
    sortOrder: 'asc' | 'desc',
    filterCategory: string or null
  }
}
```

### 3. UIManager

Handles all DOM rendering and event delegation.

```javascript
UIManager.render()              // Render entire UI
UIManager.updateBalance()       // Update balance display
UIManager.updateTransactionList() // Update transaction table
UIManager.updateChart()         // Update spending chart
UIManager.showError(message)    // Display error notification
UIManager.clearError()          // Clear error message
UIManager.setTheme(theme)       // Apply theme to DOM
```

**Main UI Sections:**
- Header: Balance display + settings toggle
- Form Section: Add transaction inputs
- Filter/Sort Controls: Dropdown selectors
- Transaction List: Scrollable table with delete buttons
- Chart Container: Chart visualization
- Footer: Attribution and version

### 4. TransactionManager

Business logic for transaction operations.

```javascript
TransactionManager.validate(txnData) // Validate transaction fields
TransactionManager.calculateBalance() // Sum all transactions from balance
TransactionManager.getFiltered(filter) // Return filtered transactions
TransactionManager.getSorted(transactions, sortBy, order) // Sort transactions
TransactionManager.getByCategory(category) // Get transactions for category
TransactionManager.getByMonth(month) // Get transactions for month
```

**Validation Rules:**
- Amount: must be positive number, max 999,999.99
- Date: must be valid YYYY-MM-DD, not in future
- Category: must exist in categories list
- Description: optional, max 200 characters
- All fields present except description

### 5. CategoryManager

Manages category list and operations.

```javascript
CategoryManager.getAll()       // Return all categories
CategoryManager.getDefault()   // Return predefined categories
CategoryManager.add(name, color) // Add custom category
CategoryManager.remove(id)     // Remove custom category
CategoryManager.exists(name)   // Check if category exists
CategoryManager.getColor(id)   // Get category color
```

**Default Categories:**
- Food (Orange: #FF9500)
- Transport (Blue: #007AFF)
- Entertainment (Purple: #9C27B0)
- Utilities (Red: #F44336)
- Healthcare (Green: #4CAF50)
- Shopping (Pink: #E91E63)
- Other (Gray: #757575)

### 6. ChartRenderer

Generates spending visualization.

```javascript
ChartRenderer.renderChart(container, data) // Render chart in element
ChartRenderer.calculateData()  // Compute category totals
ChartRenderer.generateColors() // Create color array for categories
ChartRenderer.drawBars(canvas, data) // Draw bar chart
ChartRenderer.drawPie(canvas, data)  // Draw pie chart (alternative)
```

**Chart Types:**
- Primary: Horizontal bar chart (category vs. spending)
- Secondary: Monthly trend line chart (for monthly view)

### 7. FilterManager

Handles transaction filtering and sorting.

```javascript
FilterManager.setCategory(categoryId) // Filter by category
FilterManager.clearCategory()  // Clear category filter
FilterManager.setSortBy(field) // Set sort field
FilterManager.setSortOrder(order) // Set sort direction
FilterManager.getFiltered()    // Return filtered/sorted transactions
FilterManager.reset()          // Clear all filters
```

### 8. ThemeManager

Manages dark/light mode switching.

```javascript
ThemeManager.init()            // Load saved theme
ThemeManager.set(theme)        // Apply theme ('light' or 'dark')
ThemeManager.toggle()          // Switch themes
ThemeManager.get()             // Return current theme
ThemeManager.getCSSVariables(theme) // Return color variables
```

**CSS Variables for Theming:**
```css
--bg-primary, --bg-secondary
--text-primary, --text-secondary
--border-color, --hover-bg
--accent-color, --error-color
```

---

## Data Models

### Transaction Model

```javascript
interface Transaction {
  id: string,                  // UUID v4
  amount: number,              // cents (stored as whole numbers to avoid float errors)
  category: string,            // category name or ID
  date: string,                // YYYY-MM-DD format
  description: string,         // optional, max 200 chars
  timestamp: number            // Date.now() for sorting precision
}
```

**Storage Format:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 1550,
  "category": "Food",
  "date": "2024-08-26",
  "description": "Lunch at restaurant",
  "timestamp": 1693024800000
}
```

### Category Model

```javascript
interface Category {
  id: string,              // UUID or predefined name
  name: string,            // "Food", "Transport", etc.
  color: string,           // hex color #RRGGBB
  isCustom: boolean        // true for user-created
}
```

### Budget Limit Model

```javascript
interface BudgetLimit {
  type: 'total' | 'category',
  limit: number,           // spending threshold
  categoryId?: string,     // only if type is 'category'
  alertThreshold: 0.8      // alert at 80% of limit
}
```

---

## Storage Schema

### Local Storage Structure

```javascript
// Key: ebv_transactions
// Value: JSON stringified array
[
  {
    "id": "uuid-1",
    "amount": 2500,
    "category": "Food",
    "date": "2024-08-26",
    "description": "Groceries",
    "timestamp": 1693024800000
  },
  // ... more transactions
]

// Key: ebv_categories
[
  {
    "id": "food",
    "name": "Food",
    "color": "#FF9500",
    "isCustom": false
  },
  // ... more categories
]

// Key: ebv_initial_balance
5000

// Key: ebv_settings
{
  "totalBudget": 5000,
  "categoryBudgets": {
    "food": 1000,
    "transport": 500
  },
  "sortBy": "date",
  "sortOrder": "desc",
  "filterCategory": null
}

// Key: ebv_theme
"light"
```

### Migration Strategy

```javascript
// Version in Local Storage: ebv_version
// Current version: 1
// When loading, check version and migrate if needed

// Example: v0 → v1
// - Add 'timestamp' field to all transactions
// - Restructure categories object to array
// - Add 'isCustom' flag to categories
```

---

## API/Interface Definitions

### Core Application API

#### Balance Management
```javascript
getBalance(): number
  // Returns current balance = initialBalance - sum(transactions)
  
setInitialBalance(amount: number): void
  // Sets starting balance, validates amount > 0

getInitialBalance(): number
  // Returns stored initial balance
```

#### Transaction Operations
```javascript
addTransaction(amount: number, category: string, 
               date: string, description?: string): {success, error?}
  // Validates and stores transaction
  
deleteTransaction(id: string): {success, error?}
  // Removes transaction by ID, recalculates balance
  
editTransaction(id: string, updates: Partial<Transaction>): {success, error?}
  // Updates specific transaction fields
  
getTransactions(filters?: {category, dateRange}): Transaction[]
  // Returns transactions, optionally filtered
  
getTransactionsByMonth(year: number, month: number): Transaction[]
  // Returns transactions for specific month (1-12)
```

#### Category Operations
```javascript
getCategories(): Category[]
  // Returns all categories (default + custom)
  
addCustomCategory(name: string, color?: string): {success, error?}
  // Creates new category, validates name uniqueness
  
deleteCustomCategory(id: string): {success, error?}
  // Removes custom category, prevents deletion of defaults
  
getCategorySpending(categoryId: string): number
  // Returns total spending in category
```

#### Analytics & Reports
```javascript
getMonthlySpending(year: number, month: number): 
  {total: number, byCategory: {categoryId: number}}
  // Returns spending summary for month
  
getMonthlySummary(): 
  {year: number, month: number, total: number}[]
  // Returns spending for all months with data
  
getCategoryBreakdown(): 
  {categoryId: string, name: string, total: number, percentage: number}[]
  // Returns spending distribution across categories
```

#### Budget Management
```javascript
setBudgetLimit(type: 'total'|'category', limit: number, 
               categoryId?: string): void
  // Sets spending threshold
  
getBudgetStatus(): {isOverBudget: boolean, categories: {}}
  // Returns current budget compliance
  
checkBudgetAlert(): {triggered: boolean, category?: string}
  // Returns alert status if budget exceeded
```

---

## Algorithms

### 1. Balance Calculation

```javascript
function calculateBalance(initialBalance, transactions) {
  const spent = transactions.reduce((sum, txn) => sum + txn.amount, 0);
  return initialBalance - spent;
}
```

**Complexity:** O(n) where n = number of transactions
**Caching:** Recalculate on every transaction change (acceptable for typical use)

### 2. Filtering and Sorting

```javascript
function getFilteredAndSorted(transactions, filters, sort) {
  // Filter: O(n)
  let result = transactions;
  if (filters.category) {
    result = result.filter(t => t.category === filters.category);
  }
  
  // Sort: O(n log n)
  result.sort((a, b) => {
    let aVal = a[sort.field];
    let bVal = b[sort.field];
    
    if (typeof aVal === 'string') {
      return sort.order === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return sort.order === 'asc' 
      ? aVal - bVal 
      : bVal - aVal;
  });
  
  return result;
}
```

**Complexity:** O(n log n) due to sorting
**Optimization:** Memoize sorted results, only re-sort on data change

### 3. Category Aggregation

```javascript
function getCategoryTotals(transactions) {
  const totals = {};
  
  for (let txn of transactions) {
    if (!totals[txn.category]) {
      totals[txn.category] = 0;
    }
    totals[txn.category] += txn.amount;
  }
  
  return Object.entries(totals).map(([category, total]) => ({
    category,
    total,
    percentage: (total / sum) * 100
  }));
}
```

**Complexity:** O(n)

### 4. Monthly Aggregation

```javascript
function getMonthlyTotals(transactions) {
  const months = {};
  
  for (let txn of transactions) {
    const [year, month] = txn.date.split('-').slice(0, 2);
    const key = `${year}-${month}`;
    
    if (!months[key]) {
      months[key] = {year, month, total: 0, byCategory: {}};
    }
    
    months[key].total += txn.amount;
    
    const cat = txn.category;
    if (!months[key].byCategory[cat]) {
      months[key].byCategory[cat] = 0;
    }
    months[key].byCategory[cat] += txn.amount;
  }
  
  return Object.values(months).sort((a, b) => 
    new Date(`${b.year}-${b.month}`) - new Date(`${a.year}-${a.month}`)
  );
}
```

**Complexity:** O(n log m) where m = number of months

### 5. Budget Alert Detection

```javascript
function checkBudgetAlerts(spending, budgets) {
  const alerts = [];
  
  // Check total budget
  if (budgets.total && spending.total > budgets.total * 0.8) {
    alerts.push({
      type: 'total',
      severity: spending.total > budgets.total ? 'critical' : 'warning',
      percentage: (spending.total / budgets.total) * 100
    });
  }
  
  // Check category budgets
  for (let [categoryId, categoryBudget] of Object.entries(budgets.categories)) {
    if (spending.byCategory[categoryId]) {
      const spent = spending.byCategory[categoryId];
      if (spent > categoryBudget * 0.8) {
        alerts.push({
          type: 'category',
          categoryId,
          severity: spent > categoryBudget ? 'critical' : 'warning',
          percentage: (spent / categoryBudget) * 100
        });
      }
    }
  }
  
  return alerts;
}
```

**Complexity:** O(n + m) where n = categories, m = budget entries

---

## Error Handling

### Input Validation

```javascript
// Transaction validation
const validate = {
  amount: (val) => {
    if (typeof val !== 'number') return 'Amount must be a number';
    if (val <= 0) return 'Amount must be positive';
    if (val > 999999.99) return 'Amount exceeds maximum';
    return null;
  },
  
  date: (val) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) 
      return 'Date must be YYYY-MM-DD format';
    if (new Date(val) > new Date()) 
      return 'Date cannot be in the future';
    return null;
  },
  
  category: (val, categories) => {
    if (!categories.find(c => c.name === val)) 
      return 'Invalid category';
    return null;
  },
  
  description: (val) => {
    if (val && val.length > 200) 
      return 'Description exceeds 200 characters';
    return null;
  }
};
```

### Storage Error Handling

```javascript
try {
  StorageManager.set(key, data);
} catch (e) {
  if (e instanceof QuotaExceededError) {
    UIManager.showError('Storage quota exceeded. Delete some transactions.');
  } else {
    UIManager.showError('Failed to save data. Please try again.');
  }
}
```

### Data Corruption Recovery

```javascript
function recoverFromCorruption() {
  // Attempt to load each storage key separately
  const recovered = {
    transactions: [],
    categories: CategoryManager.getDefault(),
    initialBalance: 5000,
    settings: getDefaultSettings()
  };
  
  // Try to load transactions, discard if invalid
  try {
    const stored = JSON.parse(localStorage.getItem('ebv_transactions'));
    if (Array.isArray(stored) && stored.every(validateTransaction)) {
      recovered.transactions = stored;
    }
  } catch (e) {
    console.error('Transaction data corrupted, starting fresh');
  }
  
  // Warn user but continue with recovered state
  UIManager.showError('Some data was corrupted and has been reset.');
  
  return recovered;
}
```

### Error Messages

| Scenario | Message |
|----------|---------|
| Invalid amount | "Amount must be a positive number (max 999,999.99)" |
| Invalid date | "Please enter a valid date (YYYY-MM-DD)" |
| Missing required field | "All fields except description are required" |
| Duplicate category | "Category already exists" |
| Empty transaction history | "No transactions recorded yet" |
| Storage quota exceeded | "Storage is full. Delete some transactions." |
| Data corruption | "Some data was damaged. Your data has been reset." |

---

## Performance Considerations

### Load Time Optimization

**Target:** Application loads and renders within 3 seconds

1. **Initial Load:**
   - Index.html: Minimal structure (< 5KB)
   - CSS: Single file, inlined critical styles (< 30KB)
   - JS: Single file, minified (< 50KB target)
   - Lazy render: Build DOM tree first, then render transactions

2. **Storage Load:**
   ```javascript
   // Async load from Local Storage to avoid blocking
   async function loadApplication() {
     // Phase 1: Show skeleton UI immediately (< 100ms)
     UIManager.renderSkeleton();
     
     // Phase 2: Load state from storage (< 500ms)
     const state = await loadStateFromStorage();
     
     // Phase 3: Render main content (< 1s)
     AppState.setState(state);
     UIManager.render();
     
     // Phase 4: Render charts (< 1.5s)
     UIManager.updateChart();
   }
   ```

### Runtime Performance

**Target:** Real-time responsiveness (< 100ms for user actions)

1. **Transaction Addition:**
   - Validation: O(1) - immediate
   - State update: O(1) - single push
   - Storage write: O(n) - async, non-blocking
   - UI update: O(n log n) - sort and re-render

2. **Chart Rendering:**
   - Calculate totals: O(n) once per render
   - Canvas drawing: O(k) where k = categories
   - Debounce chart updates: 300ms delay to batch changes

3. **Large Dataset Handling:**
   - 500 transactions: 50-100ms sort time
   - 1000 transactions: 100-200ms sort time
   - Pagination for lists > 100 items (optional enhancement)

### Memory Optimization

```javascript
// Memoization: Cache expensive calculations
const memo = {
  categoryTotals: null,
  monthlyData: null,
  filteredTransactions: null
};

function getCategoryTotals() {
  if (!memo.categoryTotals) {
    memo.categoryTotals = calculateCategoryTotals(AppState.get().transactions);
  }
  return memo.categoryTotals;
}

// Invalidate cache on state change
AppState.subscribe(() => {
  memo.categoryTotals = null;
  memo.monthlyData = null;
  memo.filteredTransactions = null;
});
```

### Chart Performance

```javascript
// Use Canvas API for efficient rendering
// Batch DOM updates to reduce reflows
// Debounce chart updates during rapid transactions
function updateChartDebounced() {
  clearTimeout(updateChartDebounced.timeout);
  updateChartDebounced.timeout = setTimeout(() => {
    UIManager.updateChart();
  }, 300);
}
```

### Storage Optimization

- **String vs Binary:** Transactions stored as JSON strings (text)
- **Typical Size:**
  - 100 transactions: ~15KB
  - 1000 transactions: ~150KB
  - Local Storage limit: 5-10MB (platform dependent)
- **Cleanup:** Monthly summary feature enables archiving old transactions (future enhancement)

---

## Testing Strategy

Since this feature involves pure data transformations (calculating balances, filtering, aggregating), sorting transactions, and validating inputs, property-based testing is applicable to core business logic while example-based tests cover UI interactions and integration with Local Storage.

### Unit Tests (Example-Based)

Cover specific scenarios and edge cases:

**Validation:**
- Valid transaction with all fields
- Transaction with missing optional description
- Invalid amounts (negative, zero, non-numeric, exceeding max)
- Invalid dates (future dates, invalid format, leap year edge cases)
- Invalid categories

**Balance Calculation:**
- Single transaction
- Multiple transactions
- Initial balance update
- Balance with no transactions (equals initial balance)

**Storage Operations:**
- Save and retrieve transactions
- Corrupted JSON handling
- Quota exceeded simulation
- Theme persistence

**UI Interactions:**
- Form submission with valid data
- Form submission with invalid data shows error
- Delete transaction updates balance immediately
- Category filter works correctly
- Sort order toggles

### Integration Tests (Example-Based)

Cover workflows across components:

1. **New User Workflow:**
   - Set initial balance → Add transaction → View in list and chart

2. **Data Persistence Workflow:**
   - Add transaction → Close/reopen → Data restored

3. **Budget Alert Workflow:**
   - Set budget limit → Add transactions within limit → Add transaction exceeding limit → Alert displays

4. **Filtering Workflow:**
   - Add multiple transactions different categories → Filter by category → Chart updates

---

## Implementation Roadmap

### Phase 1: Core (Req 1-5)
1. Storage Manager setup
2. App State container
3. Balance display
4. Transaction form and history
5. Persistence to Local Storage

### Phase 2: Visualization (Req 4)
6. Chart rendering
7. Category default setup

### Phase 3: Management Features (Req 7-9)
8. Category management
9. Sort and filter controls
10. Monthly summary view

### Phase 4: Polish & Alerts (Req 10-12)
11. Budget limits and alerts
12. Dark/Light mode
13. UI refinements

### Phase 5: Optional Enhancements
14. Data export
15. Transaction editing
16. Recurring transactions

---

## Key Design Decisions

| Decision | Rationale | Alternative Considered |
|----------|-----------|------------------------|
| Single JS file | Simplicity, no build step | Modular structure with imports |
| CSV Local Storage keys | Easy debugging, predictable | Single JSON object |
| Amounts in cents (as integers) | Avoid float precision errors | Storing as decimals |
| UUID for IDs | Unique across sessions | Auto-incrementing IDs |
| Canvas for charts | Better performance than SVG | SVG for scalability |
| Debounced chart updates | Prevent jank during rapid input | Immediate re-render |
| Real-time balance update | Better UX | Update on save only |
| Horizontal bar chart | Mobile-friendly | Pie or vertical charts |

---

## Browser Compatibility

**Supported:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required APIs:**
- LocalStorage
- Canvas
- Fetch (for future file export)
- Date/Time APIs

**Not Supported:**
- IE 11 (no class syntax, no spread operator)
- Mobile browsers older than 2022

---

## Accessibility Considerations

- ARIA labels on form inputs
- Keyboard navigation support (Tab through form fields, Enter to submit)
- Color contrast: 4.5:1 for text (WCAG AA)
- Touch targets: minimum 44x44px (iOS standard)
- Dark mode with sufficient contrast
- Semantic HTML: form, input, button, table elements
- Focus indicators visible for keyboard users

---

## File Structure

```
project/
├── index.html          (Main HTML file)
├── style.css           (Single CSS file, all responsive styles)
├── app.js              (Single JS file, all logic)
└── README.md           (Documentation)
```

**File Size Targets:**
- index.html: < 5KB
- style.css: < 30KB (minified)
- app.js: < 50KB (minified)
- Total: < 85KB

---

## Summary

This design provides a scalable, maintainable architecture for the Expense & Budget Visualizer while adhering to all technical constraints. The modular organization of concerns (storage, state, UI, business logic) enables independent testing and modification. Real-time reactivity, immediate persistence, and responsive design ensure a smooth mobile experience. The design supports all 12 requirements while maintaining a clean, minimal interface focused on core functionality.
