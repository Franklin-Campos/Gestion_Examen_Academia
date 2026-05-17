import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import AdminLogin from './admin/AdminLogin'
import Dashboard from './admin/Dashboard'
import Examenes from './admin/Examenes'
import Preguntas from './admin/Preguntas'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/examenes" element={<Examenes />} />
        <Route path="/admin/preguntas" element={<Preguntas />} />
      </Routes>
    </Router>
  )
}