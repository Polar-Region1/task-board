import { Search, X } from 'lucide-react'
import { useTaskStore } from '../store/useTaskStore.js'

export default function SearchBar() {
  const searchQuery = useTaskStore((s) => s.searchQuery)
  const setSearchQuery = useTaskStore((s) => s.setSearchQuery)

  return (
    <div className="flex items-center gap-2 bg-card border border-soft rounded-pill px-3 py-1.5 w-72 focus-within:border-accent transition">
      <Search size={14} className="text-muted" />
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="搜索 (输 #标签 名筛选)"
        className="flex-1 bg-transparent outline-none text-xs placeholder:text-muted"
      />
      {searchQuery && (
        <button onClick={() => setSearchQuery('')} className="text-muted hover:text-ink">
          <X size={12} />
        </button>
      )}
    </div>
  )
}
