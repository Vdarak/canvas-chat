import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export function checkCollision(rect1: Rect, rect2: Rect, buffer = 20): boolean {
  return (
    rect1.x < rect2.x + rect2.width + buffer &&
    rect1.x + rect1.width + buffer > rect2.x &&
    rect1.y < rect2.y + rect2.height + buffer &&
    rect1.y + rect1.height + buffer > rect2.y
  )
}

export function getSmartPosition(
  preferredX: number,
  preferredY: number,
  width: number,
  height: number,
  existingNodes: { x: number; y: number; width?: number; height?: number }[],
  direction: "right" | "bottom" | "any" = "any"
): { x: number; y: number } {
  const buffer = 50
  let x = preferredX
  let y = preferredY
  let found = false
  let attempts = 0
  const maxAttempts = 100

  // Default dimensions if missing
  const defaultW = 450
  const defaultH = 200

  const targetRect = { x, y, width, height }

  // Helper to check if current position collides with ANY existing node
  const hasCollision = (tx: number, ty: number) => {
    return existingNodes.some(node =>
      checkCollision(
        { x: tx, y: ty, width, height },
        { x: node.x, y: node.y, width: node.width || defaultW, height: node.height || defaultH },
        buffer
      )
    )
  }

  if (!hasCollision(x, y)) return { x, y }

  // Spiral / Grid search based on direction
  while (!found && attempts < maxAttempts) {
    attempts++

    if (direction === "right") {
      // Try moving down first, then further right
      // Actually for branching (right), we want to stack vertically if blocked
      // Try positions: (x, y), (x, y + h), (x, y - h), (x, y + 2h)...
      // If that column is full, move right and repeat

      const columnOffset = Math.floor((attempts - 1) / 5) * (width + buffer)
      const rowAttempt = (attempts - 1) % 5
      const rowOffset = Math.ceil(rowAttempt / 2) * (height + buffer) * (rowAttempt % 2 === 0 ? 1 : -1)

      const tryX = preferredX + columnOffset
      const tryY = preferredY + rowOffset

      if (!hasCollision(tryX, tryY)) {
        x = tryX
        y = tryY
        found = true
      }
    } else if (direction === "bottom") {
      // For responses (bottom), we want to move right if blocked
      // Try positions: (x, y), (x + w, y), (x - w, y), (x + 2w, y)...

      const rowOffset = Math.floor((attempts - 1) / 5) * (height + buffer)
      const colAttempt = (attempts - 1) % 5
      const colOffset = Math.ceil(colAttempt / 2) * (width + buffer) * (colAttempt % 2 === 0 ? 1 : -1)

      const tryX = preferredX + colOffset
      const tryY = preferredY + rowOffset

      if (!hasCollision(tryX, tryY)) {
        x = tryX
        y = tryY
        found = true
      }
    } else {
      // "any" - spiral out
      const angle = attempts * 0.5
      const radius = attempts * 50
      const tryX = preferredX + Math.cos(angle) * radius
      const tryY = preferredY + Math.sin(angle) * radius

      if (!hasCollision(tryX, tryY)) {
        x = tryX
        y = tryY
        found = true
      }
    }
  }

  return { x, y }
}
