import { createContext, useContext } from "react"

export const ExpenseContext = createContext()

export function useExpenseContext() {
  const context = useContext(ExpenseContext)
  if (!context) {
    throw new Error('useExpense must be used within ExpenseProvider')
  }
  return context
}