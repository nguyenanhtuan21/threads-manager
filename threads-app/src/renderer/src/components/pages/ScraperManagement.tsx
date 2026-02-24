import { useState, useEffect } from 'react'
import { Play, Users, RefreshCw } from 'lucide-react'

interface Account {
    id: string
    username: string
    status: string
    followerCount: number
    followingCount: number
    postCount: number
}

export function ScraperManagement() {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isScraping, setIsScraping] = useState(false)

    const loadData = async () => {
        try {
            const accs = await window.api.getAccounts()
            setAccounts(accs)
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) newSelected.delete(id)
        else newSelected.add(id)
        setSelectedIds(newSelected)
    }

    const toggleAll = () => {
        if (selectedIds.size === accounts.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(accounts.map(a => a.id)))
        }
    }

    const startScraping = async () => {
        if (selectedIds.size === 0) return alert('Hãy chọn ít nhất 1 tài khoản để quét!')
        setIsScraping(true)
        try {
            await window.api.startScraper(Array.from(selectedIds))
            alert('Đã gửi lệnh quét dữ liệu. Quá trình chạy ngầm, vui lòng chờ ít phút rồi Refresh.')
            setSelectedIds(new Set())
        } catch (e: any) {
            alert(`Lỗi: ${e.message}`)
        } finally {
            setIsScraping(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Quét dữ liệu (Scraper)</h1>
                    <p className="mt-2 text-sm text-zinc-400">Thu thập và cập nhật số Follower/Following mới nhất từ Threads.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={loadData}
                        className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Làm mới
                    </button>
                    <button
                        onClick={startScraping}
                        disabled={isScraping || selectedIds.size === 0}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                        <Play className="h-4 w-4" />
                        {isScraping ? 'Đang gửi lệnh...' : `Chạy Quét (${selectedIds.size})`}
                    </button>
                </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-300">
                        <thead className="border-b border-zinc-800 bg-zinc-950 text-xs uppercase text-zinc-400 font-semibold">
                            <tr>
                                <th className="px-6 py-4 w-16">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === accounts.length && accounts.length > 0}
                                        onChange={toggleAll}
                                        className="rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-blue-600/20"
                                    />
                                </th>
                                <th className="px-6 py-4">Tài Khoản</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Followers</th>
                                <th className="px-6 py-4 text-right">Following</th>
                                {/* <th className="px-6 py-4 text-right">Posts</th> */}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {accounts.map(acc => (
                                <tr
                                    key={acc.id}
                                    className={`hover:bg-zinc-800/50 transition-colors cursor-pointer ${selectedIds.has(acc.id) ? 'bg-blue-500/5' : ''}`}
                                    onClick={() => toggleSelect(acc.id)}
                                >
                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(acc.id)}
                                            onChange={() => toggleSelect(acc.id)}
                                            className="rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-blue-600/20"
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                                        <Users className="w-4 h-4 text-zinc-500" />
                                        {acc.username}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium 
                                        ${acc.status === 'LIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                                                acc.status === 'DIE' ? 'bg-red-500/10 text-red-400' :
                                                    'bg-yellow-500/10 text-yellow-400'}`}
                                        >
                                            {acc.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-emerald-400">
                                        {acc.followerCount?.toLocaleString() || 0}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-blue-400">
                                        {acc.followingCount?.toLocaleString() || 0}
                                    </td>
                                </tr>
                            ))}
                            {accounts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                        Chưa có tài khoản nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
