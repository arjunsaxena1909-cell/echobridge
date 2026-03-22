import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import './Rewards.css'

const ALL_BADGES = [
  { id:'first_story',   emoji:'🎙️', name:'First Voice',      desc:'Posted your first story',           req:1,  type:'stories'   },
  { id:'five_stories',  emoji:'📚', name:'Storyteller',      desc:'Posted 5 stories',                  req:5,  type:'stories'   },
  { id:'ten_stories',   emoji:'🌟', name:'Community Voice',  desc:'Posted 10 stories',                 req:10, type:'stories'   },
  { id:'first_react',   emoji:'❤️',  name:'First Connection', desc:'Received your first reaction',     req:1,  type:'reactions' },
  { id:'ten_reactions', emoji:'🔥',  name:'Story Spark',     desc:'Received 10 reactions',             req:10, type:'reactions' },
  { id:'bridge_maker',  emoji:'🌉',  name:'Bridge Maker',    desc:'Received 25 reactions',             req:25, type:'reactions' },
  { id:'first_comment', emoji:'💬',  name:'Conversation',    desc:'Got your first comment',            req:1,  type:'comments'  },
  { id:'connector',     emoji:'🤝',  name:'Connector',       desc:'Received 10 comments',              req:10, type:'comments'  },
  { id:'community_gem', emoji:'💎',  name:'Community Gem',   desc:'Received 50 reactions total',       req:50, type:'reactions' },
]

export default function Rewards() {
  const { user } = useAuth()
  const [stats,  setStats]  = useState({ stories:0, reactions:0, comments:0 })
  const [loading,setLoading]= useState(true)

  useEffect(() => {
    async function fetchStats() {
      if (!user) return
      const [{ data: stories }, { data: reactions }, { data: comments }] = await Promise.all([
        supabase.from('stories').select('id', { count:'exact' }).eq('user_id', user.id),
        supabase.from('reactions').select('id', { count:'exact' })
          .in('story_id', (await supabase.from('stories').select('id').eq('user_id', user.id)).data?.map(s=>s.id) || []),
        supabase.from('comments').select('id', { count:'exact' })
          .in('story_id', (await supabase.from('stories').select('id').eq('user_id', user.id)).data?.map(s=>s.id) || []),
      ])
      setStats({ stories: stories?.length||0, reactions: reactions?.length||0, comments: comments?.length||0 })
      setLoading(false)
    }
    fetchStats()
  }, [user])

  function getProgress(badge) {
    const val = stats[badge.type] || 0
    return { val, pct: Math.min(100, (val / badge.req) * 100), earned: val >= badge.req }
  }

  const earned = ALL_BADGES.filter(b => getProgress(b).earned)
  const inProgress = ALL_BADGES.filter(b => !getProgress(b).earned)

  return (
    <div className="screen">
      <div style={{ padding:'24px 20px 16px' }}>
        <h2>Rewards & Badges</h2>
        <p style={{ color:'var(--text-light)', fontSize:14, marginTop:4 }}>
          Earn badges by sharing stories and connecting with your community
        </p>
      </div>

      {/* Summary card */}
      <div style={{ padding:'0 16px 20px' }}>
        <div className="rewards-summary card">
          <div className="stat-row">
            <div className="reward-stat">
              <span className="reward-num">{loading ? '…' : stats.stories}</span>
              <span className="reward-label">🎙 Stories</span>
            </div>
            <div className="reward-stat">
              <span className="reward-num">{loading ? '…' : stats.reactions}</span>
              <span className="reward-label">❤️ Reactions</span>
            </div>
            <div className="reward-stat">
              <span className="reward-num">{loading ? '…' : stats.comments}</span>
              <span className="reward-label">💬 Responses</span>
            </div>
            <div className="reward-stat">
              <span className="reward-num">{earned.length}</span>
              <span className="reward-label">🏅 Badges</span>
            </div>
          </div>
        </div>
      </div>

      {/* Earned badges */}
      {earned.length > 0 && (
        <div style={{ padding:'0 16px 20px' }}>
          <h3 style={{ marginBottom:12 }}>Earned Badges 🎉</h3>
          <div className="badges-grid">
            {earned.map(badge => (
              <div key={badge.id} className="badge-card earned">
                <div className="badge-emoji">{badge.emoji}</div>
                <p className="badge-name">{badge.name}</p>
                <small className="badge-desc">{badge.desc}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In progress */}
      <div style={{ padding:'0 16px 24px' }}>
        <h3 style={{ marginBottom:12 }}>In Progress</h3>
        {inProgress.map(badge => {
          const { val, pct } = getProgress(badge)
          return (
            <div key={badge.id} className="badge-progress-row card">
              <div className="badge-emoji-sm">{badge.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <p style={{ fontWeight:600, fontSize:14 }}>{badge.name}</p>
                  <small>{val} / {badge.req}</small>
                </div>
                <p style={{ fontSize:12, color:'var(--text-light)', marginBottom:8 }}>{badge.desc}</p>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width:`${pct}%` }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
