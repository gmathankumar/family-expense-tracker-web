import { useState } from 'react'
import { getUserExpenses } from '../lib/supabase'

export function useExpenses() {
  const [expenses, setExpenses] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [filters, setFilters] = useState({
    search: '',
    category: null,
    dateRange: 'all',
    transactionType: null
  })
  const [loading, setLoading] = useState(false)

  const pageSize = 10

  const loadExpenses = async (page = currentPage, currentFilters = filters) => {
    try {
      setLoading(true)
      const result = await getUserExpenses(page, pageSize, currentFilters)
      setExpenses(result.data)
      setTotalPages(result.totalPages)
      setTotalExpenses(result.total)
      setTotalAmount(result.totalAmount)
      setCurrentPage(page)
      return result // Return full result for passing to loadMonthlyTransactionTotals
    } catch (err) {
      console.error('Error loading expenses:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
    return loadExpenses(1, newFilters)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    return loadExpenses(page, filters)
  }

  return {
    // State
    expenses,
    currentPage,
    totalPages,
    totalExpenses,
    totalAmount,
    filters,
    loading,
    // Actions
    loadExpenses,
    handleFilterChange,
    handlePageChange,
    setLoading
  }
}
