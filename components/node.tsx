"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { Copy, CornerDownRight, ArrowRight, Plus, LinkIcon, GitBranch, Trash2, Maximize2, Minimize2, GripHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCanvasStore, type NodeData } from "@/lib/store"
import { generateId, getSmartPosition } from "@/lib/utils"
import { generateResponse } from "@/app/actions"
import { createPortal } from "react-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface NodeProps {
  node: NodeData
  scale: number
}


export function Node({ node, scale }: NodeProps) {
  const { updateNodePosition, addNode, addConnection, updateNode, removeNode, toggleNodeExpanded, systemPrompt, agents } = useCanvasStore()
  const [isDragging, setIsDragging] = useState(false)
  const [inputValue, setInputValue] = useState(node.content)
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null)
  const nodeRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [inputValue])

  // Drag logic - now only triggers on the drag handle
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging from the grip handle
    if (!(e.target as HTMLElement).closest(".drag-handle")) return

    e.stopPropagation()
    e.preventDefault()

    const startX = e.clientX
    const startY = e.clientY
    const startNodeX = node.x
    const startNodeY = node.y
    setIsDragging(true)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / scale
      const dy = (moveEvent.clientY - startY) / scale
      updateNodePosition(node.id, startNodeX + dx, startNodeY + dy)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  const handleTextSelection = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent canvas panning
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !contentRef.current?.contains(selection.anchorNode)) {
      setSelection(null)
      return
    }

    const text = selection.toString()
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    // Calculate position relative to the viewport, but we'll render in a portal
    setSelection({
      text,
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
  }

  const handleBranch = (quote?: string) => {
    const newNodeId = generateId()
    const nodes = useCanvasStore.getState().nodes

    // Ideal position: to the right
    const preferredX = node.x + 600
    const preferredY = node.y

    const { x, y } = getSmartPosition(
      preferredX,
      preferredY,
      450, // default width
      200, // default height
      nodes,
      "right"
    )

    addNode({
      id: newNodeId,
      type: "input",
      x,
      y,
      content: "",
      model: node.model,
      agentId: node.agentId,
      agentColor: node.agentColor,
      sourceId: node.id,
      contextQuote: quote,
    })

    addConnection({
      id: generateId(),
      fromId: node.id,
      toId: newNodeId,
      fromAnchor: "right",
      toAnchor: "left",
      color: node.agentColor,
    })

    setSelection(null)
  }

  // Submit to Gemini
  const handleSubmit = async (overrideContent?: string) => {
    const contentToSubmit = overrideContent || inputValue
    if (!contentToSubmit.trim()) return

    if (!overrideContent) {
      updateNode(node.id, { content: contentToSubmit })
    }

    const responseId = generateId()
    const nodes = useCanvasStore.getState().nodes

    // Calculate vertical position based on current node height
    const currentHeight = nodeRef.current?.offsetHeight || 200
    const verticalBuffer = 100 // Increased buffer

    // Ideal position: below
    const preferredX = node.x
    const preferredY = node.y + currentHeight + verticalBuffer

    const { x, y } = getSmartPosition(
      preferredX,
      preferredY,
      450, // default width
      200, // default height (approx for loading)
      nodes,
      "bottom"
    )

    addNode({
      id: responseId,
      type: "loading",
      x,
      y,
      content: "",
      model: node.model,
      agentId: node.agentId,
      agentColor: node.agentColor,
      sourceId: node.id,
      isStreaming: true
    })

    addConnection({
      id: generateId(),
      fromId: node.id,
      toId: responseId,
      fromAnchor: "bottom",
      toAnchor: "top",
      color: node.agentColor,
    })

    // Call Gemini
    try {
      const agent = agents.find(a => a.id === node.agentId)
      const activeSystemPrompt = agent?.systemPrompt || systemPrompt

      const response = await generateResponse(contentToSubmit, node.contextQuote, undefined, activeSystemPrompt)

      updateNode(responseId, {
        type: "response",
        content: response,
        isStreaming: false
      })
    } catch (error) {
      updateNode(responseId, {
        type: "response",
        content: "Error generating response. Please try again.",
        isStreaming: false
      })
    }
  }

  const handleContinue = async (text: string) => {
    // Create a new INPUT node connected to this response
    const newNodeId = generateId()
    const currentHeight = nodeRef.current?.offsetHeight || 200
    const nodes = useCanvasStore.getState().nodes

    // Ideal position: below
    const preferredX = node.x
    const preferredY = node.y + currentHeight + 50

    const { x, y } = getSmartPosition(
      preferredX,
      preferredY,
      450,
      200,
      nodes,
      "bottom"
    )

    addNode({
      id: newNodeId,
      type: "input",
      x,
      y,
      content: text,
      model: node.model,
      agentId: node.agentId,
      agentColor: node.agentColor,
      sourceId: node.id
    })

    addConnection({
      id: generateId(),
      fromId: node.id,
      toId: newNodeId,
      fromAnchor: "bottom",
      toAnchor: "top",
      color: node.agentColor
    })
  }

  useEffect(() => {
    if (nodeRef.current) {
      updateNode(node.id, {
        width: nodeRef.current.offsetWidth,
        height: nodeRef.current.offsetHeight,
      })
    }
  }, [node.content, node.type, node.contextQuote, node.expanded, inputValue])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0])
    }
  }

  return (
    <div
      ref={nodeRef}
      className={cn(
        "absolute flex flex-col shadow-2xl group",
        !isDragging && "transition-all duration-200",
        node.expanded ? "z-50" : "z-10",
        node.expanded ? "w-auto min-w-[600px] max-w-[1000px]" : "w-[450px]",
      )}
      style={{
        left: node.x,
        top: node.y,
        touchAction: "none",
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className={cn(
          "relative rounded-2xl border border-[#333] bg-[#09090b] overflow-hidden flex flex-col transition-all duration-300",
          node.type === "response" ? "p-0" : "p-1",
          node.expanded ? "h-auto" : "h-auto max-h-[600px]" // Removed max-h constraint for expanded
        )}
      >
        {/* Header / Drag Handle Area */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#222] bg-[#09090b]">
          <div className="flex items-center gap-2">
            <div
              className="drag-handle cursor-grab active:cursor-grabbing p-1 hover:bg-[#1a1a1a] rounded text-neutral-500 hover:text-white transition-colors"
              title="Drag to move"
            >
              <GripHorizontal className="w-4 h-4" />
            </div>

            {node.model && (
              <div className="flex items-center gap-2">
                <span style={{ color: node.agentColor }}>❖</span>
                <span className="text-sm font-medium text-neutral-300">{node.model}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {node.type === "response" && (
              <>
                <button
                  onClick={() => toggleNodeExpanded(node.id)}
                  className="p-1.5 hover:bg-[#1a1a1a] rounded text-neutral-500 hover:text-white transition-colors"
                  title={node.expanded ? "Collapse" : "Expand"}
                >
                  {node.expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button className="p-1.5 hover:bg-[#1a1a1a] rounded text-neutral-500 hover:text-white transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button
              onClick={() => removeNode(node.id)}
              className="p-1.5 hover:bg-red-500/10 rounded text-neutral-500 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {node.contextQuote && (
          <div
            className="mx-3 mt-2 mb-1 px-3 py-2 border-l-2 bg-[#1a1a1a]/50 rounded-r-md shrink-0"
            style={{ borderColor: node.agentColor }}
          >
            <div className="flex items-center gap-2 mb-1 text-xs text-neutral-500">
              <CornerDownRight className="w-3 h-3" />
              <span>Replying to selection</span>
            </div>
            <p className="text-sm text-neutral-400 line-clamp-2 italic">"{node.contextQuote}"</p>
          </div>
        )}

        <div className={cn("p-4 pt-2 overflow-y-auto custom-scrollbar", node.expanded ? "flex-1" : "")}>
          {node.type === "input" ? (
            <div className="relative flex flex-col gap-2">
              <textarea
                ref={textareaRef}
                className="w-full bg-transparent text-lg text-neutral-200 placeholder:text-neutral-600 outline-none resize-none min-h-[60px] max-h-[400px]"
                placeholder="Ask your media companion..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                autoFocus
              />

              {attachedFile && (
                <div className="flex items-center gap-2 p-2 bg-[#1a1a1a] rounded-md w-fit">
                  <span className="text-xs text-neutral-300">{attachedFile.name}</span>
                  <button onClick={() => setAttachedFile(null)} className="text-neutral-500 hover:text-white">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <div className="relative">
                  <input
                    type="file"
                    id={`file-${node.id}`}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor={`file-${node.id}`}
                    className="p-2 hover:bg-[#1a1a1a] rounded-md text-neutral-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </label>
                </div>

                <button
                  onClick={() => handleSubmit()}
                  disabled={!inputValue.trim()}
                  className="p-2 bg-white rounded-full text-black hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : node.type === "loading" ? (
            <div className="flex items-center gap-3 py-4 text-neutral-500">
              <div className="animate-spin w-4 h-4 border-2 border-neutral-500 border-t-transparent rounded-full" />
              <span className="text-sm">Generating response...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div
                ref={contentRef}
                onMouseUp={handleTextSelection}
                // Added node-content class for canvas drag exclusion
                className="node-content prose prose-invert prose-p:text-neutral-300 prose-p:leading-relaxed max-w-none text-[15px]"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {node.content}
                </ReactMarkdown>
              </div>

              {/* Continue Chat Input */}
              <div className="mt-4 pt-4 border-t border-[#222]">
                <ContinueInput onContinue={handleContinue} />
              </div>
            </div>
          )}
        </div>
      </div>

      {selection && createPortal(
        <div
          className="fixed z-[100] flex items-center gap-2 px-2 py-1 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl animate-in fade-in zoom-in duration-200"
          style={{
            left: selection.x,
            top: selection.y - 40,
            transform: "translateX(-50%)",
          }}
        >
          <button
            onClick={() => handleBranch(selection.text)}
            className="flex items-center gap-1.5 text-xs font-medium text-white hover:text-blue-400 transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5" />
            Branch
          </button>
        </div>,
        document.body
      )}

      {node.type === "response" && (
        <div className={cn(
          "absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 transition-opacity",
          node.expanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <button
            onClick={() => handleBranch()}
            className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg hover:bg-[#2a2a2a] transition-colors text-sm font-medium text-white"
          >
            <GitBranch className="w-4 h-4" />
            Branch
          </button>
        </div>
      )}
    </div>
  )
}

function ContinueInput({ onContinue }: { onContinue: (text: string) => void }) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [value])

  const handleSubmit = () => {
    if (!value.trim()) return
    onContinue(value)
    setValue("")
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        placeholder="Continue asking..."
        className="w-full bg-[#111] rounded-lg px-3 py-2 pr-10 text-sm text-neutral-300 placeholder:text-neutral-600 outline-none resize-none min-h-[40px] border border-[#222] focus:border-[#444] transition-colors"
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim()}
        className="absolute bottom-2 right-2 p-1 hover:bg-[#222] rounded text-neutral-500 hover:text-white transition-colors disabled:opacity-50"
      >
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
