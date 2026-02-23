import { Link } from 'react-router-dom'
import {
    LayoutDashboard,
    Users,
    Send,
    Activity,
    Database,
    Globe,
    Settings,
    PlusCircle
} from 'lucide-react'
import { cn } from '@renderer/lib/utils'

interface SidebarItemProps {
    icon: React.ElementType
    label: string
    to: string
    active?: boolean
}

function SidebarItem({ icon: Icon, label, to, active }: SidebarItemProps) {
    return (
        <Link
            to={to}
            className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:text-white',
                active ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50'
            )}
        >
            <Icon className="h-5 w-5" />
            {label}
        </Link>
    )
}

export function Sidebar() {
    return (
        <div className="flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 p-4 text-zinc-300">
            <div className="mb-8 pl-1">
                <h2 className="text-xl font-bold text-white tracking-tight">Threads<span className="text-blue-500">Manager</span></h2>
            </div>

            <div className="mb-6">
                <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors">
                    <PlusCircle className="h-5 w-5" />
                    New Task
                </button>
            </div>

            <nav className="flex-1 space-y-1.5">
                <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" active />
                <SidebarItem icon={Users} label="Quản lý tài khoản" to="/accounts" />
                <SidebarItem icon={Send} label="Quản lý bài đăng" to="/posts" />
                <SidebarItem icon={Activity} label="Tương tác" to="/interactions" />
                <SidebarItem icon={Globe} label="Nuôi tài khoản" to="/farming" />
                <SidebarItem icon={Database} label="Quét dữ liệu" to="/scraper" />
                <SidebarItem icon={Globe} label="Quản lý Proxy" to="/proxies" />
            </nav>

            <div className="mt-auto pt-4 border-t border-zinc-800">
                <SidebarItem icon={Settings} label="Cấu hình" to="/settings" />
            </div>
        </div>
    )
}
