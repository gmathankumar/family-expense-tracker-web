import { useState } from 'react'
import { createExpense, updateExpense, deleteExpense } from '../lib/supabase'

export function useExpenseOperations(onMutationSuccess) {
  const [editingExpense, setEditingExpense] = useState(null)
  const [selectedExpenses, setSelectedExpenses] = useState(new Set())
  const [showForm, setShowForm] = useState(false)

  const handleSelectExpense = (expenseId) => {
    const newSelected = new Set(selectedExpenses)
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId)
    } else {
      newSelected.add(expenseId)
    }
    setSelectedExpenses(newSelected)
  }

  const handleSelectAll = (expenses) => {
    if (selectedExpenses.size === expenses.length && expenses.length > 0) {
      setSelectedExpenses(new Set())
    } else {
      setSelectedExpenses(new Set(expenses.map(e => e.id)))
    }
  }

  const handleAddExpense = async (expenseData) => {
    try {
      await createExpense(expenseData)
      setShowForm(false)
      await onMutationSuccess()
    } catch (err) {
      console.error('Error creating expense:', err)
      throw err
    }
  }

  const handleUpdateExpense = async (expenseId, expenseData) => {
    try {
      await updateExpense(expenseId, expenseData)
      setEditingExpense(null)
      setShowForm(false)
      await onMutationSuccess()
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
      await onMutationSuccess()
    } catch (err) {
      console.error('Error deleting expense:', err)
      throw err
    }
  }

  const handleBulkDelete = async (selectedIds) => {
    if (selectedIds.size === 0) return

    if (!confirm(`Delete ${selectedIds.size} selected expense(s)?`)) {
      return
    }

    try {
      for (const expenseId of selectedIds) {
        await deleteExpense(expenseId)
      }
      setSelectedExpenses(new Set())
      await onMutationSuccess()
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

  return {
    // State
    editingExpense,
    selectedExpenses,
    showForm,
    // Actions
    handleSelectExpense,
    handleSelectAll,
    handleAddExpense,
    handleUpdateExpense,
    handleDeleteExpense,
    handleBulkDelete,
    handleEdit,
    handleCancelForm,
    setShowForm,
    setEditingExpense
  }
}
