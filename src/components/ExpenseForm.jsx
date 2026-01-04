import { useState, useEffect } from 'react'
import { TRANSACTION_TYPES, TRANSACTION_CATEGORIES, FORM_PLACEHOLDERS } from '../constants'

export default function ExpenseForm({ expense, onSubmit, onCancel }) {
  // Set default date to today
  const getTodayDateString = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState({
    amount: '',
    category: TRANSACTION_CATEGORIES.expense[0],
    description: '',
    date: getTodayDateString(),
    transactionType: 'expense'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (expense) {
      setFormData({
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        date: new Date(expense.created_at).toISOString().split('T')[0],
        transactionType: expense.transaction_type || 'expense'
      })
    }
  }, [expense])

  // Get available categories for current transaction type
  const getAvailableCategories = () => {
    return TRANSACTION_CATEGORIES[formData.transactionType] || TRANSACTION_CATEGORIES.expense
  }

  // Get placeholder and label for current transaction type
  const getContextInfo = () => {
    return FORM_PLACEHOLDERS[formData.transactionType] || FORM_PLACEHOLDERS.expense
  }

  const handleTransactionTypeChange = (newType) => {
    const categories = TRANSACTION_CATEGORIES[newType]
    setFormData({
      ...formData,
      transactionType: newType,
      category: categories[0] // Set to first category of new type
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate amount
    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than 0')
      setLoading(false)
      return
    }

    try {
      await onSubmit({
        ...formData,
        amount
      })
      
      // Reset form if it's a new expense
      if (!expense) {
        setFormData({
          amount: '',
          category: 'Grocery',
          description: '',
          date: getTodayDateString()
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
        {expense ? 'Edit' : 'Add New'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div>
          <label htmlFor="transactionType" className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TRANSACTION_TYPES.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleTransactionTypeChange(type.value)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  formData.transactionType === type.value
                    ? `bg-${type.color}-100 text-${type.color}-700 ring-2 ring-${type.color}-500`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={loading}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            id="date"
            required
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount (£)
          </label>
          <input
            type="number"
            id="amount"
            step="0.01"
            min="0.01"
            required
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            required
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            disabled={loading}
          >
            {getAvailableCategories().map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            {getContextInfo().label}
          </label>
          <input
            type="text"
            id="description"
            required
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={getContextInfo().placeholder}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={loading}
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            type="submit"
            disabled={loading}
            className={`w-full sm:flex-1 py-2.5 px-4 text-white text-sm sm:text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              formData.transactionType === 'expense' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' :
              formData.transactionType === 'income' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' :
              'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {loading ? 'Saving...' : 'Submit'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm sm:text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
