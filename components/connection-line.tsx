import type { Connection, NodeData } from "@/lib/store"

interface ConnectionLineProps {
  connection: Connection
  nodes: NodeData[]
}

export function ConnectionLine({ connection, nodes }: ConnectionLineProps) {
  const fromNode = nodes.find((n) => n.id === connection.fromId)
  const toNode = nodes.find((n) => n.id === connection.toId)

  if (!fromNode || !toNode) return null

  const fromW = fromNode.width || 450
  const fromH = fromNode.height || 200
  const toW = toNode.width || 450
  const toH = toNode.height || 100

  let startX = fromNode.x
  let startY = fromNode.y
  let endX = toNode.x
  let endY = toNode.y

  switch (connection.fromAnchor) {
    case "right":
      startX += fromW
      startY += fromH / 2
      break
    case "bottom":
      startX += fromW / 2
      startY += fromH
      break
    case "left":
      startY += fromH / 2
      break
    default:
      startX += fromW / 2
      startY += fromH
  }

  switch (connection.toAnchor) {
    case "left":
      endY += 40
      break
    case "top":
      endX += toW / 2
      break
    default:
      endX += toW / 2
  }

  const dx = Math.abs(endX - startX)
  const dy = Math.abs(endY - startY)

  let d = ""

  if (connection.fromAnchor === "right" && connection.toAnchor === "left") {
    const c1x = startX + dx * 0.5
    const c1y = startY
    const c2x = endX - dx * 0.5
    const c2y = endY
    d = `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`
  } else {
    const c1x = startX
    const c1y = startY + dy * 0.5
    const c2x = endX
    const c2y = endY - dy * 0.5
    d = `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`
  }

  const strokeColor = connection.color || "#444"

  return <path d={d} stroke={strokeColor} strokeWidth="2" fill="none" />
}
