'use client'

export function GridBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Grid Pattern */}
      <div className="absolute inset-0 grid-bg opacity-50" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[128px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-green/5 rounded-full blur-[128px]" />
      
      {/* Scanlines Overlay */}
      <div className="absolute inset-0 scanlines opacity-30" />
      
      {/* Noise Texture */}
      <div className="absolute inset-0 noise-overlay" />
      
      {/* Vignette Effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, oklch(0.08 0.01 260) 100%)',
        }}
      />
    </div>
  )
}
