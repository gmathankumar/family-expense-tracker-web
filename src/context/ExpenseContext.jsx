import { useReducer, useEffect, useMemo } from 'react'
import { supabase, getCurrentUserRecord, createExpense, updateExpense, deleteExpense } from '../lib/supabase'
import { ExpenseContext } from '../hooks/useExpenseContext'
import { ACTIONS } from '../models/reducerActions'

// Initial state
const initialState = {
  allExpenses: [], // Store all expenses from API
  loading: false,
  error: null,
  filters: {
    search: '',
    category: null,
    dateRange: 'all',
    transactionType: null
  },
  currentPage: 1,
  pageSize: 10
}

// Helper function to get date range for quick filters
function getDateRange(filterType) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (filterType) {
    case 'today':
      return {
        start: today.getTime(),
        end: today.getTime() + 24 * 60 * 60 * 1000 - 1
      }
    case 'week': {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      return {
        start: weekStart.getTime(),
        end: now.getTime()
      }
    }
    case 'month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return {
        start: monthStart.getTime(),
        end: now.getTime()
      }
    }
    case 'lastMonth': {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      return {
        start: lastMonthStart.getTime(),
        end: lastMonthEnd.getTime()
      }
    }
    default:
      return null
  }
}

// Helper function to filter expenses
function filterExpenses(expenses, filters) {
  return expenses.filter(expense => {
    // Search filter
    if (filters.search && filters.search.trim() !== '') {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch = 
        expense.description?.toLowerCase().includes(searchLower) ||
        expense.category?.toLowerCase().includes(searchLower) ||
        expense.amount?.toString().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Category filter
    if (filters.category && expense.category !== filters.category) {
      return false
    }

    // Transaction type filter
    if (filters.transactionType && expense.transaction_type !== filters.transactionType) {
      return false
    }

    // Date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const dateRange = getDateRange(filters.dateRange)
      if (dateRange) {
        const expenseTime = new Date(expense.created_at).getTime()
        if (expenseTime < dateRange.start || expenseTime > dateRange.end) {
          return false
        }
      }
    }

    return true
  })
}

// Helper function to compute financial data
function computeFinancials(expenses) {
  // Compute totals by transaction type
  const totals = {
    expense: { count: 0, total: 0 },
    income: { count: 0, total: 0 },
    savings: { count: 0, total: 0 }
  }

  expenses.forEach(exp => {
    const type = exp.transaction_type || 'expense'
    if (totals[type]) {
      totals[type].count++
      totals[type].total += Number.parseFloat(exp.amount || 0)
    }
  })

  // Compute category breakdown for current month
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime()

  const monthlyBreakdown = {
    expense: { total: 0, count: 0, categories: {} },
    income: { total: 0, count: 0, categories: {} },
    savings: { total: 0, count: 0, categories: {} }
  }

  expenses.forEach(exp => {
    const expenseTime = new Date(exp.created_at).getTime()
    if (expenseTime >= currentMonthStart && expenseTime <= currentMonthEnd) {
      const type = exp.transaction_type || 'expense'
      const category = exp.category || 'Other'
      
      if (monthlyBreakdown[type]) {
        monthlyBreakdown[type].count++
        monthlyBreakdown[type].total += Number.parseFloat(exp.amount || 0)
        
        if (!monthlyBreakdown[type].categories[category]) {
          monthlyBreakdown[type].categories[category] = 0
        }
        monthlyBreakdown[type].categories[category] += Number.parseFloat(exp.amount || 0)
      }
    }
  })

  return { totals, monthlyBreakdown }
}

// Helper function to paginate expenses
function paginateExpenses(expenses, page, pageSize) {
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  return expenses.slice(startIndex, endIndex)
}

// Reducer function
function expenseReducer(state, action) {
  switch (action.type) {
    case ACTIONS.FETCH_START:
      return { ...state, loading: true, error: null }
    
    case ACTIONS.FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        allExpenses: action.payload,
        error: null
      }
    
    case ACTIONS.FETCH_ERROR:
      return { ...state, loading: false, error: action.payload }
    
    case ACTIONS.ADD_EXPENSE:
      return {
        ...state,
        allExpenses: [action.payload, ...state.allExpenses]
      }
    
    case ACTIONS.UPDATE_EXPENSE:
      return {
        ...state,
        allExpenses: state.allExpenses.map(exp =>
          exp.id === action.payload.id ? action.payload : exp
        )
      }
    
    case ACTIONS.DELETE_EXPENSE:
      return {
        ...state,
        allExpenses: state.allExpenses.filter(exp => exp.id !== action.payload)
      }
    
    case ACTIONS.BULK_DELETE: {
      const idsToDelete = new Set(action.payload)
      return {
        ...state,
        allExpenses: state.allExpenses.filter(exp => !idsToDelete.has(exp.id))
      }
    }
    
    case ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: action.payload,
        currentPage: 1 // Reset to first page when filters change
      }
    
    case ACTIONS.SET_PAGE:
      return { ...state, currentPage: action.payload }
    
    case ACTIONS.SET_PAGE_SIZE:
      return {
        ...state,
        pageSize: action.payload,
        currentPage: 1 // Reset to first page when page size changes
      }
    
    case ACTIONS.RESET:
      return initialState
    
    default:
      return state
  }
}

// Create Context

// Fetch all expenses from API
async function fetchAllExpensesFromAPI() {
  const userRecord = await getCurrentUserRecord()
  
  if (!userRecord) {
    throw new Error('User not found in authorized_users')
  }

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('family_id', userRecord.family_id)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data || []
}

// Provider component
export function ExpenseProvider({ children }) {
  const [state, dispatch] = useReducer(expenseReducer, initialState)
  
  // Fetch all expenses on mount
  useEffect(() => {
    const loadData = async () => {
      dispatch({ type: ACTIONS.FETCH_START })
      try {
        const data = await fetchAllExpensesFromAPI()
        dispatch({ type: ACTIONS.FETCH_SUCCESS, payload: data })
      } catch (error) {
        dispatch({ type: ACTIONS.FETCH_ERROR, payload: error.message })
      }
    }
    
    loadData()
  }, [])

  // Compute filtered expenses
  const filteredExpenses = useMemo(() => {
    return filterExpenses(state.allExpenses, state.filters)
  }, [state.allExpenses, state.filters])

  // Compute paginated expenses
  const paginatedExpenses = useMemo(() => {
    return paginateExpenses(filteredExpenses, state.currentPage, state.pageSize)
  }, [filteredExpenses, state.currentPage, state.pageSize])

  // Compute financial data from ALL expenses (not filtered)
  const financialData = useMemo(() => {
    return computeFinancials(state.allExpenses)
  }, [state.allExpenses])

  // Compute financial data from filtered expenses
  const filteredFinancialData = useMemo(() => {
    return computeFinancials(filteredExpenses)
  }, [filteredExpenses])

  // Calculate total pages
  const totalPages = Math.ceil(filteredExpenses.length / state.pageSize)

  // Action handlers
  const handleAddExpense = async (expenseData) => {
    try {
      const newExpense = await createExpense(expenseData)
      dispatch({ type: ACTIONS.ADD_EXPENSE, payload: newExpense })
      return newExpense
    } catch (error) {
      console.error('Error creating expense:', error)
      throw error
    }
  }

  const handleUpdateExpense = async (expenseId, expenseData) => {
    try {
      const updatedExpense = await updateExpense(expenseId, expenseData)
      dispatch({ type: ACTIONS.UPDATE_EXPENSE, payload: updatedExpense })
      return updatedExpense
    } catch (error) {
      console.error('Error updating expense:', error)
      throw error
    }
  }

  const handleDeleteExpense = async (expenseId) => {
    try {
      await deleteExpense(expenseId)
      dispatch({ type: ACTIONS.DELETE_EXPENSE, payload: expenseId })
    } catch (error) {
      console.error('Error deleting expense:', error)
      throw error
    }
  }

  const handleBulkDelete = async (expenseIds) => {
    try {
      // Delete from database
      for (const id of expenseIds) {
        await deleteExpense(id)
      }
      // Update state
      dispatch({ type: ACTIONS.BULK_DELETE, payload: expenseIds })
    } catch (error) {
      console.error('Error bulk deleting expenses:', error)
      throw error
    }
  }

  const handleSetFilters = (newFilters) => {
    dispatch({ type: ACTIONS.SET_FILTERS, payload: newFilters })
  }

  const handleSetPage = (page) => {
    dispatch({ type: ACTIONS.SET_PAGE, payload: page })
  }

  // Memoize the context value to avoid unnecessary re-renders
  const value = useMemo(() => ({
    // State
    allExpenses: state.allExpenses,
    expenses: paginatedExpenses,
    filteredExpenses,
    loading: state.loading,
    error: state.error,
    filters: state.filters,
    currentPage: state.currentPage,
    pageSize: state.pageSize,
    totalPages,
    totalExpenses: filteredExpenses.length,
    
    // Financial data (from all expenses for insights)
    monthlyBreakdown: financialData.monthlyBreakdown,
    
    // Financial data from filtered expenses
    totalAmount: filteredFinancialData.totals,
    
    // Actions
    dispatch,
    handleAddExpense,
    handleUpdateExpense,
    handleDeleteExpense,
    handleBulkDelete,
    handleSetFilters,
    handleSetPage
  }), [
    state.allExpenses,
    state.loading,
    state.error,
    state.filters,
    state.currentPage,
    state.pageSize,
    paginatedExpenses,
    filteredExpenses,
    totalPages,
    financialData.monthlyBreakdown,
    filteredFinancialData.totals
  ])

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  )
}
