import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import BottomNav from './components/BottomNav'
import Login from './screens/Login'
import SignUp from './screens/SignUp'
import Home from './screens/Home'
import Prompts from './screens/Prompts'
import Record from './screens/Record'
import ConversationView from './screens/ConversationView'
import Profile from './screens/Profile'
import Rewards from './screens/Rewards'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="app-shell"><div className="spinner" /></div>
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-shell">
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
          <div style={{ fontSize:48 }}>🌉</div>
          <div className="spinner" style={{ margin:0 }} />
          <p style={{ color:'var(--text-light)', fontSize:14 }}>Loading EchoBridge…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/login"  element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/" replace /> : <SignUp />} />
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/prompts" element={<PrivateRoute><Prompts /></PrivateRoute>} />
        <Route path="/record" element={<PrivateRoute><Record /></PrivateRoute>} />
        <Route path="/story/:id" element={<PrivateRoute><ConversationView /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/rewards" element={<PrivateRoute><Rewards /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {user && <BottomNav />}
    </div>
  )
}
