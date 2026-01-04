/**
 * メインアプリケーションコンポーネント
 * プロジェクトに応じてルーティングを追加してください
 */
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
// Admin pages
import AdminContacts from './pages/admin/Contacts'
import AdminContactThread from './pages/admin/ContactThread'
import AdminDashboard from './pages/admin/Dashboard'
import AdminLogin from './pages/admin/Login'
import AdminSignup from './pages/admin/Signup'
// User pages
import UserContact from './pages/user/Contact'
import UserContactThread from './pages/user/ContactThread'
import UserHome from './pages/user/Home'
import UserLogin from './pages/user/Login'
import UserSignup from './pages/user/Signup'

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          {/* ルートパスはユーザーログインにリダイレクト */}
          <Route path="/" element={<Navigate to="/user/login" replace />} />

          {/* ===== 管理画面ルート ===== */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/signup" element={<AdminSignup />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* お問い合わせ管理 */}
          <Route path="/admin/contacts" element={<AdminContacts />} />
          <Route path="/admin/contacts/:threadId" element={<AdminContactThread />} />

          {/* ===== ユーザー画面ルート ===== */}
          <Route path="/user/login" element={<UserLogin />} />
          <Route path="/user/signup" element={<UserSignup />} />
          <Route path="/user" element={<UserHome />} />
          <Route path="/user/home" element={<UserHome />} />

          {/* お問い合わせ */}
          <Route path="/user/contact" element={<UserContact />} />
          <Route path="/user/contact/:threadId" element={<UserContactThread />} />

          {/* 未定義のパスはユーザーログインにリダイレクト */}
          <Route path="*" element={<Navigate to="/user/login" replace />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  )
}

export default App
