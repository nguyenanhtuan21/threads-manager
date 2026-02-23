import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface AppLayoutProps {
    children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden min-w-0">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-900/50 p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
