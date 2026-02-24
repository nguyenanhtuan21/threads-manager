import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'

import { AccountManagement } from './components/pages/AccountManagement'
import { ProxyManagement } from './components/pages/ProxyManagement'
import { PostManagement } from './components/pages/PostManagement'
import { CampaignManagement } from './components/pages/CampaignManagement'
import { FarmManagement } from './components/pages/FarmManagement'
import { ScraperManagement } from './components/pages/ScraperManagement'
import { useState, useEffect } from 'react'

// Các màn hình tạm thời
const Dashboard = () => {
  const [stats, setStats] = useState({
    totalAccounts: 0,
    activeAccounts: 0,
    deadAccounts: 0,
    blockedAccounts: 0,
    totalFollowers: 0,
    totalPosts: 0
  })

  useEffect(() => {
    window.api.getDashboardStats().then(setStats).catch(console.error)
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Tổng Quan</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow">
          <div className="text-sm font-medium text-zinc-400">Tổng tài khoản</div>
          <div className="mt-2 text-3xl font-bold text-white">{stats.totalAccounts}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow">
          <div className="text-sm font-medium text-zinc-400">Đang hoạt động (LIVE)</div>
          <div className="mt-2 text-3xl font-bold text-emerald-400">{stats.activeAccounts}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow">
          <div className="text-sm font-medium text-zinc-400">Bị khóa (ERROR/DIE)</div>
          <div className="mt-2 text-3xl font-bold text-red-400">{stats.deadAccounts + stats.blockedAccounts}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow">
          <div className="text-sm font-medium text-zinc-400">Tổng thu thập (Followers)</div>
          <div className="mt-2 text-3xl font-bold text-blue-400">{stats.totalFollowers.toLocaleString()}</div>
        </div>
      </div>
    </div>
  )
}

const Placeholder = ({ title }: { title: string }) => (
  <div className="flex relative h-[80vh] items-center justify-center">
    <h2 className="text-xl text-zinc-500">{title} - Đang phát triển</h2>
  </div>
)

function App() {
  return (
    <HashRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/accounts" element={<AccountManagement />} />
          <Route path="/posts" element={<PostManagement />} />
          <Route path="/interactions" element={<CampaignManagement />} />
          <Route path="/farming" element={<FarmManagement />} />
          <Route path="/scraper" element={<ScraperManagement />} />
          <Route path="/proxies" element={<ProxyManagement />} />
          <Route path="/settings" element={<Placeholder title="Cấu hình hệ thống" />} />
        </Routes>
      </AppLayout>
    </HashRouter>
  )
}

export default App
