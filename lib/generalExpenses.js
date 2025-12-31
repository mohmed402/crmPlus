import { supabase } from './supabase';

/**
 * Create a new general expense
 * @param {Object} expenseData - The expense data
 * @param {number} userId - The user ID creating the expense
 * @returns {Promise<number>} The new expense ID
 */
export async function createGeneralExpense(expenseData, userId) {
  const { data, error } = await supabase
    .from('general_expenses')
    .insert({
      title: expenseData.title,
      description: expenseData.description || null,
      amount: expenseData.amount,
      currency: expenseData.currency || 'LYD',
      exchange_rate: expenseData.exchange_rate || null,
      amount_lyd: expenseData.amount_lyd,
      expense_date: expenseData.expense_date || new Date().toISOString().split('T')[0],
      category: expenseData.category || null,
      created_by: userId
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating general expense:', error);
    throw error;
  }

  return data.id;
}

/**
 * Get all general expenses with optional filters
 * @param {Object} filters - Optional filters (startDate, endDate, category)
 * @returns {Promise<Array>} Array of expenses
 */
export async function getGeneralExpenses(filters = {}) {
  let query = supabase
    .from('general_expenses')
    .select(`
      *,
      users (
        username
      )
    `)
    .order('expense_date', { ascending: false });

  // Apply filters
  if (filters.startDate) {
    query = query.gte('expense_date', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('expense_date', filters.endDate);
  }

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  const { data: expenses, error } = await query;

  if (error) {
    console.error('Error getting general expenses:', error);
    return [];
  }

  // Format the response
  return expenses.map(expense => ({
    ...expense,
    created_by_username: expense.users?.username,
    users: undefined
  }));
}

/**
 * Get a single general expense by ID
 * @param {number} id - The expense ID
 * @returns {Promise<Object|null>} The expense or null
 */
export async function getGeneralExpenseById(id) {
  const { data, error } = await supabase
    .from('general_expenses')
    .select(`
      *,
      users (
        username
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error getting general expense:', error);
    return null;
  }

  return {
    ...data,
    created_by_username: data.users?.username,
    users: undefined
  };
}

/**
 * Update a general expense
 * @param {number} id - The expense ID
 * @param {Object} expenseData - The updated expense data
 * @returns {Promise<void>}
 */
export async function updateGeneralExpense(id, expenseData) {
  const updateData = {
    title: expenseData.title,
    description: expenseData.description || null,
    amount: expenseData.amount,
    currency: expenseData.currency || 'LYD',
    exchange_rate: expenseData.exchange_rate || null,
    amount_lyd: expenseData.amount_lyd,
    expense_date: expenseData.expense_date,
    category: expenseData.category || null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('general_expenses')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating general expense:', error);
    throw error;
  }
}

/**
 * Delete a general expense
 * @param {number} id - The expense ID
 * @returns {Promise<void>}
 */
export async function deleteGeneralExpense(id) {
  const { error } = await supabase
    .from('general_expenses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting general expense:', error);
    throw error;
  }
}

/**
 * Get total general expenses in LYD for a date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<number>} Total expenses in LYD
 */
export async function getTotalGeneralExpenses(startDate, endDate) {
  let query = supabase
    .from('general_expenses')
    .select('amount_lyd');

  if (startDate) {
    query = query.gte('expense_date', startDate);
  }

  if (endDate) {
    query = query.lte('expense_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error getting total general expenses:', error);
    return 0;
  }

  return data.reduce((sum, expense) => sum + (parseFloat(expense.amount_lyd) || 0), 0);
}

/**
 * Get expenses grouped by category
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of {category, total}
 */
export async function getExpensesByCategory(startDate, endDate) {
  let query = supabase
    .from('general_expenses')
    .select('category, amount_lyd');

  if (startDate) {
    query = query.gte('expense_date', startDate);
  }

  if (endDate) {
    query = query.lte('expense_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error getting expenses by category:', error);
    return [];
  }

  // Group by category
  const categoryMap = {};
  data.forEach(expense => {
    const category = expense.category || 'غير مصنف';
    if (!categoryMap[category]) {
      categoryMap[category] = 0;
    }
    categoryMap[category] += parseFloat(expense.amount_lyd) || 0;
  });

  return Object.entries(categoryMap).map(([category, total]) => ({
    category,
    total
  }));
}

