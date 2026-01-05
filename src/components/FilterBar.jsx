import { useState } from 'react'
import { TRANSACTION_CATEGORIES, TRANSACTION_TYPES } from '../constants'

const ALL_CATEGORIES = ['All Categories', ...new Set(Object.values(TRANSACTION_CATEGORIES).flat())]

const QUICK_FILTERS = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Last Month', value: 'lastMonth' }
]

export default function FilterBar({ onFilterChange, currentFilters }) {
  const [searchTerm, setSearchTerm] = useState(currentFilters.search || '')
  const [selectedCategory, setSelectedCategory] = useState(currentFilters.category || 'All Categories')
  const [quickFilter, setQuickFilter] = useState(currentFilters.dateRange || 'all')
  const [transactionType, setTransactionType] = useState(currentFilters.transactionType || null)

  // Get categories for the selected transaction type
  const getAvailableCategories = () => {
    if (!transactionType) {
      return ALL_CATEGORIES
    }
    return ['All Categories', ...TRANSACTION_CATEGORIES[transactionType]]
  }

  // Reset category when transaction type changes
  const handleTransactionTypeChange = (type) => {
    const newType = transactionType === type ? null : type
    setTransactionType(newType)
    setSelectedCategory('All Categories')
    onFilterChange({ 
      ...currentFilters, 
      transactionType: newType,
      category: null 
    })
  }

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    onFilterChange({ ...currentFilters, search: value })
  }

  const handleCategoryChange = (e) => {
    const value = e.target.value
    setSelectedCategory(value)
    onFilterChange({ 
      ...currentFilters, 
      category: value === 'All Categories' ? null : value 
    })
  }

  const handleQuickFilter = (value) => {
    setQuickFilter(value)
    onFilterChange({ ...currentFilters, dateRange: value })
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('All Categories')
    setQuickFilter('all')
    setTransactionType(null)
    onFilterChange({ search: '', category: null, dateRange: 'all', transactionType: null })
  }

  const hasActiveFilters = searchTerm || selectedCategory !== 'All Categories' || quickFilter !== 'all' || transactionType

  const availableCategories = getAvailableCategories()

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 sm:mb-6">
      {/* Search Bar */}
      <div className="mb-3 sm:mb-4">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
          Search
        </label>
        <div className="relative">
          <input
            type="text"
            id="search"
            placeholder="Search by description or amount..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 pl-10 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Transaction Type Filter */}
      <div className="mb-3 sm:mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transaction Type
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleTransactionTypeChange(null)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              transactionType === null
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Types
          </button>
          {TRANSACTION_TYPES.map((type) => {
            const colorMap = {
              red: { selected: 'bg-red-600 text-white', unselected: 'bg-red-100 text-red-700 hover:bg-red-200' },
              green: { selected: 'bg-green-600 text-white', unselected: 'bg-green-100 text-green-700 hover:bg-green-200' },
              blue: { selected: 'bg-blue-600 text-white', unselected: 'bg-blue-100 text-blue-700 hover:bg-blue-200' }
            }
            const colors = colorMap[type.color]
            return (
            <button
              key={type.value}
              onClick={() => handleTransactionTypeChange(type.value)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                transactionType === type.value ? colors.selected : colors.unselected
              }`}
            >
              {type.label}
            </button>
          )})
          }
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-3 sm:mb-4">
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          id="category"
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {availableCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Quick Filters */}
      <div className="mb-3 sm:mb-0">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Filters
        </label>
        <div className="flex flex-wrap gap-2">
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => handleQuickFilter(filter.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                quickFilter === filter.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={handleClearFilters}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  )
}
