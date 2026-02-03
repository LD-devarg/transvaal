import { useEffect, useState } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import DesktopLayout from './layouts/DesktopLayout.jsx'
import MobileLayout from './layouts/MobileLayout.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(sessionStorage.getItem("auth_user")))
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const Layout = isMobile ? MobileLayout : DesktopLayout

  return (
    <div className='w-full'>
      <HashRouter>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated
                ? <Navigate to="/home" replace />
                : (
                  <Layout>
                    <Login onAuthSuccess={() => setIsAuthenticated(true)} />
                  </Layout>
                )
            }
          />
          <Route
            path="/home"
            element={
              isAuthenticated
                ? (
                  <Layout>
                    <Home />
                  </Layout>
                )
                : <Navigate to="/" replace />
            }
          />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/home" : "/"} replace />} />
        </Routes>
      </HashRouter>
    </div>
  )
}

export default App
