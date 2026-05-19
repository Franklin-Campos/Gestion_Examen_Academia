import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Reportes from './admin/Reportes'
import Home from './pages/Home'
import AdminLogin from './admin/AdminLogin'
import Dashboard from './admin/Dashboard'
import Examenes from './admin/Examenes'
import Resultado from './pages/Resultado'
import Preguntas from './admin/Preguntas'
import Examen from './pages/Examen'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/examen" element={<Examen />} />
        <Route path="/resultado" element={<Resultado />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/examenes" element={<Examenes />} />
        <Route path="/admin/preguntas" element={<Preguntas />} />
        <Route path="/admin/reportes" element={<Reportes />} />
      </Routes>
    </Router>
  )
}