import { Routes, Route, Outlet } from "react-router-dom"
import Auth from './pages/Auth'
import Home from './pages/Home'
import AuthInterceptor from "./interceptor/AuthInterceptor";
import PublicRoute from "./interceptor/PublicRoute";
import NotFound from "./interceptor/NotFound";
import Favorites from "./pages/Favorites";

function App() {
  const api = "http://localhost:3100";
  return (
    <>
      <Routes>
        <Route path='/home' element={
          <AuthInterceptor>
            <Home apiKey={api} />
          </AuthInterceptor>
        } />
        <Route path='/favorites' element={
          <AuthInterceptor>
            <Favorites apiKey={api} />
          </AuthInterceptor>
        } />
        <Route path='/' element={
          <PublicRoute>
            <Auth apiKey={api} />
          </PublicRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App
