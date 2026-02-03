import { useEffect, useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import DesktopLayout from './layouts/DesktopLayout.jsx'
import MobileLayout from './layouts/MobileLayout.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'

function App() {
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
              <Layout>
                <Login />
              </Layout>
            }
          />
          <Route
            path="/home"
            element={
              <Layout>
                <Home />
              </Layout>
            }
          />
        </Routes>
      </HashRouter>
    </div>
  )
}

export default App
