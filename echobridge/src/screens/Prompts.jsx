import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import './Prompts.css'

const FALLBACK_PROMPTS = [
  { category:'Family & Heritage', question:'What is one tradition from your family you want to preserve?' },
  { category:'Family & Heritage', question:'What was your relationship with your grandparents like?' },
  { category:'Growth & Resilience', question:'Tell us about your first job.' },
  { category:'Growth & Resilience', question:'What challenge taught you the most about yourself?' },
  { category:'Advice for Youth', question:'What advice would you give your younger self?' },
  { category:'Advice for Youth', question:'What is a skill you wish you had learned earlier?' },
  { category:'Education & Learning', question:'What was your favourite subject in school and why?' },
  { category:'Education & Learning', question:'What is one thing school never taught you?' },
  { category:'Community & Culture', question:'Describe a moment of unexpected kindness in your community.' },
  { category:'Community & Culture', question:'What does home mean to you?' },
  { category:'Funny & Light', question:'Tell us about a funny mistake you once made.' },
  { category:'Funny & Light', question:'What was the most embarrassing trend you followed?' },
]

export default function Prompts() {
  const navigate = useNavigate()
  const [prompts,  setPrompts]  = useState([])
  const [search,   setSearch]   = useState('')
  const [activeFilter, setFilter] = useState('All')

  useEffect(() => {
    supabase.from('prompts').select('*').order('category').then(({ data }) => {
      setPrompts(data?.length ? data : FALLBACK_PROMPTS.map((p,i) => ({ ...p, id: i })))
    })
  }, [])

  const categories = ['All', ...new Set(prompts.map(p => p.category))]

  const filtered = prompts.filter(p => {
    const matchSearch = p.question.toLowerCase().includes(search.toLowerCase())
    const matchFilter = activeFilter === 'All' || p.category === activeFilter
    return matchSearch && matchFilter
  })

  const grouped = filtered.reduce((acc, p) => {
    ;(acc[p.category] = acc[p.category] || []).push(p)
    return acc
  }, {})

  return (
    <div className="screen">
      <div style={{ padding:'24px 20px 16px' }}>
        <h2>Story Prompts</h2>
        <p style={{ color:'var(--text-light)', fontSize:14, marginTop:4 }}>
          Choose a prompt to inspire your story
        </p>
      </div>

      {/* Search */}
      <div style={{ padding:'0 16px 12px' }}>
        <input className="input" placeholder="🔍  Search prompts…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Category filter */}
      <div className="category-scroll">
        {categories.map(cat => (
          <button key={cat}
            className={`cat-chip ${activeFilter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}>
            {cat}
          </button>
        ))}
      </div>

      {/* Grouped prompts */}
      <div style={{ padding:'12px 16px' }}>
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="prompt-group">
            <h3 style={{ marginBottom:10 }}>{cat}</h3>
            {items.map((p, i) => (
              <div key={p.id ?? i} className="prompt-row card"
                onClick={() => navigate('/record', { state: { prompt: p.question, promptId: p.id } })}>
                <div>
                  <p style={{ fontWeight:500, marginBottom:2 }}>{p.question}</p>
                  <small>Tap to record a story →</small>
                </div>
                <span style={{ fontSize:20, color:'var(--blue-dark)' }}>›</span>
              </div>
            ))}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="emoji">🔍</div>
            <p>No prompts match your search</p>
          </div>
        )}
      </div>
    </div>
  )
}
