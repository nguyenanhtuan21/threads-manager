import { useEffect, useState } from 'react'
import { Plus, Trash2, Image as ImageIcon, FileText, X } from 'lucide-react'

export function PostManagement() {
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)

    const [newPostContent, setNewPostContent] = useState('')
    const [newPostMedia, setNewPostMedia] = useState<string[]>([])

    useEffect(() => {
        loadPosts()
    }, [])

    const loadPosts = async () => {
        try {
            setLoading(true)
            const data = await window.api.getPosts()
            setPosts(data)
        } catch (error) {
            console.error('Error loading posts:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUploadMedia = async () => {
        const mediaPaths = await window.api.uploadMedia()
        if (mediaPaths && mediaPaths.length > 0) {
            setNewPostMedia(prev => [...prev, ...mediaPaths])
        }
    }

    const handleRemoveMedia = (indexToRemove: number) => {
        setNewPostMedia(prev => prev.filter((_, idx) => idx !== indexToRemove))
    }

    const handleAddPost = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newPostContent.trim() && newPostMedia.length === 0) {
            alert('Vui lòng nhập nội dung hoặc thêm ảnh/video đính kèm!')
            return
        }

        try {
            await window.api.createPost({
                content: newPostContent,
                mediaUrls: newPostMedia.length > 0 ? JSON.stringify(newPostMedia) : null
            })
            setShowAddModal(false)
            setNewPostContent('')
            setNewPostMedia([])
            loadPosts()
        } catch (error) {
            console.error('Error adding post:', error)
            alert('Lỗi khi thêm bài viết!')
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('Bạn chắc chắn muốn xoá bài viết này? Dữ liệu lịch trình liên quan có thể bị ảnh hưởng.')) {
            await window.api.deletePost(id)
            loadPosts()
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                    <FileText className="h-6 w-6 text-purple-500" /> Quản lý Bài đăng
                </h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 transition-colors">
                    <Plus className="h-4 w-4" />
                    Soạn Bài Mới
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-10 text-zinc-500">Đang tải...</div>
                ) : posts.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-zinc-500">Chưa có bài đăng nào. Hãy soạn mới.</div>
                ) : (
                    posts.map(post => {
                        const mediaList = post.mediaUrls ? JSON.parse(post.mediaUrls) : []
                        return (
                            <div key={post.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow flex flex-col relative overflow-hidden group">
                                <div className="p-5 flex-1 space-y-3">
                                    <p className="text-zinc-300 text-sm whitespace-pre-wrap line-clamp-4">
                                        {post.content || <span className="italic text-zinc-500">Không có văn bản</span>}
                                    </p>

                                    {mediaList.length > 0 && (
                                        <div className="flex items-center gap-2 mt-4 text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-1 rounded inline-flex">
                                            <ImageIcon className="h-3.5 w-3.5" />
                                            {mediaList.length} Media đính kèm
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-zinc-800/80 bg-zinc-950/50 p-3 flex justify-between items-center text-xs text-zinc-500">
                                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                    <button
                                        onClick={() => handleDelete(post.id)}
                                        className="p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-400 text-zinc-400 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Xóa bài viết"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Soạn Bài Đăng Mới</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddPost} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Nội dung bài viết</label>
                                <textarea
                                    rows={5}
                                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder:text-zinc-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                                    placeholder="Nhập nội dung bạn muốn Threads..."
                                    value={newPostContent}
                                    onChange={e => setNewPostContent(e.target.value)}
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-zinc-400">Đính kèm (Tùy chọn)</label>
                                    <button
                                        type="button"
                                        onClick={handleUploadMedia}
                                        className="text-xs text-purple-400 flex items-center gap-1 hover:text-purple-300 transition-colors"
                                    >
                                        <Plus className="h-3 w-3" /> Thêm File
                                    </button>
                                </div>

                                {newPostMedia.length > 0 && (
                                    <div className="grid grid-cols-4 gap-2 mt-2">
                                        {newPostMedia.map((mediaUrl, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-zinc-800 border border-zinc-700/50 group">
                                                {/* Hiển thị cover nếu là ảnh, hiển thị placeholder nếu là video.. v.v dựa vào đuôi */}
                                                <img src={mediaUrl} className="w-full h-full object-cover opacity-80" alt="Preview" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveMedia(idx)}
                                                    className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                    className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 transition-colors"
                                >
                                    Lưu Bài Đăng
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
