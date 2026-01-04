import { useState } from 'react'

export function useExpenseUI() {
  const [view, setView] = useState('list')
  const [error, setError] = useState(null)
  const [groupBy, setGroupBy] = useState(null)

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

  return {
    // State
    view,
    error,
    groupBy,
    // Actions
    setView,
    setError,
    setGroupBy,
    groupExpenses
  }
}
