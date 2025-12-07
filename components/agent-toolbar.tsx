"use client"

import { Plus, RotateCcw, Settings, ChevronDown } from "lucide-react"
import { useCanvasStore, type Agent } from "@/lib/store"
import { generateId, getSmartPosition } from "@/lib/utils"
import { useState, useEffect } from "react"

export function AgentToolbar() {
  const { addNode, agents, addAgent, resetCanvas, systemPrompt, setSystemPrompt, updateAgent, nodes } = useCanvasStore()
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  const handleAddAgent = (agent: Agent) => {
    const newNodeId = generateId()
    // Position new nodes in center with some randomness
    const preferredX = 500 + Math.random() * 200
    const preferredY = 300 + Math.random() * 200

    const { x, y } = getSmartPosition(
      preferredX,
      preferredY,
      400,
      200, // approximate height
      nodes,
      "any"
    )

    addNode({
      id: newNodeId,
      type: "input",
      x,
      y,
      content: "",
      model: agent.name,
      agentId: agent.id,
      agentColor: agent.color,
      width: 400,
    })
  }

  return (
    <>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-end gap-2 px-2 py-2 bg-[#0a0a0a]/80 backdrop-blur-xl border border-[#333] rounded-2xl shadow-2xl transition-all hover:scale-[1.02] hover:bg-[#0a0a0a]/90">
        <div className="group relative flex flex-col items-center gap-1">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#1a1a1a] border border-[#333] hover:border-[#555] hover:-translate-y-2 transition-all duration-200 hover:bg-[#222] active:scale-95"
          >
            <Settings className="w-5 h-5 text-neutral-400" />
          </button>
          <span className="absolute -top-10 px-2 py-1 bg-black border border-[#333] rounded-md text-xs text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Settings
          </span>
        </div>

        <div className="w-[1px] h-8 bg-[#333] mx-1 self-center" />

        {agents.slice(0, 6).map((agent) => (
          <div key={agent.id} className="group relative flex flex-col items-center gap-1">
            <button
              onClick={() => handleAddAgent(agent)}
              className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-[#1a1a1a] border border-[#333] hover:border-[#555] hover:-translate-y-2 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 active:scale-95"
              style={{ borderColor: agent.color + "40" }}
            >
              <span style={{ color: agent.color }} className="text-xl font-medium">
                ❖
              </span>
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity"
                style={{ backgroundColor: agent.color }}
              />
            </button>
            <span className="absolute -top-10 px-2 py-1 bg-black border border-[#333] rounded-md text-xs text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {agent.name}
            </span>
          </div>
        ))}

        <div className="w-[1px] h-8 bg-[#333] mx-1 self-center" />

        <div className="group relative flex flex-col items-center gap-1">
          <button
            onClick={() => setShowCustomModal(true)}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#1a1a1a] border border-dashed border-[#555] hover:border-[#777] hover:-translate-y-2 transition-all duration-200 hover:bg-[#222] active:scale-95"
          >
            <Plus className="w-5 h-5 text-neutral-400" />
          </button>
          <span className="absolute -top-10 px-2 py-1 bg-black border border-[#333] rounded-md text-xs text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            New Agent
          </span>
        </div>

        <div className="group relative flex flex-col items-center gap-1">
          <button
            onClick={resetCanvas}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#1a1a1a] border border-[#333] hover:border-red-500/50 hover:-translate-y-2 transition-all duration-200 hover:bg-[#222] active:scale-95"
          >
            <RotateCcw className="w-5 h-5 text-neutral-400 group-hover:text-red-400 transition-colors" />
          </button>
          <span className="absolute -top-10 px-2 py-1 bg-black border border-[#333] rounded-md text-xs text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Reset Canvas
          </span>
        </div>
      </div>

      {showCustomModal && <CustomAgentModal onClose={() => setShowCustomModal(false)} onAdd={addAgent} />}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          systemPrompt={systemPrompt}
          onSaveSystemPrompt={setSystemPrompt}
          agents={agents}
          onUpdateAgent={updateAgent}
        />
      )}
    </>
  )
}

function SettingsModal({
  onClose,
  systemPrompt,
  onSaveSystemPrompt,
  agents,
  onUpdateAgent
}: {
  onClose: () => void;
  systemPrompt: string;
  onSaveSystemPrompt: (prompt: string) => void;
  agents: Agent[];
  onUpdateAgent: (id: string, data: Partial<Agent>) => void;
}) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>("global")
  const [currentPrompt, setCurrentPrompt] = useState(systemPrompt)

  // Update local state when selection changes
  useEffect(() => {
    if (selectedAgentId === "global") {
      setCurrentPrompt(systemPrompt)
    } else {
      const agent = agents.find(a => a.id === selectedAgentId)
      setCurrentPrompt(agent?.systemPrompt || "")
    }
  }, [selectedAgentId, systemPrompt, agents])

  const handleSave = () => {
    if (selectedAgentId === "global") {
      onSaveSystemPrompt(currentPrompt)
    } else {
      onUpdateAgent(selectedAgentId, { systemPrompt: currentPrompt })
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[600px] bg-[#0a0a0a] border border-[#333] rounded-xl shadow-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Select Context</label>
            <div className="relative">
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white appearance-none focus:border-[#555] focus:outline-none"
              >
                <option value="global">Global System Prompt (Default)</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">
              {selectedAgentId === "global" ? "Global System Prompt" : "Agent System Prompt"}
              <span className="text-neutral-600 ml-2">
                {selectedAgentId === "global"
                  ? "(Applied to all agents unless overridden)"
                  : "(Overrides global prompt)"}
              </span>
            </label>
            <textarea
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              placeholder={selectedAgentId === "global"
                ? "e.g., You are a helpful assistant. Be concise."
                : "e.g., You are a specialized coding assistant."}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder:text-neutral-600 focus:border-[#555] focus:outline-none resize-none h-[200px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => {
              handleSave()
              onClose()
            }}
            className="flex-1 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition-colors"
          >
            Save & Close
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#1a1a1a] border border-[#333] text-neutral-300 rounded-lg font-medium hover:bg-[#2a2a2a] transition-colors"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1a1a1a] border border-[#333] text-neutral-300 rounded-lg font-medium hover:bg-[#2a2a2a] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function CustomAgentModal({ onClose, onAdd }: { onClose: () => void; onAdd: (agent: Agent) => void }) {
  const [name, setName] = useState("")
  const [color, setColor] = useState("#3b82f6")
  const [description, setDescription] = useState("")

  const handleCreate = () => {
    if (!name.trim()) return

    const newAgent: Agent = {
      id: generateId(),
      name: name.trim(),
      color,
      description: description.trim(),
    }

    onAdd(newAgent)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[480px] bg-[#0a0a0a] border border-[#333] rounded-xl shadow-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Create Custom Agent</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Research Agent"
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder:text-neutral-600 focus:border-[#555] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Agent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 rounded border border-[#333] cursor-pointer"
              />
              <span className="text-sm text-neutral-500 font-mono">{color}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">
              Instructions <span className="text-neutral-600">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this agent does..."
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder:text-neutral-600 focus:border-[#555] focus:outline-none resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex-1 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Agent
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1a1a1a] border border-[#333] text-neutral-300 rounded-lg font-medium hover:bg-[#2a2a2a] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
