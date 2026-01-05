import { useState } from 'react'
import { useExpenseContext, useExpenseUI } from '../hooks'
import ExpenseForm from './ExpenseForm'
import Pagination from './Pagination'
import FilterBar from './FilterBar'

export default function ExpenseList() {
  // Get state and actions from context
  const {
    expenses,
    currentPage,
    totalPages,
    totalExpenses,
    totalAmount,
    filters,
    loading,
    error,
    monthlyBreakdown,
    handleSetFilters,
    handleSetPage,
    handleAddExpense,
    handleUpdateExpense,
    handleDeleteExpense,
    handleBulkDelete
  } = useExpenseContext()

  // Local UI state
  const uiHook = useExpenseUI()
  const { view, groupBy, setView, setGroupBy, groupExpenses } = uiHook
  
  const [editingExpense, setEditingExpense] = useState(null)
  const [selectedExpenses, setSelectedExpenses] = useState(new Set())
  const [showForm, setShowForm] = useState(false)

  // Handlers
  const handleSelectExpense = (expenseId) => {
    const newSelected = new Set(selectedExpenses)
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId)
    } else {
      newSelected.add(expenseId)
    }
    setSelectedExpenses(newSelected)
  }

  const handleSelectAll = (expensesList) => {
    if (selectedExpenses.size === expensesList.length && expensesList.length > 0) {
      setSelectedExpenses(new Set())
    } else {
      setSelectedExpenses(new Set(expensesList.map(e => e.id)))
    }
  }

  const handleAdd = async (expenseData) => {
    try {
      await handleAddExpense(expenseData)
      setShowForm(false)
    } catch (err) {
      console.error('Error creating expense:', err)
      throw err
    }
  }

  const handleUpdate = async (expenseData) => {
    try {
      const expenseId = editingExpense?.id
      if (!expenseId) {
        throw new Error('No expense selected for editing')
      }
      await handleUpdateExpense(expenseId, expenseData)
      setEditingExpense(null)
      setShowForm(false)
    } catch (err) {
      console.error('Error updating expense:', err)
      throw err
    }
  }

  const handleDelete = async (expenseId) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return
    }

    try {
      await handleDeleteExpense(expenseId)
    } catch (err) {
      console.error('Error deleting expense:', err)
      throw err
    }
  }

  const handleBulkDeleteClick = async () => {
    if (selectedExpenses.size === 0) return

    if (!confirm(`Delete ${selectedExpenses.size} selected expense(s)?`)) {
      return
    }

    try {
      await handleBulkDelete(Array.from(selectedExpenses))
      setSelectedExpenses(new Set())
    } catch (err) {
      console.error('Error bulk deleting expenses:', err)
      throw err
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

  const getThisMonthTotal = (transactionType = null) => {
    if (!transactionType) {
      // If no type selected, sum all types
      return monthlyBreakdown.expense.total + monthlyBreakdown.income.total + monthlyBreakdown.savings.total
    }
    // If type selected, show that type's total
    return monthlyBreakdown[transactionType]?.total || 0
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

  const getTransactionTypeStyle = (type) => {
    const styles = {
      'expense': { color: 'text-red-600', bg: 'bg-red-50' },
      'income': { color: 'text-green-600', bg: 'bg-green-50' },
      'savings': { color: 'text-blue-600', bg: 'bg-blue-50' }
    }
    return styles[type] || styles['expense']
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

  // Calculate total amount for filtered expenses
  const filteredTotalAmount = totalAmount.expense.total + totalAmount.income.total + totalAmount.savings.total
  const totalSummary = getThisMonthTotal(filters.transactionType)

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Stats Cards - Display in one row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
        <div className="bg-white rounded-lg shadow p-2 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">Total Transactions</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{totalExpenses}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-2 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">Total Amount</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{formatCurrency(filteredTotalAmount)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-2 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">This Month</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalSummary)}</p>
        </div>
      </div>

      {/* Filter Bar */}
      {view === 'list' && (
        <FilterBar 
          onFilterChange={handleSetFilters}
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
                    onChange={() => handleSelectAll(expenses)}
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
                    onClick={handleBulkDeleteClick}
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
            All
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
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {/* Expense Form */}
      {showForm && (
        <div className="mb-4 sm:mb-6">
          <ExpenseForm
            expense={editingExpense}
            onSubmit={editingExpense ? handleUpdate : handleAdd}
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
                                <p className={`text-lg font-semibold ml-2 ${getTransactionTypeStyle(expense.transaction_type).color}`}>
                                  {formatCurrency(expense.amount)}
                                </p>
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
                                  onClick={() => handleDelete(expense.id)}
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
                            <p className={`text-lg font-semibold ml-2 ${getTransactionTypeStyle(expense.transaction_type).color}`}>
                              {formatCurrency(expense.amount)}
                            </p>
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
                              onClick={() => handleDelete(expense.id)}
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
                          onChange={() => handleSelectAll(expenses)}
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
                                <span>{expense.description}</span>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(expense.category)}`}>
                                  {expense.category}
                                </span>
                              </td>
                              <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${getTransactionTypeStyle(expense.transaction_type).color}`}>
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
                                  onClick={() => handleDelete(expense.id)}
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
                            <span>{expense.description}</span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(expense.category)}`}>
                              {expense.category}
                            </span>
                          </td>
                          <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${getTransactionTypeStyle(expense.transaction_type).color}`}>
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
                              onClick={() => handleDelete(expense.id)}
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
                onPageChange={handleSetPage}
              />
            </>
          )}
        </div>
      )}

      {/* Summary View */}
      {view === 'summary' && (
        <div className="space-y-4 sm:space-y-6">
          {/* First Row - Transaction Type Summary */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Monthly Summary ({new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})
              </h2>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {/* Expenses */}
                <div className="border border-red-200 rounded-lg p-3 sm:p-4 bg-red-50">
                  <p className="text-xs sm:text-sm text-gray-600">Expenses</p>
                  <p className="text-lg sm:text-xl font-bold text-red-600 mt-1">{monthlyBreakdown.expense.count}</p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1">{formatCurrency(monthlyBreakdown.expense.total)}</p>
                </div>
                
                {/* Income */}
                <div className="border border-green-200 rounded-lg p-3 sm:p-4 bg-green-50">
                  <p className="text-xs sm:text-sm text-gray-600">Income</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600 mt-1">{monthlyBreakdown.income.count}</p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1">{formatCurrency(monthlyBreakdown.income.total)}</p>
                </div>
                
                {/* Savings */}
                <div className="border border-blue-200 rounded-lg p-3 sm:p-4 bg-blue-50">
                  <p className="text-xs sm:text-sm text-gray-600">Savings</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-600 mt-1">{monthlyBreakdown.savings.count}</p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1">{formatCurrency(monthlyBreakdown.savings.total)}</p>
                </div>
              </div>
              
              {/* Balance */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-lg font-semibold text-gray-900">Balance (Income - Expenses)</span>
                  <span className={`text-xl sm:text-2xl font-bold ${
                    (monthlyBreakdown.income.total - monthlyBreakdown.expense.total) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(monthlyBreakdown.income.total - monthlyBreakdown.expense.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Second Row - Category Distribution by Transaction Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Expenses Categories */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-red-200 bg-red-50">
                <h3 className="text-base sm:text-lg font-semibold text-red-900">Expense Categories</h3>
              </div>
              <div className="p-4 sm:p-6">
                {Object.keys(monthlyBreakdown.expense.categories).length === 0 ? (
                  <p className="text-sm text-gray-500">No expenses this month</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(monthlyBreakdown.expense.categories)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, amount]) => {
                        const percentage = (amount / monthlyBreakdown.expense.total) * 100
                        return (
                          <div key={category}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{category}</span>
                              <span className="text-xs sm:text-sm font-semibold text-gray-900">{percentage.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-red-600 h-1.5 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>
            
            {/* Income Categories */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-green-200 bg-green-50">
                <h3 className="text-base sm:text-lg font-semibold text-green-900">Income Categories</h3>
              </div>
              <div className="p-4 sm:p-6">
                {Object.keys(monthlyBreakdown.income.categories).length === 0 ? (
                  <p className="text-sm text-gray-500">No income this month</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(monthlyBreakdown.income.categories)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, amount]) => {
                        const percentage = (amount / monthlyBreakdown.income.total) * 100
                        return (
                          <div key={category}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{category}</span>
                              <span className="text-xs sm:text-sm font-semibold text-gray-900">{percentage.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-green-600 h-1.5 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>
            
            {/* Savings Categories */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-blue-200 bg-blue-50">
                <h3 className="text-base sm:text-lg font-semibold text-blue-900">Savings Categories</h3>
              </div>
              <div className="p-4 sm:p-6">
                {Object.keys(monthlyBreakdown.savings.categories).length === 0 ? (
                  <p className="text-sm text-gray-500">No savings this month</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(monthlyBreakdown.savings.categories)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, amount]) => {
                        const percentage = (amount / monthlyBreakdown.savings.total) * 100
                        return (
                          <div key={category}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{category}</span>
                              <span className="text-xs sm:text-sm font-semibold text-gray-900">{percentage.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}