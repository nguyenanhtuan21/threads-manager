import { useEffect, useState } from 'react'
import { Plus, Trash2, Globe, ShieldCheck, ShieldAlert, X } from 'lucide-react'

export function ProxyManagement() {
    const [proxies, setProxies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [newProxy, setNewProxy] = useState({ host: '', port: '', protocol: 'http', username: '', password: '' })

    useEffect(() => {
        loadProxies()
    }, [])

    const loadProxies = async () => {
        try {
            setLoading(true)
            const data = await window.api.getProxies()
            setProxies(data)
        } catch (error) {
            console.error('Error loading proxies:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddProxy = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await window.api.createProxy({
                host: newProxy.host,
                port: parseInt(newProxy.port) || 80,
                protocol: newProxy.protocol,
                username: newProxy.username || null,
                password: newProxy.password || null,
                status: 'ACTIVE'
            })
            setShowAddModal(false)
            setNewProxy({ host: '', port: '', protocol: 'http', username: '', password: '' })
            loadProxies()
        } catch (error) {
            console.error('Error adding proxy:', error)
            alert('Lỗi khi thêm Proxy!')
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('Bạn chắc chắn muốn xoá Proxy này?')) {
            await window.api.deleteProxy(id)
            loadProxies()
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                    <Globe className="h-6 w-6 text-blue-500" /> Quản lý Proxy
                </h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors">
                        <Plus className="h-4 w-4" />
                        Thêm Proxy
                    </button>
                </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow overflow-hidden">
                <table className="min-w-full divide-y divide-zinc-800 border-b border-zinc-800">
                    <thead className="bg-zinc-900/80">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Proxy (Host:Port)
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Giao thức
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Trạng thái
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                T.khoản dùng
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Thao tác</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 bg-zinc-900/30">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-4 text-zinc-500">Đang tải...</td></tr>
                        ) : proxies.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-4 text-zinc-500">Chưa có proxy nào.</td></tr>
                        ) : (
                            proxies.map((px) => (
                                <tr key={px.id} className="hover:bg-zinc-800/50 transition-colors">
                                    <td className="whitespace-nowrap px-6 py-4 font-mono text-zinc-200">
                                        {px.host}:{px.port}
                                        {px.username && <span className="text-zinc-500 text-xs block">Auth: {px.username}</span>}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-400 uppercase">
                                        {px.protocol}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm flex items-center gap-2">
                                        {px.status === 'ACTIVE'
                                            ? <><ShieldCheck className="h-4 w-4 text-emerald-400" /> <span className="text-emerald-400">ACTIVE</span></>
                                            : <><ShieldAlert className="h-4 w-4 text-red-500" /> <span className="text-red-500">{px.status}</span></>}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-400">
                                        {px.accounts?.length || 0} tài khoản
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleDelete(px.id)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                            title="Xoá proxy">
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Thêm Proxy */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Thêm Proxy Mới</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddProxy} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Host/IP *</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="192.168.1.1"
                                        value={newProxy.host}
                                        onChange={e => setNewProxy({ ...newProxy, host: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Port *</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="8080"
                                        value={newProxy.port}
                                        onChange={e => setNewProxy({ ...newProxy, port: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Giao thức</label>
                                <select
                                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={newProxy.protocol}
                                    onChange={e => setNewProxy({ ...newProxy, protocol: e.target.value })}
                                >
                                    <option value="http">HTTP</option>
                                    <option value="https">HTTPS</option>
                                    <option value="socks5">SOCKS5</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Username (Tuỳ chọn)</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={newProxy.username}
                                        onChange={e => setNewProxy({ ...newProxy, username: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Password (Tuỳ chọn)</label>
                                    <input
                                        type="password"
                                        className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={newProxy.password}
                                        onChange={e => setNewProxy({ ...newProxy, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="rounded-md px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
                                >
                                    Lưu Proxy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
