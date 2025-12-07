import type { NodeData } from "@/lib/store"

interface MinimapProps {
  nodes: NodeData[]
  viewport: { x: number; y: number; scale: number }
}

export function Minimap({ nodes, viewport }: MinimapProps) {
  // Determine bounds
  // Simplified mapping: Divide coordinates by a factor
  const mapScale = 0.05

  return (
    <div className="absolute bottom-4 right-4 w-[240px] h-[160px] bg-[#111] border border-[#333] rounded-lg overflow-hidden z-50 opacity-90 shadow-2xl">
      <div className="relative w-full h-full">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="absolute bg-neutral-600 rounded-[2px]"
            style={{
              left: node.x * mapScale + 50, // Offset to center somewhat
              top: node.y * mapScale + 50,
              width: (node.width || 450) * mapScale,
              height: (node.height || 100) * mapScale,
            }}
          />
        ))}

        {/* Viewport Indicator */}
        <div
          className="absolute border-2 border-white/20 bg-white/5 rounded-sm pointer-events-none"
          style={{
            left: -viewport.x * mapScale + 50,
            top: -viewport.y * mapScale + 50,
            width: (typeof window !== "undefined" ? window.innerWidth / viewport.scale : 0) * mapScale,
            height: (typeof window !== "undefined" ? window.innerHeight / viewport.scale : 0) * mapScale,
          }}
        />
      </div>
    </div>
  )
}
