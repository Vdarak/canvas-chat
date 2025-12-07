import { create } from "zustand"

export type NodeType = "input" | "response" | "loading"

export interface Agent {
  id: string
  name: string
  color: string
  description?: string
  systemPrompt?: string // Added for agent-specific system prompt
}

export const PREDEFINED_AGENTS: Agent[] = [
  { id: "agent-1", name: "Agent 1", color: "#3b82f6" }, // blue
  { id: "agent-2", name: "Agent 2", color: "#8b5cf6" }, // purple
  { id: "agent-3", name: "Agent 3", color: "#10b981" }, // green
  { id: "agent-4", name: "Agent 4", color: "#f59e0b" }, // amber
  { id: "agent-5", name: "Agent 5", color: "#ef4444" }, // red
  { id: "agent-6", name: "Agent 6", color: "#ec4899" }, // pink
]

export interface NodeData {
  id: string
  type: NodeType
  x: number
  y: number
  content: string
  model?: string
  agentId?: string // Added to track which agent this node belongs to
  agentColor?: string // Added to store agent color for styling
  sourceId?: string
  contextQuote?: string
  isStreaming?: boolean // Added to show typing effect
  expanded?: boolean // Added for expand/collapse feature
  width?: number
  height?: number
}

export interface Connection {
  id: string
  fromId: string
  toId: string
  fromAnchor?: "bottom" | "right" | "left" | "top"
  toAnchor?: "top" | "left" | "right" | "bottom"
  color?: string // Added to support colored connections per agent
}

interface CanvasState {
  nodes: NodeData[]
  connections: Connection[]
  selectedNodeId: string | null
  agents: Agent[] // Unified agents list
  systemPrompt: string // Added for global system prompt

  addNode: (node: NodeData) => void
  updateNode: (id: string, data: Partial<NodeData>) => void
  updateNodeContent: (id: string, content: string) => void // Optimized for streaming
  updateNodePosition: (id: string, x: number, y: number) => void
  removeNode: (id: string) => void // Added for delete feature
  toggleNodeExpanded: (id: string) => void // Added for expand feature
  addConnection: (connection: Connection) => void
  selectNode: (id: string | null) => void
  addAgent: (agent: Agent) => void // Renamed from addCustomAgent
  updateAgent: (id: string, data: Partial<Agent>) => void // Added to update agent details
  setSystemPrompt: (prompt: string) => void // Added to update system prompt
  resetCanvas: () => void
  setCanvas: (nodes: NodeData[], connections: Connection[]) => void // Added for loading history
}

export const useCanvasStore = create<CanvasState>((set) => ({
  nodes: [
    {
      id: "1",
      type: "input",
      x: 600,
      y: 400,
      content: "",
      model: "Agent 1",
      agentId: "agent-1",
      agentColor: "#3b82f6",
      width: 400,
    },
  ],
  connections: [],
  selectedNodeId: null,
  agents: PREDEFINED_AGENTS, // Initialize with predefined
  systemPrompt: "",

  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  updateNode: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...data } : n)),
    })),
  updateNodeContent: (id, content) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, content } : n)),
    })),
  updateNodePosition: (id, x, y) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    })),
  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      connections: state.connections.filter((c) => c.fromId !== id && c.toId !== id),
    })),
  toggleNodeExpanded: (id) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, expanded: !n.expanded } : n)),
    })),
  addConnection: (conn) => set((state) => ({ connections: [...state.connections, conn] })),
  selectNode: (id) => set({ selectedNodeId: id }),
  addAgent: (agent) => set((state) => ({ agents: [...state.agents, agent] })),
  updateAgent: (id, data) => set((state) => ({
    agents: state.agents.map(a => a.id === id ? { ...a, ...data } : a)
  })),
  setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
  resetCanvas: () =>
    set({
      nodes: [
        {
          id: "1",
          type: "input",
          x: 600,
          y: 400,
          content: "",
          model: "Agent 1",
          agentId: "agent-1",
          agentColor: "#3b82f6",
          width: 400,
        },
      ],
      connections: [],
      selectedNodeId: null,
    }),
  setCanvas: (nodes, connections) => set({ nodes, connections }),
}))
