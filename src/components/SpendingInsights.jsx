import { useState, useEffect } from 'react'
import { supabase, getCurrentUserRecord } from '../lib/supabase'

export default function SpendingInsights() {
  const [insight, setInsight] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchSpendingInsights()
  }, [])

  const fetchSpendingInsights = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user's family record
      const userRecord = await getCurrentUserRecord()
      if (!userRecord) {
        throw new Error('User not found in authorized_users')
      }

      // Get family's expenses from the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: expenses, error: fetchError } = await supabase
        .from('expenses')
        .select('amount, category, created_at, description')
        .eq('family_id', userRecord.family_id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      if (!expenses || expenses.length === 0) {
        setInsight('Start tracking expenses to get personalized spending insights!')
        setLoading(false)
        return
      }

      // Prepare data for analysis
      const analysisPrompt = prepareAnalysisPrompt(expenses)

      // Call OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Family Expense Tracker'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages: [
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const aiInsight = data.choices[0].message.content.trim()
      setInsight(aiInsight)
    } catch (err) {
      setError(err.message)
      setInsight('Unable to load insights at this moment.')
    } finally {
      setLoading(false)
    }
  }

  const prepareAnalysisPrompt = (expenses) => {
    // Analyze spending by category
    const categoryTotals = {}
    let totalSpent = 0

    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount
      totalSpent += expense.amount
    })

    // Find highest spending category
    const topCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0]
    const averageTransaction = (totalSpent / expenses.length).toFixed(2)

    const prompt = `Analyze this 30-day spending summary and provide one brief, encouraging insight (2 sentences max):
- Total spent: £${totalSpent.toFixed(2)}
- Number of transactions: ${expenses.length}
- Average per transaction: £${averageTransaction}
- Top spending category: ${topCategory[0]} (£${topCategory[1].toFixed(2)})
- Categories: ${Object.entries(categoryTotals).map(([cat, amt]) => `${cat}: £${amt.toFixed(2)}`).join(', ')}

Give a friendly, actionable insight about their spending patterns. Be concise and positive.`

    return prompt
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg shadow-sm p-3 sm:p-4 border border-indigo-100">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
            <p className="text-sm text-indigo-600 font-medium">Analyzing your spending patterns...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg shadow-sm p-3 sm:p-4 border border-indigo-100 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-xl">💡</div>
          <div className="flex-1">
            <p className="text-xs sm:text-sm text-indigo-900 font-medium">Spending Insight</p>
            <p className="text-sm sm:text-base text-indigo-800 mt-1">{insight}</p>
          </div>
          <button
            onClick={fetchSpendingInsights}
            className="flex-shrink-0 p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded transition-colors"
            title="Refresh insight"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        {error && (
          <p className="text-xs text-indigo-600 mt-2 ml-8">
            Note: {error}
          </p>
        )}
      </div>
    </div>
  )
}
