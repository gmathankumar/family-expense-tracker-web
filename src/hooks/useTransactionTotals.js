import { useState } from 'react'
import { getMonthlyTransactionTypeTotals } from '../lib/supabase'

export function useTransactionTotals() {
  const [transactionTotals, setTransactionTotals] = useState({
    expense: { count: 0, total: 0, categories: {} },
    income: { count: 0, total: 0, categories: {} },
    savings: { count: 0, total: 0, categories: {} }
  })

  const loadMonthlyTransactionTotals = async () => {
    try {
      const now = new Date()
      const monthlyTotals = await getMonthlyTransactionTypeTotals(now.getFullYear(), now.getMonth() + 1)
      setTransactionTotals(monthlyTotals)
    } catch (err) {
      console.error('Error loading monthly transaction totals:', err)
      throw err
    }
  }

  const getThisMonthTotal = (transactionType = null) => {
    if (!transactionType) {
      // If no type selected, sum all types
      return transactionTotals.expense.total + transactionTotals.income.total + transactionTotals.savings.total
    }
    // If type selected, show that type's total
    return transactionTotals[transactionType]?.total || 0
  }

  return {
    // State
    transactionTotals,
    // Actions
    loadMonthlyTransactionTotals,
    getThisMonthTotal,
    setTransactionTotals
  }
}
