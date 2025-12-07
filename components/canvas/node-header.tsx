import { Plus, LinkIcon, MoreHorizontal } from "lucide-react"

export function NodeHeader({ model }: { model?: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-transparent group-hover:border-[#222] transition-colors">
      <div className="flex items-center gap-2">
        <div className="px-2 py-1 rounded-md bg-[#1a1a1a] border border-[#333] flex items-center gap-2 text-xs text-neutral-300 font-medium cursor-pointer hover:border-neutral-500 transition-colors">
          <span className="text-blue-500">❖</span>
          {model || "Agent 1"}
        </div>
        <button className="p-1 hover:bg-[#1a1a1a] rounded text-neutral-500 hover:text-white transition-colors">
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button className="p-1 hover:bg-[#1a1a1a] rounded text-neutral-500 hover:text-white transition-colors">
          <LinkIcon className="w-3.5 h-3.5" />
        </button>
      </div>
      <button className="p-1 hover:bg-[#1a1a1a] rounded text-neutral-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  )
}
