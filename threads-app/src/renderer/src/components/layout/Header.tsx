import { Bell, Search, UserCircle } from 'lucide-react'

export function Header() {
    return (
        <header className="flex h-14 items-center gap-4 border-b border-zinc-800 bg-zinc-950/50 px-6 backdrop-blur-sm">
            <div className="flex flex-1 items-center gap-4">
                <form className="relative flex-1 sm:max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                        type="search"
                        placeholder="Search accounts, proxies..."
                        className="w-full bg-zinc-900 rounded-md border border-zinc-800 pl-9 pr-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                </form>
            </div>
            <div className="flex items-center gap-4">
                <button className="relative text-zinc-400 hover:text-white transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                </button>
                <div className="flex items-center gap-2 border-l border-zinc-800 pl-4 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
                        <UserCircle className="h-5 w-5 text-zinc-400" />
                    </div>
                    <span className="text-sm font-medium text-zinc-200">Admin</span>
                </div>
            </div>
        </header>
    )
}
