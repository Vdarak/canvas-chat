"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Search, Menu, CheckCircle2, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"
import { Node } from "./node"
import { ConnectionLine } from "./connection-line"
import { Minimap } from "./minimap"
import { AgentToolbar } from "./agent-toolbar"
import { useCanvasStore } from "@/lib/store"

import { Sidebar } from "./sidebar"

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const { nodes, connections } = useCanvasStore()

  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow panning if clicking on the container or the SVG background
    // We check if the target is NOT an interactive element inside a node
    const target = e.target as HTMLElement
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest(".node-content") ||
      target.closest(".drag-handle")
    ) {
      return
    }

    setIsPanning(true)
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isPanning) {
        setPosition((prev) => ({
          x: prev.x + e.movementX,
          y: prev.y + e.movementY,
        }))
      }
    },
    [isPanning],
  )

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const centerNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) return

      // Calculate center of viewport
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // Target position (center of viewport)
      // We want: node.x * scale + position.x + (node.width / 2) * scale = viewportWidth / 2
      // position.x = viewportWidth / 2 - (node.x + node.width / 2) * scale

      const nodeWidth = node.width || 450
      const nodeHeight = node.height || 200

      const newX = viewportWidth / 2 - (node.x + nodeWidth / 2) * scale
      const newY = viewportHeight / 2 - (node.y + nodeHeight / 2) * scale

      setPosition({ x: newX, y: newY })
    },
    [nodes, scale],
  )

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const zoomSensitivity = 0.001
      const newScale = Math.min(Math.max(0.2, scale - e.deltaY * zoomSensitivity), 3)

      // Calculate mouse position relative to the container
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      // Calculate the point on the canvas that is currently under the mouse
      // canvasX = (mouseX - position.x) / scale
      const canvasX = (mouseX - position.x) / scale
      const canvasY = (mouseY - position.y) / scale

      // Calculate new position such that the same canvas point is under the mouse at newScale
      // mouseX = canvasX * newScale + newPosition.x
      // newPosition.x = mouseX - canvasX * newScale
      const newX = mouseX - canvasX * newScale
      const newY = mouseY - canvasY * newScale

      setScale(newScale)
      setPosition({ x: newX, y: newY })
    } else {
      setPosition((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }))
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full bg-[#09090b] overflow-hidden",
        isPanning ? "cursor-grabbing" : "cursor-default"
      )}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
          backgroundSize: `${40 * scale}px ${40 * scale}px`,
          backgroundPosition: `${position.x}px ${position.y}px`,
        }}
      />

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <TopBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <AgentToolbar />
      <BottomControls scale={scale} setScale={setScale} />

      <div
        className="canvas-container absolute inset-0 transform-gpu origin-top-left"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
        }}
      >
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
          {connections.map((conn) => (
            <ConnectionLine key={conn.id} connection={conn} nodes={nodes} />
          ))}
        </svg>

        {nodes.map((node) => (
          <Node key={node.id} node={node} scale={scale} />
        ))}
      </div>

      <Minimap nodes={nodes} viewport={{ x: position.x, y: position.y, scale }} />
    </div>
  )
}

function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <>
      <div className="absolute top-4 left-4 flex items-center gap-2 z-50">
        <button
          onClick={onToggleSidebar}
          className="p-2 bg-[#1c1c1c] border border-[#333] rounded-md hover:bg-[#2a2a2a] transition-colors"
        >
          <Menu className="w-5 h-5 text-neutral-400" />
        </button>

        <div className="flex items-center gap-2 px-3 py-2 bg-[#1c1c1c] border border-[#333] rounded-md">
          <img src="/Hierarchy.svg" alt="Canvas Chat Logo" className="w-5 h-5" />
          <span className="text-sm font-bold text-neutral-200">Canvas Chat</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-[#1c1c1c] border border-[#333] rounded-md">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium text-neutral-400">Saved</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
        <button className="p-2 bg-[#1c1c1c] border border-[#333] rounded-md hover:bg-[#2a2a2a] transition-colors">
          <Search className="w-5 h-5 text-neutral-400" />
        </button>
        <button className="p-2 bg-[#1c1c1c] border border-[#333] rounded-md hover:bg-[#2a2a2a] transition-colors">
          <LayoutGrid className="w-5 h-5 text-neutral-400" />
        </button>
      </div>
    </>
  )
}

function BottomControls({ scale, setScale }: { scale: number; setScale: (s: number) => void }) {
  return <div className="absolute bottom-4 right-4 z-50 hidden md:flex items-center gap-2 mr-[200px]"></div>
}
