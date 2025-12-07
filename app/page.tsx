import { Canvas } from "@/components/canvas"

export default function Page() {
  return (
    <main className="h-screen w-full bg-black overflow-hidden text-neutral-200 antialiased selection:bg-neutral-700 selection:text-white">
      <Canvas />
    </main>
  )
}
