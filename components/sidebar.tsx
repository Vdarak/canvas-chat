"use client"

import { useState, useEffect } from "react"
import { X, MessageSquare, Trash2, Edit2, Check, Plus } from "lucide-react"
import { useCanvasStore, type NodeData, type Connection } from "@/lib/store"
import { cn } from "@/lib/utils"

interface HistoryItem {
    id: string
    name: string
    timestamp: number
    nodes: NodeData[]
    connections: Connection[]
}

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { nodes, connections, setCanvas, resetCanvas } = useCanvasStore()
    const [history, setHistory] = useState<HistoryItem[]>([])
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState("")
    const [currentCanvasId, setCurrentCanvasId] = useState<string | null>(null)

    // Load history from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("canvas-history")
        if (saved) {
            try {
                setHistory(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to parse history", e)
            }
        }
    }, [])

    // Save history to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("canvas-history", JSON.stringify(history))
    }, [history])

    const saveCurrentCanvas = () => {
        if (nodes.length <= 1 && nodes[0].content === "") return // Don't save empty default canvas

        const timestamp = Date.now()

        if (currentCanvasId) {
            // Update existing
            setHistory(prev => prev.map(item =>
                item.id === currentCanvasId
                    ? { ...item, nodes, connections, timestamp }
                    : item
            ))
        } else {
            // Create new
            const newId = crypto.randomUUID()
            const name = `Canvas ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`
            const newItem: HistoryItem = {
                id: newId,
                name,
                timestamp,
                nodes,
                connections
            }
            setHistory(prev => [newItem, ...prev])
            setCurrentCanvasId(newId)
        }
    }

    // Auto-save current canvas periodically or on change? 
    // For now, let's just save when switching or manually?
    // The user said "saves the entire canvas... allow the user to name it".
    // Let's add a "Save" button or auto-save. 
    // Actually, let's auto-save the *current* canvas to history if it has an ID.
    useEffect(() => {
        if (currentCanvasId && isOpen) {
            // Update the current history item with latest state
            setHistory(prev => prev.map(item =>
                item.id === currentCanvasId
                    ? { ...item, nodes, connections, timestamp: Date.now() }
                    : item
            ))
        }
    }, [nodes, connections, currentCanvasId, isOpen])

    const loadCanvas = (item: HistoryItem) => {
        setCanvas(item.nodes, item.connections)
        setCurrentCanvasId(item.id)
        // onClose() // Optional: close sidebar on load
    }

    const startNewCanvas = () => {
        saveCurrentCanvas() // Save current before resetting
        resetCanvas()
        setCurrentCanvasId(null)
    }

    const deleteCanvas = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setHistory(prev => prev.filter(item => item.id !== id))
        if (currentCanvasId === id) {
            setCurrentCanvasId(null)
        }
    }

    const startEditing = (item: HistoryItem, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingId(item.id)
        setEditName(item.name)
    }

    const saveName = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (editingId) {
            setHistory(prev => prev.map(item =>
                item.id === editingId ? { ...item, name: editName } : item
            ))
            setEditingId(null)
        }
    }

    return (
        <div
            className={cn(
                "fixed inset-y-0 left-0 z-[60] w-80 bg-[#0a0a0a] border-r border-[#333] transform transition-transform duration-300 ease-in-out flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}
        >
            <div className="flex items-center justify-between p-4 border-b border-[#333]">
                <h2 className="text-lg font-semibold text-white">Canvas History</h2>
                <button onClick={onClose} className="p-1 hover:bg-[#1a1a1a] rounded text-neutral-400 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4 border-b border-[#333]">
                <button
                    onClick={startNewCanvas}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Canvas
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {history.length === 0 ? (
                    <div className="text-center text-neutral-500 mt-10 text-sm">
                        No saved canvases yet.
                    </div>
                ) : (
                    history.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => loadCanvas(item)}
                            className={cn(
                                "group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border border-transparent",
                                currentCanvasId === item.id
                                    ? "bg-[#1a1a1a] border-[#333]"
                                    : "hover:bg-[#1a1a1a] hover:border-[#222]"
                            )}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <MessageSquare className="w-4 h-4 text-neutral-500 shrink-0" />

                                {editingId === item.id ? (
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="bg-[#0a0a0a] border border-[#333] rounded px-1 py-0.5 text-sm text-white w-full outline-none focus:border-blue-500"
                                        autoFocus
                                    />
                                ) : (
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-sm text-neutral-300 truncate font-medium">{item.name}</span>
                                        <span className="text-xs text-neutral-600 truncate">
                                            {new Date(item.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {editingId === item.id ? (
                                    <button
                                        onClick={saveName}
                                        className="p-1 hover:bg-[#2a2a2a] rounded text-green-400"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={(e) => startEditing(item, e)}
                                            className="p-1 hover:bg-[#2a2a2a] rounded text-neutral-500 hover:text-white"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => deleteCanvas(item.id, e)}
                                            className="p-1 hover:bg-[#2a2a2a] rounded text-neutral-500 hover:text-red-400"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {currentCanvasId && (
                <div className="p-4 border-t border-[#333] bg-[#0f0f0f]">
                    <div className="text-xs text-neutral-500 mb-1">Current Canvas</div>
                    <div className="text-sm font-medium text-white truncate">
                        {history.find(h => h.id === currentCanvasId)?.name || "Untitled"}
                    </div>
                </div>
            )}
        </div>
    )
}
