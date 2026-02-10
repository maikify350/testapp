import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import './TodoApp.css'

interface Todo {
  id: number
  title: string
  completed: boolean
  created_at: string
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTodos()
  }, [])

  async function fetchTodos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setTodos(data)
      setError(null)
    }
    setLoading(false)
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) return

    const { data, error } = await supabase
      .from('todos')
      .insert({ title })
      .select()
      .single()

    if (error) {
      setError(error.message)
    } else {
      setTodos([data, ...todos])
      setNewTitle('')
      setError(null)
    }
  }

  async function toggleTodo(todo: Todo) {
    const { error } = await supabase
      .from('todos')
      .update({ completed: !todo.completed })
      .eq('id', todo.id)

    if (error) {
      setError(error.message)
    } else {
      setTodos(todos.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t))
    }
  }

  async function deleteTodo(id: number) {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)

    if (error) {
      setError(error.message)
    } else {
      setTodos(todos.filter(t => t.id !== id))
    }
  }

  return (
    <div className="todo-app">
      <h1>Todo App</h1>
      <p className="todo-subtitle">Powered by Supabase</p>

      {error && <div className="todo-error">{error}</div>}

      <form onSubmit={addTodo} className="todo-form">
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="todo-input"
        />
        <button type="submit" className="todo-add-btn">Add</button>
      </form>

      {loading ? (
        <p className="todo-loading">Loading...</p>
      ) : todos.length === 0 ? (
        <p className="todo-empty">No todos yet. Add one above!</p>
      ) : (
        <ul className="todo-list">
          {todos.map(todo => (
            <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <label className="todo-label">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo)}
                />
                <span>{todo.title}</span>
              </label>
              <button onClick={() => deleteTodo(todo.id)} className="todo-delete-btn">
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="todo-count">
        {todos.filter(t => !t.completed).length} remaining
      </p>
    </div>
  )
}
