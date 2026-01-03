import { useState, useEffect } from 'react'
import { getUserExpenses, getMonthlySummary, createExpense, updateExpense, deleteExpense } from '../lib/supabase'
import ExpenseForm from './ExpenseForm'
import Pagination from './Pagination'
import FilterBar from './FilterBar'

export default function ExpenseList() {
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState('list') // 'list' or 'summary'
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [filters, setFilters] = useState({
    search: '',
    category: null,
    dateRange: 'all'
  })
  const [selectedExpenses, setSelectedExpenses] = useState(new Set())
  const [groupBy, setGroupBy] = useState(null) // null, 'day', 'week', or 'month'
  const pageSize = 10

  useEffect(() => {
    loadExpenses()
    loadMonthlySummary()
  }, [])

  const loadExpenses = async (page = currentPage, currentFilters = filters) => {
    try {
      setLoading(true)
      const result = await getUserExpenses(page, pageSize, currentFilters)
      setExpenses(result.data)
      setTotalPages(result.totalPages)
      setTotalExpenses(result.total)
      setTotalAmount(result.totalAmount)
      setCurrentPage(page)
      setSelectedExpenses(new Set())
    } catch (err) {
      setError(err.message)
      console.error('Error loading expenses:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMonthlySummary = async () => {
    try {
      const now = new Date()
      const data = await getMonthlySummary(now.getFullYear(), now.getMonth() + 1)
      setSummary(data)
    } catch (err) {
      console.error('Error loading summary:', err)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryColor = (category) => {
    const colors = {
      'Grocery': 'bg-green-100 text-green-800',
      'Transport': 'bg-blue-100 text-blue-800',
      'Food': 'bg-orange-100 text-orange-800',
      'Entertainment': 'bg-purple-100 text-purple-800',
      'Shopping': 'bg-pink-100 text-pink-800',
      'Bills': 'bg-red-100 text-red-800',
      'Health': 'bg-teal-100 text-teal-800',
      'Other': 'bg-gray-100 text-gray-800'
    }
    return colors[category] || colors['Other']
  }

  const handleSelectExpense = (expenseId) => {
    const newSelected = new Set(selectedExpenses)
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId)
    } else {
      newSelected.add(expenseId)
    }
    setSelectedExpenses(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedExpenses.size === expenses.length && expenses.length > 0) {
      setSelectedExpenses(new Set())
    } else {
      setSelectedExpenses(new Set(expenses.map(e => e.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedExpenses.size === 0) return
    
    if (!confirm(`Delete ${selectedExpenses.size} selected expense(s)?`)) {
      return
    }

    try {
      setLoading(true)
      for (const expenseId of selectedExpenses) {
        await deleteExpense(expenseId)
      }
      setSelectedExpenses(new Set())
      await loadExpenses(1, filters)
      await loadMonthlySummary()
    } catch (err) {
      console.error('Error bulk deleting expenses:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const groupExpenses = (expensesList) => {
    if (!groupBy) return null

    const grouped = {}
    expensesList.forEach(expense => {
      const date = new Date(expense.created_at)
      let key

      if (groupBy === 'day') {
        key = date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
      } else if (groupBy === 'week') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        key = `Week of ${weekStart.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`
      } else if (groupBy === 'month') {
        key = date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })
      }

      if (!grouped[key]) grouped[key] = []
      grouped[key].push(expense)
    })

    return grouped
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
    loadExpenses(1, newFilters)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    loadExpenses(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAddExpense = async (expenseData) => {
    try {
      await createExpense(expenseData)
      setShowForm(false)
      setCurrentPage(1)
      await loadExpenses(1)
      await loadMonthlySummary()
    } catch (err) {
      console.error('Error creating expense:', err)
      throw err
    }
  }

  const handleUpdateExpense = async (expenseData) => {
    try {
      await updateExpense(editingExpense.id, expenseData)
      setEditingExpense(null)
      setShowForm(false)
      await loadExpenses(currentPage)
      await loadMonthlySummary()
    } catch (err) {
      console.error('Error updating expense:', err)
      throw err
    }
  }

  const handleDeleteExpense = async (expenseId) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return
    }

    try {
      await deleteExpense(expenseId)
      // If current page becomes empty after delete, go to previous page
      const newPage = expenses.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage
      setCurrentPage(newPage)
      await loadExpenses(newPage)
      await loadMonthlySummary()
    } catch (err) {
      console.error('Error deleting expense:', err)
      setError(err.message)
    }
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingExpense(null)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <p className="text-sm text-red-600 mt-2">
            Make sure your account is linked to an authorized user. Contact the admin.
          </p>
        </div>
      </div>
    )
  }

  const totalSummary = Object.values(summary).reduce((sum, amount) => sum + amount, 0)

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-8">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-gray-600">Total Expenses</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalExpenses}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-gray-600">Total Amount</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-gray-600">This Month</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatCurrency(totalSummary)}</p>
        </div>
      </div>

      {/* Filter Bar */}
      {view === 'list' && (
        <FilterBar 
          onFilterChange={handleFilterChange}
          currentFilters={filters}
        />
      )}

      {/* Grouping and Bulk Actions */}
      {view === 'list' && (
        <div className="mb-4 sm:mb-6 bg-white rounded-lg shadow-md p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div>
              <label htmlFor="groupBy" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Group By
              </label>
              <select
                id="groupBy"
                value={groupBy || ''}
                onChange={(e) => setGroupBy(e.target.value || null)}
                className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">No Grouping</option>
                <option value="day">Group by Day</option>
                <option value="week">Group by Week</option>
                <option value="month">Group by Month</option>
              </select>
            </div>
            
            <div className="flex-1 flex items-end gap-2 flex-wrap">
              {expenses.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-gray-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedExpenses.size === expenses.length && expenses.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                  <span className="text-xs sm:text-sm">Select All</span>
                </label>
              )}
              
              {selectedExpenses.size > 0 && (
                <>
                  <span className="text-sm text-gray-600 font-medium">
                    {selectedExpenses.size} selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1.5 sm:py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                  >
                    Delete Selected
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Toggle and Add Button */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex space-x-2 sm:space-x-4">
          <button
            onClick={() => setView('list')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base font-medium ${
              view === 'list'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Expenses
          </button>
          <button
            onClick={() => setView('summary')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base font-medium ${
              view === 'summary'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Monthly Summary
          </button>
        </div>
        <button
          onClick={() => {
            setEditingExpense(null)
            setShowForm(!showForm)
          }}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm sm:text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {showForm ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      {/* Expense Form */}
      {showForm && (
        <div className="mb-4 sm:mb-6">
          <ExpenseForm
            expense={editingExpense}
            onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Expenses</h2>
          </div>
          
          {expenses.length === 0 ? (
            <div className="px-4 sm:px-6 py-8 sm:py-12 text-center text-gray-500">
              <p>No expenses found.</p>
              <p className="text-sm mt-2">Add expenses using the form above or Telegram bot!</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden">
                {groupBy ? (
                  Object.entries(groupExpenses(expenses)).map(([groupKey, groupedExpenses]) => (
                    <div key={`group-${groupKey}`}>
                      <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                        <p className="font-semibold text-sm text-gray-900">{groupKey}</p>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {groupedExpenses.map((expense) => (
                          <div key={expense.id} className={`p-4 hover:bg-gray-50 ${selectedExpenses.has(expense.id) ? 'bg-indigo-50' : ''}`}>
                            <div className="flex gap-3 mb-2">
                              <input
                                type="checkbox"
                                checked={selectedExpenses.has(expense.id)}
                                onChange={() => handleSelectExpense(expense.id)}
                                className="mt-1 rounded"
                              />
                              <div className="flex-1 flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{expense.description}</p>
                                  <p className="text-xs text-gray-500 mt-1">{formatDate(expense.created_at)}</p>
                                </div>
                                <p className="text-lg font-semibold text-gray-900 ml-2">{formatCurrency(expense.amount)}</p>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-3 ml-7">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(expense.category)}`}>
                                {expense.category}
                              </span>
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handleEdit(expense)}
                                  className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  className="text-sm text-red-600 hover:text-red-900 font-medium"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="divide-y divide-gray-200">
                    {expenses.map((expense) => (
                      <div key={expense.id} className={`p-4 hover:bg-gray-50 ${selectedExpenses.has(expense.id) ? 'bg-indigo-50' : ''}`}>
                        <div className="flex gap-3 mb-2">
                          <input
                            type="checkbox"
                            checked={selectedExpenses.has(expense.id)}
                            onChange={() => handleSelectExpense(expense.id)}
                            className="mt-1 rounded"
                          />
                          <div className="flex-1 flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{expense.description}</p>
                              <p className="text-xs text-gray-500 mt-1">{formatDate(expense.created_at)}</p>
                            </div>
                            <p className="text-lg font-semibold text-gray-900 ml-2">{formatCurrency(expense.amount)}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-3 ml-7">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(expense.category)}`}>
                            {expense.category}
                          </span>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleEdit(expense)}
                              className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-sm text-red-600 hover:text-red-900 font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedExpenses.size === expenses.length && expenses.length > 0}
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {groupBy ? (
                      Object.entries(groupExpenses(expenses)).map(([groupKey, groupedExpenses]) => (
                        <>
                          <tr key={`group-${groupKey}`} className="bg-gray-100">
                            <td colSpan="6" className="px-3 sm:px-6 py-3 font-semibold text-gray-900 text-sm">
                              {groupKey}
                            </td>
                          </tr>
                          {groupedExpenses.map((expense) => (
                            <tr key={expense.id} className="hover:bg-gray-50">
                              <td className="px-3 sm:px-4 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedExpenses.has(expense.id)}
                                  onChange={() => handleSelectExpense(expense.id)}
                                  className="rounded"
                                />
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(expense.created_at)}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {expense.description}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(expense.category)}`}>
                                  {expense.category}
                                </span>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                {formatCurrency(expense.amount)}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-right space-x-2">
                                <button
                                  onClick={() => handleEdit(expense)}
                                  className="text-indigo-600 hover:text-indigo-900 font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  className="text-red-600 hover:text-red-900 font-medium"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </>
                      ))
                    ) : (
                      expenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-4 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedExpenses.has(expense.id)}
                              onChange={() => handleSelectExpense(expense.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(expense.created_at)}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {expense.description}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(expense.category)}`}>
                              {expense.category}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-right space-x-2">
                            <button
                              onClick={() => handleEdit(expense)}
                              className="text-indigo-600 hover:text-indigo-900 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-600 hover:text-red-900 font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination - Single instance for both views */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      )}

      {/* Summary View */}
      {view === 'summary' && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Monthly Summary ({new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})
            </h2>
          </div>
          
          {Object.keys(summary).length === 0 ? (
            <div className="px-4 sm:px-6 py-8 sm:py-12 text-center text-gray-500">
              <p>No expenses this month.</p>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {Object.entries(summary)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => {
                    const percentage = (amount / totalSummary) * 100
                    return (
                      <div key={category}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-full ${getCategoryColor(category)}`}>
                              {category}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-base sm:text-lg font-semibold text-gray-900">{formatCurrency(amount)}</p>
                            <p className="text-xs sm:text-sm text-gray-500">{percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
              </div>
              
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(totalSummary)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}