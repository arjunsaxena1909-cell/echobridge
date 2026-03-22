import { useLocation, useNavigate } from 'react-router-dom'
import './BottomNav.css'

const tabs = [
  { path: '/',        icon: '🏠', label: 'Home'    },
  { path: '/prompts', icon: '💬', label: 'Prompts' },
  { path: '/record',  icon: '🎙️', label: 'Record'  },
  { path: '/rewards', icon: '🏅', label: 'Rewards' },
  { path: '/profile', icon: '👤', label: 'Profile' },
]

export default function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => {
        const active = pathname === tab.path
        return (
          <button
            key={tab.path}
            className={`nav-item ${active ? 'active' : ''} ${tab.path === '/record' ? 'record-btn' : ''}`}
            onClick={() => navigate(tab.path)}
            aria-label={tab.label}
          >
            {tab.path === '/record' ? (
              <div className="record-circle">
                <span className="nav-icon">{tab.icon}</span>
              </div>
            ) : (
              <>
                <span className="nav-icon">{tab.icon}</span>
                <span className="nav-label">{tab.label}</span>
              </>
            )}
          </button>
        )
      })}
    </nav>
  )
}
