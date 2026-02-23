import { useEffect, useState } from 'react'
import { Plus, Trash2, CheckCircle2, XCircle, AlertCircle, FileUp, FileDown, PlaySquare } from 'lucide-react'

export function AccountManagement() {
    const [accounts, setAccounts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadAccounts()
    }, [])

    const loadAccounts = async () => {
        try {
            setLoading(true)
            const data = await window.api.getAccounts()
            setAccounts(data)
        } catch (error) {
            console.error('Error loading accounts:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddDemoAccount = async () => {
        const fakeUsername = 'user_' + Math.random().toString(36).substring(7)
        await window.api.createAccount({
            username: fakeUsername,
            password: 'password123',
            status: 'LIVE'
        })
        loadAccounts()
    }

    const handleImport = async () => {
        try {
            const result = await window.api.importAccounts()
            if (result.success) {
                alert(`Đã import thành công ${result.count} tài khoản!`)
                loadAccounts()
            } else if (result.error) {
                alert(`Lỗi import: ${result.error}`)
            }
        } catch (error) {
            console.error(error)
            alert('Đã xảy ra lỗi hệ thống khi import!')
        }
    }

    const handleExport = async () => {
        try {
            const result = await window.api.exportAccounts()
            if (result) {
                alert('Export thành công!')
            }
        } catch (error) {
            console.error(error)
            alert('Đã xảy ra lỗi khi export!')
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('Bạn chắc chắn muốn xoá tài khoản này?')) {
            await window.api.deleteAccount(id)
            loadAccounts()
        }
    }

    const handleCheckLive = async (id: string) => {
        try {
            await window.api.startCheckLive(id)
            loadAccounts() // Reload trạng thái
        } catch (e) {
            console.error(e)
            alert('Lỗi kiểm tra account!')
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'LIVE': return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            case 'DIE': return <XCircle className="h-4 w-4 text-red-500" />
            default: return <AlertCircle className="h-4 w-4 text-yellow-500" />
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-white">Quản lý Tài khoản</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleAddDemoAccount}
                        className="flex items-center gap-2 rounded-md bg-zinc-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-700 transition-colors">
                        <Plus className="h-4 w-4" />
                        Thêm Demo
                    </button>

                    <button
                        onClick={handleImport}
                        className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors">
                        <FileUp className="h-4 w-4" />
                        Import (Txt/Csv)
                    </button>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors">
                        <FileDown className="h-4 w-4" />
                        Export Selected
                    </button>
                </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow overflow-hidden">
                <table className="min-w-full divide-y divide-zinc-800 border-b border-zinc-800">
                    <thead className="bg-zinc-900/80">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Username
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Password
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Proxy
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Thao tác</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 bg-zinc-900/30">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-4 text-zinc-500">Đang tải...</td></tr>
                        ) : accounts.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-4 text-zinc-500">Chưa có tài khoản nào.</td></tr>
                        ) : (
                            accounts.map((acc) => (
                                <tr key={acc.id} className="hover:bg-zinc-800/50 transition-colors">
                                    <td className="whitespace-nowrap px-6 py-4 font-medium text-zinc-200">
                                        {acc.username}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                                        ••••••••
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm flex items-center gap-2">
                                        {getStatusIcon(acc.status)}
                                        <span className={acc.status === 'LIVE' ? 'text-emerald-400' : 'text-zinc-400'}>{acc.status}</span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-400">
                                        {acc.proxy ? `${acc.proxy.host}:${acc.proxy.port}` : 'None'}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => handleCheckLive(acc.id)}
                                                className="text-blue-400 flex items-center gap-1 hover:text-blue-300 transition-colors"
                                                title="Check Live Account">
                                                <PlaySquare className="h-4 w-4" /> <span className="text-xs">Check</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(acc.id)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                                title="Xoá tài khoản">
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
