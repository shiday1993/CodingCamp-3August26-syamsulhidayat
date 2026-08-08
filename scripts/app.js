/**
 * Expense & Budget Visualizer
 * Main Application Module
 * 
 * This file contains all application logic for the single-page expense tracking application.
 * It includes modules for storage management, state management, UI rendering, and business logic.
 */

/* ============================================
   StorageManager Module
   Handles all Local Storage read/write operations
   ============================================ */
const StorageManager = {
    PREFIX: 'ebv_',
    
    /**
     * Get value from Local Storage by key
     * @param {string} key - Storage key (without prefix)
     * @returns {any|null} - Parsed value or null if not found
     */
    get(key) {
        try {
            const fullKey = this.PREFIX + key;
            const value = localStorage.getItem(fullKey);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`Error reading from storage (${key}):`, error);
            return null;
        }
    },
    
    /**
     * Set value in Local Storage
     * @param {string} key - Storage key (without prefix)
     * @param {any} data - Data to store (will be JSON stringified)
     * @returns {boolean} - Success/failure
     */
    set(key, data) {
        try {
            const fullKey = this.PREFIX + key;
            localStorage.setItem(fullKey, JSON.stringify(data));
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('Storage quota exceeded');
            } else {
                console.error(`Error writing to storage (${key}):`, error);
            }
            return false;
        }
    },
    
    /**
     * Remove item from Local Storage
     * @param {string} key - Storage key (without prefix)
     */
    remove(key) {
        try {
            const fullKey = this.PREFIX + key;
            localStorage.removeItem(fullKey);
        } catch (error) {
            console.error(`Error removing from storage (${key}):`, error);
        }
    },
    
    /**
     * Clear all application data from Local Storage
     */
    clear() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.PREFIX)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    },
    
    /**
     * Validate stored data integrity
     * @param {any} data - Data to validate
     * @returns {boolean} - Valid or not
     */
    validate(data) {
        // Placeholder for validation logic
        return data !== null && data !== undefined;
    }
};


/* ============================================
   CategoryManager Module
   Manages category definitions and operations
   ============================================ */
const CategoryManager = {
    defaultCategories: [
        { id: 'food', name: 'Food', color: '#FF9500', isCustom: false },
        { id: 'transport', name: 'Transport', color: '#007AFF', isCustom: false },
        { id: 'entertainment', name: 'Entertainment', color: '#9C27B0', isCustom: false },
        { id: 'utilities', name: 'Utilities', color: '#F44336', isCustom: false },
        { id: 'healthcare', name: 'Healthcare', color: '#4CAF50', isCustom: false },
        { id: 'shopping', name: 'Shopping', color: '#E91E63', isCustom: false },
        { id: 'other', name: 'Other', color: '#757575', isCustom: false }
    ],
    
    /**
     * Get all categories (default + custom)
     * @returns {Array} - All categories
     */
    getAll() {
        const stored = StorageManager.get('categories');
        if (stored && Array.isArray(stored)) {
            return stored;
        }
        return this.getDefault();
    },
    
    /**
     * Get default categories
     * @returns {Array} - Default categories
     */
    getDefault() {
        return this.defaultCategories;
    },
    
    /**
     * Add custom category
     * @param {string} name - Category name
     * @param {string} color - Hex color code
     * @returns {Object} - Result {success: boolean, error?: string}
     */
    add(name, color = '#757575') {
        if (!name || typeof name !== 'string') {
            return { success: false, error: 'Invalid category name' };
        }
        
        const categories = this.getAll();
        if (this.exists(name, categories)) {
            return { success: false, error: 'Category already exists' };
        }
        
        const newCategory = {
            id: 'custom_' + Date.now(),
            name: name,
            color: color,
            isCustom: true
        };
        
        categories.push(newCategory);
        StorageManager.set('categories', categories);
        return { success: true };
    },
    
    /**
     * Remove custom category
     * @param {string} id - Category ID
     * @returns {Object} - Result {success: boolean, error?: string}
     */
    remove(id) {
        const categories = this.getAll();
        const category = categories.find(c => c.id === id);
        
        if (!category) {
            return { success: false, error: 'Category not found' };
        }
        
        if (!category.isCustom) {
            return { success: false, error: 'Cannot delete default categories' };
        }
        
        const filtered = categories.filter(c => c.id !== id);
        StorageManager.set('categories', filtered);
        return { success: true };
    },
    
    /**
     * Check if category exists
     * @param {string} name - Category name
     * @param {Array} categories - Categories to search in
     * @returns {boolean}
     */
    exists(name, categories = null) {
        const cats = categories || this.getAll();
        return cats.some(c => c.name.toLowerCase() === name.toLowerCase());
    },
    
    /**
     * Get category color
     * @param {string} id - Category ID or name
     * @returns {string} - Hex color code
     */
    getColor(id) {
        const categories = this.getAll();
        const category = categories.find(c => c.id === id || c.name === id);
        return category ? category.color : '#757575';
    }
};


/* ============================================
   AppState Module
   Central state container for application
   ============================================ */
const AppState = {
    state: {
        initialBalance: 5000,
        transactions: [],
        categories: [],
        settings: {
            sortBy: 'date',
            sortOrder: 'desc',
            filterCategory: null
        }
    },
    
    subscribers: [],
    
    /**
     * Initialize or restore state from storage
     */
    init() {
        const stored = StorageManager.get('appState');
        if (stored && stored.transactions) {
            this.state = stored;
        } else {
            // Initialize with defaults
            this.state.categories = CategoryManager.getDefault();
            StorageManager.set('appState', this.state);
        }
    },
    
    /**
     * Get current state
     * @returns {Object} - Current application state
     */
    get() {
        return this.state;
    },
    
    /**
     * Set entire state (for persistence recovery)
     * @param {Object} newState - New state object
     */
    setState(newState) {
        this.state = newState;
        this.persist();
        this.notifySubscribers();
    },
    
    /**
     * Add transaction to state
     * @param {Object} transaction - Transaction object
     */
    addTransaction(transaction) {
        if (!transaction.id) {
            transaction.id = 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        if (!transaction.timestamp) {
            transaction.timestamp = Date.now();
        }
        
        this.state.transactions.push(transaction);
        this.persist();
        this.notifySubscribers();
    },
    
    /**
     * Remove transaction from state
     * @param {string} id - Transaction ID
     */
    removeTransaction(id) {
        this.state.transactions = this.state.transactions.filter(t => t.id !== id);
        this.persist();
        this.notifySubscribers();
    },
    
    /**
     * Update transaction
     * @param {string} id - Transaction ID
     * @param {Object} updates - Fields to update
     */
    updateTransaction(id, updates) {
        const transaction = this.state.transactions.find(t => t.id === id);
        if (transaction) {
            Object.assign(transaction, updates);
            this.persist();
            this.notifySubscribers();
        }
    },
    
    /**
     * Set initial balance
     * @param {number} amount - Balance amount
     */
    setInitialBalance(amount) {
        this.state.initialBalance = amount;
        this.persist();
        this.notifySubscribers();
    },
    
    /**
     * Get initial balance
     * @returns {number}
     */
    getInitialBalance() {
        return this.state.initialBalance;
    },
    
    /**
     * Calculate current balance
     * @returns {number} - initialBalance - sum(transactions)
     */
    getBalance() {
        const spent = this.state.transactions.reduce((sum, txn) => sum + (txn.amount || 0), 0);
        return this.state.initialBalance - spent;
    },
    
    /**
     * Get all transactions
     * @returns {Array}
     */
    getTransactions() {
        return this.state.transactions;
    },
    
    /**
     * Subscribe to state changes
     * @param {Function} callback - Callback function
     */
    subscribe(callback) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    },
    
    /**
     * Notify all subscribers of state change
     */
    notifySubscribers() {
        this.subscribers.forEach(callback => callback(this.state));
    },
    
    /**
     * Persist state to storage
     */
    persist() {
        StorageManager.set('appState', this.state);
    }
};


/* ============================================
   TransactionManager Module
   Business logic for transaction validation
   ============================================ */
const TransactionManager = {
    /**
     * Validate transaction data
     * @param {Object} txnData - Transaction data to validate
     * @returns {Object} - {valid: boolean, errors: []}
     */
    validate(txnData) {
        const errors = [];
        
        // Validate amount
        if (txnData.amount === undefined || txnData.amount === '') {
            errors.push('Amount is required');
        } else if (typeof txnData.amount !== 'number' || isNaN(txnData.amount)) {
            errors.push('Amount must be a number');
        } else if (txnData.amount <= 0) {
            errors.push('Amount must be positive');
        } else if (txnData.amount > 999999.99) {
            errors.push('Amount exceeds maximum (999,999.99)');
        }
        
        // Validate date
        if (txnData.date === undefined || txnData.date === '') {
            errors.push('Date is required');
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(txnData.date)) {
            errors.push('Date must be in YYYY-MM-DD format');
        } else {
            const txnDate = new Date(txnData.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (txnDate > today) {
                errors.push('Date cannot be in the future');
            }
        }
        
        // Validate category
        if (txnData.category === undefined || txnData.category === '') {
            errors.push('Category is required');
        } else {
            const categories = CategoryManager.getAll();
            if (!categories.find(c => c.name === txnData.category || c.id === txnData.category)) {
                errors.push('Invalid category');
            }
        }
        
        // Validate description (optional)
        if (txnData.description && txnData.description.length > 200) {
            errors.push('Description exceeds 200 characters');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },
    
    /**
     * Calculate balance from transactions
     * @returns {number}
     */
    calculateBalance() {
        return AppState.getBalance();
    },
    
    /**
     * Get filtered transactions
     * @param {Object} filter - Filter criteria {category, dateRange}
     * @returns {Array} - Filtered transactions
     */
    getFiltered(filter = {}) {
        let transactions = AppState.getTransactions();
        
        if (filter.category) {
            transactions = transactions.filter(t => t.category === filter.category);
        }
        
        return transactions;
    },
    
    /**
     * Get sorted transactions
     * @param {Array} transactions - Transactions to sort
     * @param {string} sortBy - Sort field (date, amount, category)
     * @param {string} order - Sort order (asc, desc)
     * @returns {Array} - Sorted transactions
     */
    getSorted(transactions, sortBy = 'date', order = 'desc') {
        const sorted = [...transactions];
        
        sorted.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];
            
            if (sortBy === 'date') {
                aVal = new Date(a.date).getTime();
                bVal = new Date(b.date).getTime();
            }
            
            if (typeof aVal === 'string') {
                const result = aVal.localeCompare(bVal);
                return order === 'asc' ? result : -result;
            }
            
            return order === 'asc' ? aVal - bVal : bVal - aVal;
        });
        
        return sorted;
    },
    
    /**
     * Get transactions by category
     * @param {string} category - Category name
     * @returns {Array}
     */
    getByCategory(category) {
        return AppState.getTransactions().filter(t => t.category === category);
    }
};


/* ============================================
   FilterManager Module
   Manages transaction filtering and sorting
   ============================================ */
const FilterManager = {
    filters: {
        category: null,
        sortBy: 'date',
        sortOrder: 'desc'
    },
    
    /**
     * Set category filter
     * @param {string} categoryId
     */
    setCategory(categoryId) {
        this.filters.category = categoryId || null;
    },
    
    /**
     * Clear category filter
     */
    clearCategory() {
        this.filters.category = null;
    },
    
    /**
     * Set sort field
     * @param {string} field - date, amount, category
     */
    setSortBy(field) {
        this.filters.sortBy = field;
    },
    
    /**
     * Set sort order
     * @param {string} order - asc or desc
     */
    setSortOrder(order) {
        this.filters.sortOrder = order;
    },
    
    /**
     * Get filtered and sorted transactions
     * @returns {Array}
     */
    getFiltered() {
        let transactions = TransactionManager.getFiltered({ 
            category: this.filters.category 
        });
        
        transactions = TransactionManager.getSorted(
            transactions, 
            this.filters.sortBy, 
            this.filters.sortOrder
        );
        
        return transactions;
    },
    
    /**
     * Reset all filters
     */
    reset() {
        this.filters = {
            category: null,
            sortBy: 'date',
            sortOrder: 'desc'
        };
    }
};


/* ============================================
   MonthlyManager Module
   Manages monthly summary calculations
   ============================================ */
const MonthlyManager = {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    
    /**
     * Get transactions for a specific month
     * @param {number} year - Year (YYYY)
     * @param {number} month - Month (1-12)
     * @returns {Array} - Transactions in that month
     */
    getMonthTransactions(year, month) {
        const transactions = AppState.getTransactions();
        const monthStr = String(month).padStart(2, '0');
        const monthPrefix = `${year}-${monthStr}`;
        
        return transactions.filter(txn => txn.date.startsWith(monthPrefix));
    },
    
    /**
     * Calculate total spending for a specific month
     * @param {number} year
     * @param {number} month
     * @returns {number}
     */
    getMonthlySpending(year, month) {
        const transactions = this.getMonthTransactions(year, month);
        return transactions.reduce((total, txn) => total + (txn.amount || 0), 0);
    },
    
    /**
     * Get category breakdown for a specific month
     * @param {number} year
     * @param {number} month
     * @returns {Array} - {category, amount, percentage}
     */
    getMonthlyBreakdown(year, month) {
        const transactions = this.getMonthTransactions(year, month);
        const monthTotal = this.getMonthlySpending(year, month);
        
        // Group by category
        const categoryTotals = {};
        transactions.forEach(txn => {
            if (!categoryTotals[txn.category]) {
                categoryTotals[txn.category] = 0;
            }
            categoryTotals[txn.category] += txn.amount || 0;
        });
        
        // Convert to array with percentages
        return Object.entries(categoryTotals)
            .map(([category, amount]) => ({
                category,
                amount,
                percentage: monthTotal > 0 ? ((amount / monthTotal) * 100).toFixed(1) : 0
            }))
            .sort((a, b) => b.amount - a.amount);
    },
    
    /**
     * Get all months with spending data
     * @returns {Array} - {year, month, total}
     */
    getMonthlySummary() {
        const months = {};
        const transactions = AppState.getTransactions();
        
        transactions.forEach(txn => {
            const [year, month] = txn.date.split('-');
            const key = `${year}-${month}`;
            
            if (!months[key]) {
                months[key] = {
                    year: parseInt(year),
                    month: parseInt(month),
                    total: 0
                };
            }
            months[key].total += txn.amount || 0;
        });
        
        return Object.values(months).sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        });
    },
    
    /**
     * Format month display string
     * @param {number} year
     * @param {number} month
     * @returns {string}
     */
    formatMonth(year, month) {
        const date = new Date(year, month - 1, 1);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    },
    
    /**
     * Navigate to previous month
     */
    previousMonth() {
        if (this.currentMonth === 1) {
            this.currentMonth = 12;
            this.currentYear--;
        } else {
            this.currentMonth--;
        }
    },
    
    /**
     * Navigate to next month
     */
    nextMonth() {
        const now = new Date();
        const maxYear = now.getFullYear();
        const maxMonth = now.getMonth() + 1;
        
        // Don't allow navigation beyond current month
        if (this.currentYear === maxYear && this.currentMonth === maxMonth) {
            return;
        }
        
        if (this.currentMonth === 12) {
            this.currentMonth = 1;
            this.currentYear++;
        } else {
            this.currentMonth++;
        }
    },
    
    /**
     * Get current month year
     * @returns {Object} - {year, month}
     */
    getCurrentMonth() {
        return {
            year: this.currentYear,
            month: this.currentMonth
        };
    }
};


/* ============================================
   ThemeManager Module
   Manages dark/light mode switching
   ============================================ */
const ThemeManager = {
    currentTheme: 'light',
    
    /**
     * Initialize theme from storage or system preference
     */
    init() {
        const stored = StorageManager.get('theme');
        if (stored) {
            this.currentTheme = stored;
        } else {
            // Check system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this.currentTheme = 'dark';
            }
        }
        this.apply();
    },
    
    /**
     * Set theme
     * @param {string} theme - 'light' or 'dark'
     */
    set(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.currentTheme = theme;
            StorageManager.set('theme', theme);
            this.apply();
        }
    },
    
    /**
     * Toggle between themes
     */
    toggle() {
        this.set(this.currentTheme === 'light' ? 'dark' : 'light');
    },
    
    /**
     * Get current theme
     * @returns {string}
     */
    get() {
        return this.currentTheme;
    },
    
    /**
     * Apply theme to document
     */
    apply() {
        const root = document.documentElement;
        if (this.currentTheme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
};


/* ============================================
   UIManager Module (Scaffold)
   Handles DOM rendering and event delegation
   ============================================ */
const UIManager = {
    /**
     * Render entire UI
     */
    render() {
        this.renderBalanceDisplay();
        this.renderCategoryDropdowns();
        this.renderTransactionList();
        this.renderChart();
        this.renderMonthlySummary();
    },
    
    /**
     * Update balance display
     */
    renderBalanceDisplay() {
        const balance = AppState.getBalance();
        const balanceAmount = document.getElementById('balanceAmount');
        if (balanceAmount) {
            balanceAmount.textContent = Math.max(balance, 0).toFixed(2);
        }
    },
    
    /**
     * Render category dropdowns
     */
    renderCategoryDropdowns() {
        const categories = CategoryManager.getAll();
        const categorySelect = document.getElementById('category');
        const categoryFilter = document.getElementById('categoryFilter');
        
        if (categorySelect) {
            const currentValue = categorySelect.value;
            categorySelect.innerHTML = '<option value="">Select a category</option>';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.name;
                option.textContent = cat.name;
                categorySelect.appendChild(option);
            });
            categorySelect.value = currentValue;
        }
        
        if (categoryFilter) {
            const currentValue = categoryFilter.value;
            categoryFilter.innerHTML = '<option value="">All Categories</option>';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.name;
                option.textContent = cat.name;
                categoryFilter.appendChild(option);
            });
            categoryFilter.value = currentValue;
        }
    },
    
    /**
     * Update transaction list
     */
    renderTransactionList() {
        const transactions = FilterManager.getFiltered();
        const tableBody = document.getElementById('transactionTableBody');
        const emptyState = document.getElementById('emptyState');
        const table = document.getElementById('transactionTable');
        
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (transactions.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            if (table) table.style.display = 'none';
        } else {
            if (emptyState) emptyState.style.display = 'none';
            if (table) table.style.display = 'table';
            
            transactions.forEach(txn => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${txn.date}</td>
                    <td>${txn.category}</td>
                    <td class="transaction__amount">$${txn.amount.toFixed(2)}</td>
                    <td>${txn.description || '-'}</td>
                    <td>
                        <button class="transaction__delete-btn" data-id="${txn.id}" aria-label="Delete transaction">
                            Delete
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
    },
    
    /**
     * Update chart (placeholder)
     */
    renderChart() {
        const transactions = FilterManager.getFiltered();
        const canvas = document.getElementById('spendingChart');
        const emptyState = document.getElementById('chartEmptyState');
        
        if (!canvas) return;
        
        if (transactions.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            canvas.style.display = 'none';
        } else {
            if (emptyState) emptyState.style.display = 'none';
            canvas.style.display = 'block';
            // Chart rendering will be implemented in ChartRenderer
        }
    },
    
    /**
     * Render monthly summary
     */
    renderMonthlySummary() {
        const { year, month } = MonthlyManager.getCurrentMonth();
        const monthlyTotal = MonthlyManager.getMonthlySpending(year, month);
        const breakdown = MonthlyManager.getMonthlyBreakdown(year, month);
        
        // Update month display
        const monthDisplay = document.getElementById('monthDisplay');
        if (monthDisplay) {
            monthDisplay.textContent = MonthlyManager.formatMonth(year, month);
        }
        
        // Update total amount
        const monthlyTotalAmount = document.getElementById('monthlyTotalAmount');
        if (monthlyTotalAmount) {
            monthlyTotalAmount.textContent = `$${monthlyTotal.toFixed(2)}`;
        }
        
        // Update breakdown list
        const breakdownList = document.getElementById('monthlyBreakdownList');
        if (breakdownList) {
            if (breakdown.length === 0) {
                breakdownList.innerHTML = '<p class="monthly-breakdown__empty-state">No transactions for this month</p>';
            } else {
                breakdownList.innerHTML = breakdown.map(item => `
                    <div class="monthly-breakdown__item">
                        <div class="monthly-breakdown__item-left">
                            <span class="monthly-breakdown__item-category">${item.category}</span>
                            <span class="monthly-breakdown__item-percentage">${item.percentage}% of monthly total</span>
                        </div>
                        <span class="monthly-breakdown__item-amount">$${item.amount.toFixed(2)}</span>
                    </div>
                `).join('');
            }
        }
    },
    
    /**
     * Show error message
     * @param {string} message
     */
    showError(message) {
        const notification = document.getElementById('notification');
        const notificationMessage = document.getElementById('notificationMessage');
        
        if (notification && notificationMessage) {
            notificationMessage.textContent = message;
            notification.classList.add('show', 'error');
            
            setTimeout(() => {
                notification.classList.remove('show', 'error');
            }, 3000);
        }
    },
    
    /**
     * Show success message
     * @param {string} message
     */
    showSuccess(message) {
        const notification = document.getElementById('notification');
        const notificationMessage = document.getElementById('notificationMessage');
        
        if (notification && notificationMessage) {
            notificationMessage.textContent = message;
            notification.classList.add('show', 'success');
            
            setTimeout(() => {
                notification.classList.remove('show', 'success');
            }, 3000);
        }
    },
    
    /**
     * Clear error message
     */
    clearError() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.classList.remove('show', 'error');
        }
    }
};


/* ============================================
   Application Initialization and Event Handlers
   ============================================ */

/**
 * Initialize application on page load
 */
function initializeApp() {
    // Initialize modules
    ThemeManager.init();
    AppState.init();
    
    // Render initial UI
    UIManager.render();
    
    // Subscribe to state changes
    AppState.subscribe(() => {
        UIManager.render();
    });
    
    // Set up event listeners
    setupEventListeners();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            ThemeManager.toggle();
            updateThemeToggleButton();
        });
    }
    
    // Initial balance form
    const setBalanceBtn = document.getElementById('setBalanceBtn');
    if (setBalanceBtn) {
        setBalanceBtn.addEventListener('click', handleSetBalance);
    }
    
    // Transaction form
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleTransactionFormSubmit);
    }
    
    // Filter and sort controls
    const categoryFilter = document.getElementById('categoryFilter');
    const sortBy = document.getElementById('sortBy');
    const sortOrder = document.getElementById('sortOrder');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            FilterManager.setCategory(e.target.value || null);
            UIManager.render();
        });
    }
    
    if (sortBy) {
        sortBy.addEventListener('change', (e) => {
            FilterManager.setSortBy(e.target.value);
            UIManager.render();
        });
    }
    
    if (sortOrder) {
        sortOrder.addEventListener('change', (e) => {
            FilterManager.setSortOrder(e.target.value);
            UIManager.render();
        });
    }
    
    // Monthly navigation
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            MonthlyManager.previousMonth();
            UIManager.renderMonthlySummary();
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            MonthlyManager.nextMonth();
            UIManager.renderMonthlySummary();
        });
    }
    
    // Event delegation for delete buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('transaction__delete-btn')) {
            const id = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this transaction?')) {
                AppState.removeTransaction(id);
                UIManager.showSuccess('Transaction deleted successfully');
            }
        }
    });
}

/**
 * Handle set balance button click
 */
function handleSetBalance() {
    const input = document.getElementById('initialBalanceInput');
    if (!input) return;
    
    const amount = parseFloat(input.value);
    
    if (!input.value || isNaN(amount) || amount < 0) {
        UIManager.showError('Please enter a valid balance amount');
        return;
    }
    
    AppState.setInitialBalance(amount);
    input.value = '';
    UIManager.showSuccess('Initial balance set successfully');
    
    // Hide balance setup after setting
    const balanceSetup = document.getElementById('balanceSetup');
    if (balanceSetup && AppState.getInitialBalance() > 0) {
        balanceSetup.style.display = 'none';
    }
}

/**
 * Handle transaction form submission
 */
function handleTransactionFormSubmit(e) {
    e.preventDefault();
    
    // Clear previous errors
    clearFormErrors();
    
    // Get form values
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value;
    
    // Set default date to today if not specified
    const defaultDate = new Date().toISOString().split('T')[0];
    const finalDate = date || defaultDate;
    
    // Validate transaction
    const validation = TransactionManager.validate({
        amount,
        category,
        date: finalDate,
        description
    });
    
    if (!validation.valid) {
        showFormErrors(validation.errors);
        return;
    }
    
    // Create transaction object
    const transaction = {
        amount,
        category,
        date: finalDate,
        description
    };
    
    // Add transaction
    AppState.addTransaction(transaction);
    
    // Clear form
    document.getElementById('transactionForm').reset();
    
    // Set default date for next entry
    document.getElementById('date').valueAsDate = new Date();
    
    UIManager.showSuccess('Transaction added successfully');
}

/**
 * Show form validation errors
 */
function showFormErrors(errors) {
    const formError = document.getElementById('formError');
    if (formError) {
        formError.textContent = errors.join(', ');
        formError.classList.add('show');
    }
}

/**
 * Clear form errors
 */
function clearFormErrors() {
    const formError = document.getElementById('formError');
    if (formError) {
        formError.textContent = '';
        formError.classList.remove('show');
    }
    
    // Clear field-level errors
    document.querySelectorAll('.form-group__error').forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
    });
    
    document.querySelectorAll('.form-group__input, .form-group__select').forEach(el => {
        el.classList.remove('error');
    });
}

/**
 * Update theme toggle button display
 */
function updateThemeToggleButton() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.textContent = ThemeManager.get() === 'dark' ? '☀️' : '🌙';
    }
}

/**
 * Set default date to today
 */
function setDefaultDate() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Set default date when page loads
window.addEventListener('load', setDefaultDate);
