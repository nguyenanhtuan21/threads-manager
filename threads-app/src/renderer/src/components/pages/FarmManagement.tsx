import { useState, useEffect } from 'react'
import { Play, Plus, Trash2, Clock, Users } from 'lucide-react'

interface Account {
    id: string
    username: string
    status: string
}

interface FarmCampaignAccount {
    id: string
    accountId: string
    account: Account
    status: string // PENDING, RUNNING, SUCCESS, FAILED
    errorLog?: string
}

interface FarmConfig {
    id: string
    enableLike: boolean
    likeCountMin: number
    likeCountMax: number
    enableFollow: boolean
    followCountMin: number
    followCountMax: number
    scrollTimeMin: number
    scrollTimeMax: number
}

interface FarmCampaign {
    id: string
    name: string
    status: string
    delayMin: number
    delayMax: number
    scheduleAt?: string
    config: FarmConfig
    accounts: FarmCampaignAccount[]
}

export function FarmManagement() {
    const [campaigns, setCampaigns] = useState<FarmCampaign[]>([])
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [accounts, setAccounts] = useState<Account[]>([])

    // States cho Form tạo mới
    const [formData, setFormData] = useState({
        name: '',
        delayMin: 30,
        delayMax: 60,
        selectedAccounts: [] as string[],
        config: {
            enableLike: true,
            likeCountMin: 5,
            likeCountMax: 15,
            enableFollow: false,
            followCountMin: 1,
            followCountMax: 5,
            scrollTimeMin: 30,
            scrollTimeMax: 120
        }
    })

    // Polling data
    useEffect(() => {
        loadData()
        const interval = setInterval(loadData, 5000)
        return () => clearInterval(interval)
    }, [])

    const loadData = async () => {
        try {
            const camps = await window.api.getFarmCampaigns()
            setCampaigns(camps)
            const accs = await window.api.getAccounts()
            setAccounts(accs)
        } catch (e) {
            console.error(e)
        }
    }

    const handleCreate = async () => {
        if (!formData.name) return alert('Vui lòng nhập tên chiến dịch')
        if (formData.selectedAccounts.length === 0) return alert('Chọn ít nhất 1 tài khoản')

        try {
            await window.api.createFarmCampaign({
                name: formData.name,
                delayMin: formData.delayMin,
                delayMax: formData.delayMax,
                config: formData.config,
                accounts: formData.selectedAccounts
            })
            setShowCreateModal(false)
            loadData()
            setFormData({
                name: '', delayMin: 30, delayMax: 60, selectedAccounts: [],
                config: { enableLike: true, likeCountMin: 5, likeCountMax: 15, enableFollow: false, followCountMin: 1, followCountMax: 5, scrollTimeMin: 30, scrollTimeMax: 120 }
            })
        } catch (e: any) {
            alert(`Lỗi tạo chiến dịch: ${e.message}`)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa chiến dịch này?')) return
        try {
            await window.api.deleteFarmCampaign(id)
            loadData()
        } catch (e: any) {
            alert(`Lỗi xóa: ${e.message}`)
        }
    }

    const handleStartCampaign = async (campaign: FarmCampaign) => {
        for (const acc of campaign.accounts) {
            if (acc.status === 'PENDING') {
                window.api.startFarmCampaign(acc.id)
            }
        }
        alert('Đã gửi lệnh chạy cho các tài khoản Pending!')
    }

    const toggleAccountSelection = (id: string) => {
        setFormData(prev => ({
            ...prev,
            selectedAccounts: prev.selectedAccounts.includes(id)
                ? prev.selectedAccounts.filter(a => a !== id)
                : [...prev.selectedAccounts, id]
        }))
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Nuôi tài khoản (Farming)</h1>
                    <p className="mt-2 text-sm text-zinc-400">Thiết lập các chiến dịch lướt feed, like, follow để duy trì trust.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
                >
                    <Plus className="h-4 w-4" />
                    Tạo Chiến Dịch Nuôi
                </button>
            </div>

            <div className="grid gap-6">
                {campaigns.map(camp => {
                    const total = camp.accounts.length
                    const success = camp.accounts.filter(a => a.status === 'SUCCESS').length
                    const failed = camp.accounts.filter(a => a.status === 'FAILED').length
                    const isDone = (success + failed) === total

                    return (
                        <div key={camp.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 overflow-hidden">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                                <div>
                                    <h3 className="text-lg font-medium text-white">{camp.name}</h3>
                                    <div className="mt-1 flex items-center gap-4 text-sm text-zinc-400">
                                        <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {total} tài khoản</span>
                                        <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Delay: {camp.delayMin}s - {camp.delayMax}s</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleStartCampaign(camp)}
                                        disabled={isDone}
                                        className="p-2 text-zinc-400 hover:text-emerald-400 disabled:opacity-50" title="Chạy">
                                        <Play className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleDelete(camp.id)} className="p-2 text-zinc-400 hover:text-red-400" title="Xóa">
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Tiến trình */}
                            <div className="mt-4">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-zinc-400">Tiến độ</span>
                                    <span className="text-emerald-400 font-medium">{success}/{total}</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(success / total) * 100 || 0}%` }}></div>
                                </div>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="rounded bg-zinc-800/50 p-3 text-sm">
                                        <strong className="text-zinc-300 block mb-2">Cấu hình:</strong>
                                        <ul className="text-zinc-400 space-y-1">
                                            <li>Lướt: {camp.config.scrollTimeMin}s - {camp.config.scrollTimeMax}s</li>
                                            <li>Like: {camp.config.enableLike ? `${camp.config.likeCountMin} - ${camp.config.likeCountMax}` : 'Tắt'}</li>
                                            <li>Follow: {camp.config.enableFollow ? `${camp.config.followCountMin} - ${camp.config.followCountMax}` : 'Tắt'}</li>
                                        </ul>
                                    </div>
                                    <div className="rounded bg-zinc-800/50 p-3 text-sm h-32 overflow-y-auto">
                                        <strong className="text-zinc-300 block mb-2">Status ({failed} lỗi):</strong>
                                        {camp.accounts.map(ca => (
                                            <div key={ca.id} className="flex justify-between text-xs py-1 border-b border-zinc-700/50 last:border-0">
                                                <span className="text-zinc-300">{ca.account.username}</span>
                                                <span className={
                                                    ca.status === 'SUCCESS' ? 'text-emerald-400' :
                                                        ca.status === 'FAILED' ? 'text-red-400' :
                                                            ca.status === 'RUNNING' ? 'text-blue-400' : 'text-zinc-500'
                                                }>
                                                    {ca.status} {ca.errorLog && `(${ca.errorLog})`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
                {campaigns.length === 0 && (
                    <div className="rounded-xl border border-zinc-800 border-dashed py-12 text-center">
                        <p className="text-sm text-zinc-500">Chưa có chiến dịch nào.</p>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-white mb-6">Tạo Chiến Dịch Nuôi Mới</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300">Tên chiến dịch</label>
                                <input
                                    type="text"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-1 block w-full rounded-lg bg-zinc-800 border-zinc-700 text-white p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    placeholder="VD: Nuôi account mẻ 1"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300">Thời gian lướt Feed (giây) - Từ/Đến</label>
                                    <div className="flex gap-2 mt-1">
                                        <input type="number" value={formData.config.scrollTimeMin} onChange={e => setFormData({ ...formData, config: { ...formData.config, scrollTimeMin: Number(e.target.value) } })} className="w-full rounded-lg bg-zinc-800 border-zinc-700 text-white p-2.5 outline-none" />
                                        <input type="number" value={formData.config.scrollTimeMax} onChange={e => setFormData({ ...formData, config: { ...formData.config, scrollTimeMax: Number(e.target.value) } })} className="w-full rounded-lg bg-zinc-800 border-zinc-700 text-white p-2.5 outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300">Delay giữa các Acc (giây) - Từ/Đến</label>
                                    <div className="flex gap-2 mt-1">
                                        <input type="number" value={formData.delayMin} onChange={e => setFormData({ ...formData, delayMin: Number(e.target.value) })} className="w-full rounded-lg bg-zinc-800 border-zinc-700 text-white p-2.5 outline-none" />
                                        <input type="number" value={formData.delayMax} onChange={e => setFormData({ ...formData, delayMax: Number(e.target.value) })} className="w-full rounded-lg bg-zinc-800 border-zinc-700 text-white p-2.5 outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border border-zinc-800 rounded-lg p-4 bg-zinc-900/50">
                                <div>
                                    <label className="flex items-center gap-2 mb-2 text-sm font-medium text-white cursor-pointer">
                                        <input type="checkbox" checked={formData.config.enableLike} onChange={e => setFormData({ ...formData, config: { ...formData.config, enableLike: e.target.checked } })} className="rounded border-zinc-700 bg-zinc-800 text-indigo-500 focus:ring-indigo-500/20" />
                                        Thả Tim (Like)
                                    </label>
                                    {formData.config.enableLike && (
                                        <div className="flex gap-2 items-center">
                                            <span className="text-xs text-zinc-500">Số lượng:</span>
                                            <input type="number" value={formData.config.likeCountMin} onChange={e => setFormData({ ...formData, config: { ...formData.config, likeCountMin: Number(e.target.value) } })} className="w-16 rounded bg-zinc-800 border-zinc-700 text-white p-1 text-xs outline-none" />
                                            <span className="text-zinc-500">-</span>
                                            <input type="number" value={formData.config.likeCountMax} onChange={e => setFormData({ ...formData, config: { ...formData.config, likeCountMax: Number(e.target.value) } })} className="w-16 rounded bg-zinc-800 border-zinc-700 text-white p-1 text-xs outline-none" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 mb-2 text-sm font-medium text-white cursor-pointer">
                                        <input type="checkbox" checked={formData.config.enableFollow} onChange={e => setFormData({ ...formData, config: { ...formData.config, enableFollow: e.target.checked } })} className="rounded border-zinc-700 bg-zinc-800 text-indigo-500 focus:ring-indigo-500/20" />
                                        Theo dõi (Follow)
                                    </label>
                                    {formData.config.enableFollow && (
                                        <div className="flex gap-2 items-center">
                                            <span className="text-xs text-zinc-500">Số lượng:</span>
                                            <input type="number" value={formData.config.followCountMin} onChange={e => setFormData({ ...formData, config: { ...formData.config, followCountMin: Number(e.target.value) } })} className="w-16 rounded bg-zinc-800 border-zinc-700 text-white p-1 text-xs outline-none" />
                                            <span className="text-zinc-500">-</span>
                                            <input type="number" value={formData.config.followCountMax} onChange={e => setFormData({ ...formData, config: { ...formData.config, followCountMax: Number(e.target.value) } })} className="w-16 rounded bg-zinc-800 border-zinc-700 text-white p-1 text-xs outline-none" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 pb-2">Chọn tài khoản chạy ({formData.selectedAccounts.length} / {accounts.length})</label>
                                <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 border-b-0 space-y-0">
                                    {accounts.map(acc => (
                                        <div
                                            key={acc.id}
                                            onClick={() => toggleAccountSelection(acc.id)}
                                            className={`cursor-pointer px-4 py-3 border-b border-zinc-800 flex items-center justify-between transition-colors
                        ${formData.selectedAccounts.includes(acc.id) ? 'bg-indigo-500/10' : 'hover:bg-zinc-800/50'}
                      `}
                                        >
                                            <span className="text-sm text-zinc-300">{acc.username}</span>
                                            <input
                                                type="checkbox"
                                                checked={formData.selectedAccounts.includes(acc.id)}
                                                onChange={() => { }}
                                                className="rounded border-zinc-700 bg-zinc-800 text-indigo-500"
                                            />
                                        </div>
                                    ))}
                                    {accounts.length === 0 && (
                                        <div className="p-4 text-center text-sm text-zinc-500">
                                            Chưa có tài khoản nào trong hệ thống.
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button onClick={() => setShowCreateModal(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white">
                                Hủy
                            </button>
                            <button onClick={handleCreate} className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
                                Lưu Chiến Dịch
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
