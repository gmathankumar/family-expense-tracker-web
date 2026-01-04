import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to get current user's authorized_users record
export async function getCurrentUserRecord() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data, error } = await supabase
    .from('authorized_users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user record:', error)
    return null
  }

  return data
}

// Helper function to get date range for quick filters
function getDateRange(filterType) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (filterType) {
    case 'today':
      return {
        start: today.toISOString(),
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
      }
    case 'week':
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      return {
        start: weekStart.toISOString(),
        end: now.toISOString()
      }
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return {
        start: monthStart.toISOString(),
        end: now.toISOString()
      }
    case 'lastMonth':
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      return {
        start: lastMonthStart.toISOString(),
        end: lastMonthEnd.toISOString()
      }
    default:
      return null
  }
}

// Helper function to get user's expenses with pagination and filters
export async function getUserExpenses(page = 1, pageSize = 10, filters = {}) {
  const userRecord = await getCurrentUserRecord()
  
  if (!userRecord) {
    throw new Error('User not found in authorized_users')
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Build query for count and sum (filter by family_id to show all family expenses)
  let countQuery = supabase
    .from('expenses')
    .select('*', { count: 'exact', head: true })
    .eq('family_id', userRecord.family_id)

  // Build query for sum of amounts (with category and transaction_type for breakdown)
  let sumQuery = supabase
    .from('expenses')
    .select('amount, category, transaction_type, created_at')
    .eq('family_id', userRecord.family_id)

  // Build query for data
  let dataQuery = supabase
    .from('expenses')
    .select('*')
    .eq('family_id', userRecord.family_id)

  // Apply transaction type filter
  if (filters.transactionType) {
    countQuery = countQuery.eq('transaction_type', filters.transactionType)
    sumQuery = sumQuery.eq('transaction_type', filters.transactionType)
    dataQuery = dataQuery.eq('transaction_type', filters.transactionType)
  }

  // Apply category filter
  if (filters.category) {
    countQuery = countQuery.eq('category', filters.category)
    sumQuery = sumQuery.eq('category', filters.category)
    dataQuery = dataQuery.eq('category', filters.category)
  }

  // Apply date range filter
  if (filters.dateRange && filters.dateRange !== 'all') {
    const dateRange = getDateRange(filters.dateRange)
    if (dateRange) {
      countQuery = countQuery.gte('created_at', dateRange.start).lte('created_at', dateRange.end)
      sumQuery = sumQuery.gte('created_at', dateRange.start).lte('created_at', dateRange.end)
      dataQuery = dataQuery.gte('created_at', dateRange.start).lte('created_at', dateRange.end)
    }
  }

  // Apply search filter (client-side for now, could be moved to server with full-text search)
  const applySearch = filters.search && filters.search.trim() !== ''

  // Get total count
  const { count } = await countQuery

  // Get sum of all filtered amounts
  const { data: amountData } = await sumQuery

  // Get paginated data
  const { data, error } = await dataQuery
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  // Calculate total amount from all filtered expenses
  const totalAmount = amountData.reduce((sum, exp) => sum + Number.parseFloat(exp.amount || 0), 0)

  // Calculate monthly breakdown by transaction type from current month's data
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  
  const monthlyBreakdown = {
    expense: { total: 0, count: 0, categories: {} },
    income: { total: 0, count: 0, categories: {} },
    savings: { total: 0, count: 0, categories: {} }
  }
  
  // Calculate breakdown from amountData (all filtered records)
  amountData.forEach(item => {
    const itemDate = new Date(item.created_at)
    // Only include items from current month for monthly breakdown
    if (itemDate >= currentMonthStart && itemDate <= currentMonthEnd) {
      const type = item.transaction_type || 'expense'
      const amount = Number.parseFloat(item.amount || 0)
      const category = item.category
      
      monthlyBreakdown[type].total += amount
      monthlyBreakdown[type].count += 1
      
      if (!monthlyBreakdown[type].categories[category]) {
        monthlyBreakdown[type].categories[category] = 0
      }
      monthlyBreakdown[type].categories[category] += amount
    }
  })

  // Apply search filter client-side
  let filteredData = data
  if (applySearch) {
    const searchLower = filters.search.toLowerCase()
    filteredData = data.filter(expense => 
      expense.description.toLowerCase().includes(searchLower) ||
      expense.amount.toString().includes(searchLower)
    )
  }
  
  return {
    data: filteredData,
    total: count,
    totalAmount: totalAmount,
    monthlyBreakdown: monthlyBreakdown,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize)
  }
}


// Helper function to get totals by transaction type
// Get monthly transaction totals by type with category breakdown
export async function getMonthlyTransactionTypeTotals(year, month) {
  const userRecord = await getCurrentUserRecord()
  
  if (!userRecord) {
    throw new Error('User not found in authorized_users')
  }

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const { data, error } = await supabase
    .from('expenses')
    .select('category, amount, transaction_type')
    .eq('family_id', userRecord.family_id)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  if (error) throw error

  // Group by transaction type and category
  const summary = {
    expense: { total: 0, count: 0, categories: {} },
    income: { total: 0, count: 0, categories: {} },
    savings: { total: 0, count: 0, categories: {} }
  }

  data.forEach(item => {
    const type = item.transaction_type || 'expense'
    const amount = Number.parseFloat(item.amount)
    
    summary[type].total += amount
    summary[type].count += 1
    
    if (!summary[type].categories[item.category]) {
      summary[type].categories[item.category] = 0
    }
    summary[type].categories[item.category] += amount
  })

  return summary
}

// Create a new expense
export async function createExpense(expenseData) {
  const userRecord = await getCurrentUserRecord()
  
  if (!userRecord) {
    throw new Error('User not found in authorized_users')
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert([
      {
        user_id: userRecord.id,
        family_id: userRecord.family_id,
        amount: expenseData.amount,
        category: expenseData.category,
        description: expenseData.description,
        transaction_type: expenseData.transactionType || 'expense',
        created_at: new Date(expenseData.date).toISOString()
      }
    ])
    .select()

  if (error) throw error
  return data[0]
}

// Update an existing expense
export async function updateExpense(expenseId, updates) {
  const userRecord = await getCurrentUserRecord()
  
  if (!userRecord) {
    throw new Error('User not found in authorized_users')
  }

  // Handle date conversion if date is provided
  const processedUpdates = { ...updates }
  if (updates.date) {
    processedUpdates.created_at = new Date(updates.date).toISOString()
    delete processedUpdates.date
  }
  
  // Map camelCase to snake_case for database columns
  if (updates.transactionType) {
    processedUpdates.transaction_type = updates.transactionType
    delete processedUpdates.transactionType
  }

  const { data, error } = await supabase
    .from('expenses')
    .update(processedUpdates)
    .eq('id', expenseId)
    .eq('family_id', userRecord.family_id) // Ensure user can only update their family's expenses
    .select()

  if (error) throw error
  return data[0]
}

// Delete an expense
export async function deleteExpense(expenseId) {
  const userRecord = await getCurrentUserRecord()
  
  if (!userRecord) {
    throw new Error('User not found in authorized_users')
  }

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    .eq('family_id', userRecord.family_id) // Ensure user can only delete their family's expenses

  if (error) throw error
  return true
}