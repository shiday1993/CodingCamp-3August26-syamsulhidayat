# Implementation Plan: Expense & Budget Visualizer

## Overview

The implementation follows a bottom-up approach, starting with core infrastructure and storage, then building data management layers, UI components, and finally optional enhancement features. Each task builds on previous implementations, with testing integrated throughout to catch issues early.

The application is a single-page application with:
- Single HTML file for markup
- Single CSS file for responsive styling (320px-1920px)
- Single JavaScript file for all application logic
- Local Storage for client-side data persistence

---

## Tasks

### Phase 1: Project Setup & Core Infrastructure

- [x] 1. Set up project structure and HTML scaffold
  - Create index.html with minimal structure (header, main sections, footer)
  - Include semantic HTML elements (form, input, button, table)
  - Add meta tags for mobile responsiveness and charset
  - Create placeholder containers for balance, transaction form, history, and chart
  - Set up style.css and app.js file stubs
  - _Requirements: 6.1 (Mobile-Friendly Interface)_

- [x] 2. Implement StorageManager module
  - Create StorageManager with get(), set(), remove(), clear() methods
  - Implement validation for stored JSON data
  - Add error handling for storage quota exceeded
  - Implement data corruption recovery with default initialization
  - Store keys: ebv_transactions, ebv_categories, ebv_initial_balance, ebv_settings, ebv_theme
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 2.1 Write unit tests for StorageManager
  - Test successful set and get operations
  - Test JSON parsing and serialization
  - Test missing key returns null
  - Test data corruption recovery
  - Test quota exceeded error handling
  - _Requirements: 5.3, 5.4_

- [ ] 3. Implement AppState module
  - Create central state container with init() and get() methods
  - Define state structure with initialBalance, transactions, categories, settings
  - Implement addTransaction(), removeTransaction(), updateTransaction() methods
  - Implement setInitialBalance() and getBalance() calculation
  - Implement setState() for persistence recovery
  - Add subscribe() method for reactive updates
  - _Requirements: 1.1, 2.2, 3.1, 5.1, 5.2_

- [ ]* 3.1 Write property test for balance calculation
  - **Property 1: Balance Invariant** - balance always equals initialBalance minus sum of all transactions
  - **Validates: Requirements 1.1, 1.4_**

- [ ]* 3.2 Write unit tests for AppState
  - Test transaction addition updates internal array
  - Test getBalance() calculation with multiple transactions
  - Test state subscribers are notified on changes
  - Test setState() restores complete state
  - _Requirements: 1.1, 1.2, 2.2, 5.2_

### Phase 2: Data Management & Validation

- [ ] 4. Implement TransactionManager module with validation
  - Create validate() method checking amount, date, category, description fields
  - Implement amount validation: positive, numeric, max 999,999.99
  - Implement date validation: YYYY-MM-DD format, not in future
  - Implement category validation: must exist in categories list
  - Implement description validation: optional, max 200 characters
  - Add calculateBalance() helper
  - Add getFiltered(), getSorted() methods for transaction queries
  - _Requirements: 2.1, 2.3, 2.4_

- [ ]* 4.1 Write property tests for TransactionManager validation
  - **Property 2: Validation Consistency** - if validation passes, transaction is storable and retrievable
  - **Validates: Requirements 2.3, 2.4_**

- [ ]* 4.2 Write unit tests for TransactionManager
  - Test valid transaction acceptance
  - Test invalid amount rejection (negative, non-numeric, too large)
  - Test invalid date rejection (future dates, bad format)
  - Test missing required field rejection
  - Test description truncation and optional handling
  - _Requirements: 2.1, 2.3, 2.4_

- [ ] 5. Implement CategoryManager module
  - Create getAll() method returning all categories
  - Create getDefault() method with predefined categories (Food, Transport, Entertainment, Utilities, Healthcare, Shopping, Other)
  - Assign hex colors to each default category
  - Implement add() method for custom categories with uniqueness validation
  - Implement remove() method preventing deletion of default categories
  - Implement exists() and getColor() helper methods
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ]* 5.1 Write unit tests for CategoryManager
  - Test default categories are returned with correct colors
  - Test custom category addition and retrieval
  - Test duplicate category name rejection
  - Test default category deletion prevention
  - Test exists() validation for transaction form
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 6. Implement FilterManager module
  - Create setCategory() and clearCategory() methods for filtering
  - Create setSortBy() and setSortOrder() methods for sorting (by date, amount, category)
  - Implement getFiltered() method returning sorted/filtered transactions
  - Support sort orders: ascending and descending
  - Implement reset() to clear all filters
  - _Requirements: 9.1, 9.2, 9.3_

- [ ]* 6.1 Write unit tests for FilterManager
  - Test category filter includes only matching transactions
  - Test sorting by date (newest first for descending)
  - Test sorting by amount and category
  - Test sort order toggle
  - Test filter combination (category + sort)
  - _Requirements: 9.2, 9.3_

### Phase 3: Storage & Persistence

- [ ] 7. Wire AppState to StorageManager with auto-persistence
  - Subscribe AppState to save all changes to Local Storage immediately
  - Implement persist() method called on every state mutation
  - Load initial state from Local Storage on app init
  - Handle migration if needed (version checking)
  - Test data survives browser reload
  - _Requirements: 5.1, 5.2, 1.2, 2.2_

- [ ]* 7.1 Write integration tests for persistence workflow
  - Add transaction → close browser → reopen app → verify transaction persists
  - Add multiple transactions → verify all persist
  - Modify initial balance → verify persists
  - _Requirements: 5.1, 5.2_

- [ ] 8. Implement data recovery and initialization
  - Create initializeDefaults() to set up fresh state with 5000 default initial balance
  - Implement recoverFromCorruption() to handle invalid Local Storage data
  - Add warning message display when data is recovered
  - Validate all storage keys on app boot
  - _Requirements: 5.3, 5.4, 1.1_

### Phase 4: User Interface - Core Components

- [ ] 9. Implement UIManager module scaffold
  - Create render() method as main entry point
  - Implement updateBalance() to display current balance with currency symbol and 2 decimals
  - Implement showError() and clearError() for error notifications
  - Implement setTheme() to apply theme classes to DOM
  - Set up event delegation for form and button clicks
  - _Requirements: 1.1, 1.3, 6.2_

- [ ] 10. Implement balance display component
  - Create balance display section showing: "Balance: $X,XXX.XX"
  - Format amount with comma thousands separator
  - Format amount with exactly 2 decimal places
  - Update in real-time when transactions change
  - Display initial balance input on first load
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 10.1 Write unit tests for balance display
  - Test balance displays with correct currency symbol
  - Test balance displays with 2 decimal places
  - Test balance updates when transaction added
  - Test balance updates when transaction removed
  - Test initial balance can be set via input
  - _Requirements: 1.1, 1.3, 1.4_

- [ ] 11. Implement transaction form component
  - Create form with input fields: amount, category, date, description
  - Set amount input type to number with positive step
  - Set date input type to date with default to today
  - Populate category select with all categories from CategoryManager
  - Make description optional
  - Implement form submission handler
  - Clear form after successful submission
  - _Requirements: 2.1, 2.2, 2.3, 7.4_

- [ ]* 11.1 Write unit tests for transaction form
  - Test form displays all required input fields
  - Test form submission with valid data adds transaction
  - Test form displays validation errors for invalid data
  - Test form clears after successful submission
  - Test category dropdown shows all categories
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 12. Implement transaction history component
  - Create table showing all transactions with columns: date, category, amount, description, action
  - Display transactions in reverse chronological order (newest first)
  - Show delete button for each transaction
  - Implement delete handler that removes transaction and updates display
  - Add empty state message when no transactions exist
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 12.1 Write unit tests for transaction history
  - Test table displays all transactions
  - Test transactions sorted newest first
  - Test delete button removes transaction
  - Test empty state message displays when no transactions
  - Test balance updates after delete
  - _Requirements: 3.3, 3.5_

### Phase 5: Visualization & Analytics

- [ ] 13. Implement ChartRenderer module
  - Create renderChart() method accepting container and data
  - Implement calculateData() to aggregate spending by category
  - Create color mapping for categories (use category colors)
  - Implement drawBars() to render horizontal bar chart on canvas
  - Include category labels on x-axis and spending amounts
  - Add empty state handling when no transactions exist
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 13.1 Write unit tests for ChartRenderer
  - Test chart renders with valid data
  - Test chart displays all categories with correct spending
  - Test empty state message for no transactions
  - Test colors distinguish categories visually
  - Test chart updates after transaction addition
  - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [ ] 14. Wire chart updates to AppState changes
  - Subscribe chart updates to AppState changes
  - Debounce chart re-renders with 300ms delay to prevent jank
  - Update chart immediately on category filter changes
  - Show/hide empty state based on transaction count
  - _Requirements: 4.2, 4.3_

### Phase 6: Management Features

- [ ] 15. Implement sort and filter UI controls
  - Create dropdown for sort field (date, amount, category)
  - Create dropdown for sort order (ascending, descending)
  - Create dropdown for category filter (all categories, none)
  - Wire dropdowns to FilterManager methods
  - Update transaction list on filter/sort change
  - Update chart on filter change (reflect only filtered transactions)
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ]* 15.1 Write integration tests for sort and filter
  - Add multiple transactions different categories → filter by category → list updates
  - Filter transactions → chart updates to show only filtered categories
  - Sort by amount descending → largest expense appears first
  - Sort by date ascending → oldest transactions first
  - _Requirements: 9.2, 9.3, 9.4_

- [ ] 16. Implement custom category management
  - Create modal/form for adding custom categories
  - Implement category name input with uniqueness validation
  - Allow color picker for custom category (optional, default to gray)
  - Add custom category to CategoryManager
  - Save custom category to Local Storage
  - Make custom category immediately available in transaction form
  - _Requirements: 7.2, 7.3, 7.4_

- [ ]* 16.1 Write unit tests for custom categories
  - Test custom category creation with unique name
  - Test duplicate category name rejection
  - Test custom category appears in form dropdown
  - Test custom category used in transaction
  - Test custom category persists in Local Storage
  - _Requirements: 7.2, 7.3, 7.4_

- [ ] 17. Implement monthly summary view
  - Create monthly summary section showing total spending per month
  - Group transactions by month (YYYY-MM format)
  - Display month selector (previous/next month navigation)
  - Show category breakdown for selected month
  - Recalculate on transaction add/remove
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ]* 17.1 Write unit tests for monthly summary
  - Test monthly totals calculated correctly
  - Test category breakdown for month
  - Test month navigation updates display
  - Test new transaction updates current month total
  - _Requirements: 8.2, 8.3, 8.4_

### Phase 7: Budget Alerts & Notifications

- [ ] 18. Implement budget configuration interface
  - Create settings modal/panel for budget configuration
  - Add input for total spending budget (optional)
  - Add inputs for per-category spending limits (optional)
  - Save budget settings to AppState
  - Persist settings to Local Storage
  - _Requirements: 10.1_

- [ ]* 18.1 Write unit tests for budget configuration
  - Test budget values saved to Local Storage
  - Test total budget can be set and updated
  - Test per-category budgets can be set
  - Test budget settings persist across sessions
  - _Requirements: 10.1_

- [ ] 19. Implement budget alert detection
  - Create checkBudgetAlerts() method comparing current spending to limits
  - Trigger warning when spending > 80% of limit
  - Trigger critical alert when spending > 100% of limit (over budget)
  - Return alert objects with type (total/category), severity, percentage
  - _Requirements: 10.2, 10.3_

- [ ]* 19.1 Write property test for budget alert logic
  - **Property 3: Budget Alert Accuracy** - alerts triggered when and only when spending exceeds threshold
  - **Validates: Requirements 10.2, 10.3_**

- [ ]* 19.2 Write unit tests for budget alert detection
  - Test no alert when spending below 80% limit
  - Test warning alert at 80% of limit
  - Test critical alert when spending exceeds limit
  - Test both total and category budgets checked
  - _Requirements: 10.2, 10.3_

- [ ] 20. Implement visual alert indicators
  - Highlight categories in chart with red background when over budget
  - Highlight categories in transaction list with red text when over budget
  - Show badge/badge on dashboard when any budget is exceeded
  - Add visual indicator (color change) on affected category
  - _Requirements: 10.2, 10.3, 10.4_

- [ ]* 20.1 Write integration tests for budget alerts
  - Set total budget to $500 → add transactions → verify alert displays when > $500
  - Set category budget to $100 → add transaction for $120 → verify category highlighted
  - Clear budget limit → verify highlighting removed
  - _Requirements: 10.2, 10.3, 10.4_

### Phase 8: Theming & Styling

- [ ] 21. Implement responsive CSS layout
  - Create mobile-first CSS starting at 320px viewport
  - Implement two-column layout for desktop (650px+)
  - Stack elements vertically on mobile (balance, form, history, chart)
  - Add media queries for tablet (480px) and desktop (1024px) breakpoints
  - Ensure 44x44px minimum touch targets for buttons and interactive elements
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 22. Implement responsive form and controls
  - Form inputs: full width on mobile, constrained width on desktop
  - Buttons: full width on mobile, auto width on desktop
  - Select dropdowns: easy to tap on mobile
  - Handle landscape orientation on mobile (reflow layout)
  - Test on various device sizes (iPhone 12, iPad, desktop)
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 23. Implement light theme CSS
  - Define CSS variables for light mode: --bg-primary, --bg-secondary, --text-primary, --text-secondary, --border-color, --accent-color
  - Set background colors for light theme
  - Set text colors with 4.5:1 contrast ratio (WCAG AA)
  - Style form inputs, buttons, tables for light theme
  - Style chart colors for light background
  - _Requirements: 11.4, 12.3_

- [ ] 24. Implement dark theme CSS
  - Define dark mode CSS variables
  - Set background colors for dark theme (dark grays)
  - Set text colors with sufficient contrast (4.5:1 WCAG AA)
  - Invert chart colors for dark background
  - Ensure readability in dark mode
  - _Requirements: 11.1, 11.3, 12.3_

- [ ] 25. Implement ThemeManager module
  - Create init() method loading saved theme from Local Storage
  - Implement set() method applying theme to document.documentElement
  - Implement toggle() method switching between light and dark
  - Implement get() method returning current theme
  - Save theme preference to Local Storage
  - Add theme toggle button to UI
  - _Requirements: 11.1, 11.2, 11.4_

- [ ]* 25.1 Write unit tests for ThemeManager
  - Test theme loads from Local Storage
  - Test theme toggle switches themes
  - Test theme preference persists across reload
  - Test dark mode has sufficient contrast
  - _Requirements: 11.1, 11.2, 11.3_

### Phase 9: Polish & Integration

- [ ] 26. Implement consistent visual design
  - Use consistent font sizes and weights across UI
  - Maintain consistent color palette
  - Add subtle shadows/borders to differentiate sections
  - Style error messages consistently (red background, white text)
  - Style success messages (optional, green background)
  - Add smooth transitions on theme change (300ms fade)
  - _Requirements: 12.1, 12.3_

- [ ] 27. Improve form validation and error display
  - Show inline error messages below invalid fields
  - Clear error messages when field is corrected
  - Highlight invalid fields with red border
  - Prevent form submission with invalid data
  - Show specific error messages (e.g., "Amount must be positive")
  - _Requirements: 2.3, 2.4_

- [ ] 28. Enhance accessibility
  - Add aria-label to form inputs and buttons
  - Ensure keyboard navigation works (Tab through form, Enter to submit)
  - Add focus indicators visible on all interactive elements
  - Use semantic HTML (form, input, button, table, section, header, footer)
  - Test with screen reader (optional, for verification)
  - _Requirements: 6.2, 12.1_

- [ ] 29. Performance optimization and cleanup
  - Minify CSS and JavaScript files
  - Remove console.log statements and debug code
  - Verify total file size: index.html < 5KB, style.css < 30KB, app.js < 50KB
  - Test load time on 3G network simulation (target < 3 seconds)
  - Verify no memory leaks with browser DevTools
  - _Requirements: 12.2_

- [ ] 30. Comprehensive integration testing
  - Test full user workflow: set balance → add transaction → view in list → see in chart → delete → balance updates
  - Test persistence workflow: add data → close browser → reopen → data restored
  - Test theme persistence: toggle theme → close/reopen → theme preserved
  - Test filter/sort workflow: add transactions → apply filter → chart updates
  - Test budget alert workflow: set limit → add transactions → alert displays
  - _Requirements: 1.1, 2.2, 3.1, 4.3, 5.2, 11.2_

### Phase 10: Checkpoint & Final Verification

- [ ] 31. Final checkpoint - Ensure all core features pass
  - All unit tests pass
  - All property tests pass
  - All integration tests pass
  - No console errors or warnings
  - Application loads within 3 seconds
  - Ensure all tests pass, ask the user if questions arise.

### Phase 11: Optional Enhancement Features

- [ ]* 32. Implement transaction editing (Optional Enhancement)
  - Add edit button to each transaction in history
  - Allow modification of amount, category, date, description
  - Validate updated transaction same as new transaction
  - Update AppState and persist changes
  - Update chart and balance on edit
  - _Requirements: 2.5 (implicit)_

- [ ]* 32.1 Write unit tests for transaction editing
  - Test transaction fields can be modified
  - Test validation applies to edited transaction
  - Test balance updates correctly after edit
  - Test edited transaction persists
  - _Requirements: 2.5_

- [ ] 33. Implement data export (Optional Enhancement)
  - Create export button to download transactions as CSV
  - CSV format: date, category, amount, description
  - Include header row
  - Use filename: expenses-YYYY-MM-DD.csv
  - _Requirements: None (enhancement)_

- [ ]* 34. Implement transaction search (Optional Enhancement)
  - Add search input to transaction history
  - Search by description text (partial match)
  - Search by category name
  - Show only matching transactions
  - Update chart to reflect search results
  - _Requirements: 9.1 (search as filter variant)_

- [ ]* 34.1 Write unit tests for transaction search
  - Test searching by description keyword
  - Test searching by category
  - Test search highlights matching transactions
  - Test chart updates with search results
  - _Requirements: 9.1_

- [ ]* 35. Implement recurring transactions (Optional Enhancement)
  - Add checkbox for "recurring" transaction option
  - Allow setting repeat interval (weekly, monthly, quarterly)
  - Auto-create transactions on schedule (on app load if due)
  - Mark recurring transactions visually in list
  - _Requirements: None (enhancement)_

---

## Notes

- All tasks must include actual code written and saved to repository files (app.js, style.css, index.html)
- Property tests are marked with `*` and are optional for MVP completion but recommended for correctness validation
- Unit tests and integration tests are sub-tasks marked with `*` under implementation tasks
- Core implementation tasks (without `*`) must be completed in order for application to function
- Optional enhancement tasks (Phase 11) can be skipped for faster MVP
- Checkpoint tasks validate progress and should be run at their specified points
- All code must follow vanilla JavaScript patterns (no frameworks, no build tools)
- CSS must be single file, responsive, with CSS variables for theming
- HTML must be semantic and accessible
- All data changes must persist immediately to Local Storage

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2", "3"] },
    { "id": 1, "tasks": ["2.1", "3.1", "3.2", "4"] },
    { "id": 2, "tasks": ["4.1", "4.2", "5", "6"] },
    { "id": 3, "tasks": ["5.1", "6.1", "7"] },
    { "id": 4, "tasks": ["7.1", "8"] },
    { "id": 5, "tasks": ["9", "10", "11", "12"] },
    { "id": 6, "tasks": ["10.1", "11.1", "12.1"] },
    { "id": 7, "tasks": ["13", "14"] },
    { "id": 8, "tasks": ["13.1", "15"] },
    { "id": 9, "tasks": ["15.1", "16", "17"] },
    { "id": 10, "tasks": ["16.1", "17.1", "18"] },
    { "id": 11, "tasks": ["18.1", "19", "20"] },
    { "id": 12, "tasks": ["19.1", "19.2", "20.1"] },
    { "id": 13, "tasks": ["21", "22", "23", "24", "25"] },
    { "id": 14, "tasks": ["25.1", "26", "27", "28"] },
    { "id": 15, "tasks": ["29", "30"] }
  ]
}
```

---

## Summary

The task breakdown converts the design specifications into 35 discrete, implementable tasks organized across 11 phases. The dependency graph ensures tasks are scheduled for parallel execution where possible while respecting data and file-level dependencies.

**Key Implementation Phases:**
- **Phase 1:** Project setup and core infrastructure (storage, state management)
- **Phase 2:** Data management and validation modules
- **Phase 3:** Storage persistence and recovery
- **Phase 4:** Core UI components (balance, form, transaction history)
- **Phase 5:** Visualization (charts)
- **Phase 6:** Management features (sorting, filtering, categories, monthly summaries)
- **Phase 7:** Budget alerts and notifications
- **Phase 8:** Theming and responsive styling
- **Phase 9:** Polish, accessibility, and optimization
- **Phase 10:** Final checkpoint and verification
- **Phase 11:** Optional enhancements (editing, export, search, recurring)

**Property-Based Testing Integration:**
- Property 1: Balance Invariant (task 3.1)
- Property 2: Validation Consistency (task 4.1)
- Property 3: Budget Alert Accuracy (task 19.1)

**Optional Tasks:** Marked with `*`, these are test-related sub-tasks and optional enhancements that can be skipped for faster MVP delivery.

The implementation can be executed in parallel waves as defined in the dependency graph, enabling efficient development velocity while maintaining code quality through integrated testing.
