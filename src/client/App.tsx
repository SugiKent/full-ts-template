/**
 * メインアプリケーションコンポーネント
 * プロジェクトに応じてルーティングを追加してください
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminLogin from './pages/admin/Login'
import AdminSignup from './pages/admin/Signup'
// User pages
import UserHome from './pages/user/Home'
import UserLogin from './pages/user/Login'
import UserSignup from './pages/user/Signup'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ルートパスはユーザーログインにリダイレクト */}
        <Route path="/" element={<Navigate to="/user/login" replace />} />

        {/* ===== 管理画面ルート ===== */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<AdminSignup />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* TODO: プロジェクトに応じて管理画面のルートを追加 */}
        {/* 例:
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/settings" element={<Settings />} />
        */}

        {/* ===== ユーザー画面ルート ===== */}
        <Route path="/user/login" element={<UserLogin />} />
        <Route path="/user/signup" element={<UserSignup />} />
        <Route path="/user" element={<UserHome />} />
        <Route path="/user/home" element={<UserHome />} />

        {/* TODO: プロジェクトに応じてユーザー画面のルートを追加 */}
        {/* 例:
        <Route path="/user/profile" element={<Profile />} />
        <Route path="/user/settings" element={<Settings />} />
        */}

        {/* 未定義のパスはユーザーログインにリダイレクト */}
        <Route path="*" element={<Navigate to="/user/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
