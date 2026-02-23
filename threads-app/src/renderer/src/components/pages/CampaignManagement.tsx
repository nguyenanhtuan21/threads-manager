import { useEffect, useState } from 'react'
import { Plus, Trash2, Calendar, PlaySquare, Play, Square, CheckCircle2, AlertCircle, Clock, X } from 'lucide-react'

export function CampaignManagement() {
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [posts, setPosts] = useState<any[]>([])
    const [accounts, setAccounts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)

    const [newCamp, setNewCamp] = useState({
        name: '',
        postId: '',
        accounts: [] as string[],
        delayMin: 30,
        delayMax: 60,
        scheduleAt: '' // YYYY-MM-DDTHH:mm
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [campData, postData, accData] = await Promise.all([
                window.api.getCampaigns(),
                window.api.getPosts(),
                window.api.getAccounts()
            ])
            setCampaigns(campData)
            setPosts(postData)
            setAccounts(accData)
        } catch (error) {
            console.error('Error loading campaign data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAccountToggle = (accountId: string) => {
        setNewCamp(prev => {
            if (prev.accounts.includes(accountId)) {
                return { ...prev, accounts: prev.accounts.filter(id => id !== accountId) }
            } else {
                return { ...prev, accounts: [...prev.accounts, accountId] }
            }
        })
    }

    const handleAddCampaign = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCamp.name || !newCamp.postId || newCamp.accounts.length === 0) {
            alert('Vui lòng nhập tên chiến dịch, chọn bài viết và ít nhất 1 tài khoản!')
            return
        }

        try {
            await window.api.createCampaign({
                name: newCamp.name,
                postId: newCamp.postId,
                accounts: newCamp.accounts,
                delayMin: parseInt(newCamp.delayMin.toString()),
                delayMax: parseInt(newCamp.delayMax.toString()),
                scheduleAt: newCamp.scheduleAt ? new Date(newCamp.scheduleAt).toISOString() : null
            })
            setShowAddModal(false)
            setNewCamp({ name: '', postId: '', accounts: [], delayMin: 30, delayMax: 60, scheduleAt: '' })
            loadData()
        } catch (error) {
            console.error('Error adding campaign:', error)
            alert('Lỗi khi thêm chiến dịch!')
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('Bạn chắc chắn muốn xoá Chiến dịch này?')) {
            await window.api.deleteCampaign(id)
            loadData()
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'RUNNING': return <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"><Play className="w-3.5 h-3.5" /> PLAYING</span>
            case 'COMPLETED': return <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> COMPLETED</span>
            case 'STOPPED': return <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"><Square className="w-3.5 h-3.5" /> STOPPED</span>
            case 'ERROR': return <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20"><AlertCircle className="w-3.5 h-3.5" /> ERROR</span>
            default: return <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20"><Calendar className="w-3.5 h-3.5" /> DRAFT / SCHEDULED</span>
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                    <PlaySquare className="h-6 w-6 text-pink-500" /> Quản lý Chiến dịch
                </h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-pink-500 transition-colors">
                    <Plus className="h-4 w-4" />
                    Tạo Chiến Dịch
                </button>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow overflow-hidden">
                <table className="min-w-full divide-y divide-zinc-800 border-b border-zinc-800">
                    <thead className="bg-zinc-900/80">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Tên Chiến Dịch
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Bài đăng (Trích dẫn)
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Tiến độ
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Trạng thái
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Thao tác</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 bg-zinc-900/30">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-4 text-zinc-500">Đang tải...</td></tr>
                        ) : campaigns.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-4 text-zinc-500">Chưa có chiến dịch nào.</td></tr>
                        ) : (
                            campaigns.map((camp) => {
                                const totalAcc = camp.accounts?.length || 0
                                const successAcc = camp.accounts?.filter((a: any) => a.status === 'SUCCESS').length || 0
                                return (
                                    <tr key={camp.id} className="hover:bg-zinc-800/50 transition-colors">
                                        <td className="whitespace-nowrap px-6 py-4 font-medium text-zinc-200">
                                            {camp.name}
                                            {camp.scheduleAt && <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(camp.scheduleAt).toLocaleString()}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-400 max-w-[250px] truncate">
                                            {camp.post?.content || '<Chỉ Media>'}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                                            {successAcc} / {totalAcc}
                                            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2">
                                                <div className="bg-pink-500 h-1.5 rounded-full" style={{ width: `${totalAcc ? (successAcc / totalAcc) * 100 : 0}%` }}></div>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                                            {getStatusBadge(camp.status)}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDelete(camp.id)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                                title="Xoá chiến dịch">
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm pt-10 pb-10">
                    <div className="w-full max-w-3xl rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl relative top-[5vh]">
                        <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-4">
                            <h2 className="text-xl font-bold text-white">Tạo Chiến Dịch Đăng Bài</h2>
                            <button type="button" onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddCampaign} className="space-y-5">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1">Tên Chiến Dịch *</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder:text-zinc-600 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                                            placeholder="VD: Chiến dịch Threads T10"
                                            value={newCamp.name}
                                            onChange={e => setNewCamp({ ...newCamp, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1">Hẹn giờ chạy (Bỏ trống = Chạy ngay)</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder:text-zinc-600 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                                            value={newCamp.scheduleAt}
                                            onChange={e => setNewCamp({ ...newCamp, scheduleAt: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Chọn bài viết (Post ID) *</label>
                                    <select
                                        required
                                        className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                                        value={newCamp.postId}
                                        onChange={e => setNewCamp({ ...newCamp, postId: e.target.value })}
                                    >
                                        <option value="" disabled>-- Chọn Bài viết cần đăng --</option>
                                        {posts.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.content ? (p.content.substring(0, 50) + '...') : '<Chỉ có Media đính kèm>'} | {new Date(p.createdAt).toLocaleDateString()}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1">Delay Tối thiểu (giây)</label>
                                        <input
                                            required type="number" min={1}
                                            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                                            value={newCamp.delayMin}
                                            onChange={e => setNewCamp({ ...newCamp, delayMin: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1">Delay Tối đa (giây)</label>
                                        <input
                                            required type="number" min={1}
                                            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                                            value={newCamp.delayMax}
                                            onChange={e => setNewCamp({ ...newCamp, delayMax: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2 mt-4">Chọn Tài khoản tham gia ({newCamp.accounts.length} đã chọn) *</label>
                                    <div className="border border-zinc-800 rounded-md p-2 bg-zinc-900/50 max-h-[150px] overflow-y-auto space-y-1">
                                        {accounts.length === 0 ? (
                                            <div className="text-zinc-500 text-sm p-2 text-center">Không có tài khoản nào. Vui lòng thêm ở mục "Quản lý Tài Khoản".</div>
                                        ) : accounts.map((acc: any) => (
                                            <label key={acc.id} className="flex items-center gap-2 p-2 hover:bg-zinc-800 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-zinc-700 bg-zinc-800 text-pink-500 focus:ring-pink-500"
                                                    checked={newCamp.accounts.includes(acc.id)}
                                                    onChange={() => handleAccountToggle(acc.id)}
                                                />
                                                <span className="text-zinc-300 text-sm">{acc.username}</span>
                                                <span className={`text-xs ml-auto ${acc.status === 'LIVE' ? 'text-emerald-400' : 'text-red-400'}`}>{acc.status}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="rounded-md px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-pink-500 transition-colors"
                                >
                                    Bắt Đầu Chiến Dịch
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
