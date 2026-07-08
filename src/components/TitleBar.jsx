import { useEffect, useState } from 'react'

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    let off = () => {}
    window.winApi?.isMaximized().then((m) => setMaximized(!!m))
    if (window.winApi?.onMaximizeStateChange) {
      off = window.winApi.onMaximizeStateChange(setMaximized)
    }
    return () => off()
  }, [])

  return (
    <div
      className="h-9 flex items-center px-3 select-none flex-shrink-0"
      style={{ WebkitAppRegion: 'drag', background: 'var(--bg-page)' }}
    >
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' }}>
        <CircleBtn
          color="#ff5f57"
          hoverColor="#e0443e"
          symbol="✕"
          title="关闭"
          onClick={() => window.winApi?.close()}
        />
        <CircleBtn
          color="#febc2e"
          hoverColor="#dea123"
          symbol="−"
          title="最小化"
          onClick={() => window.winApi?.minimize()}
        />
        <CircleBtn
          color="#28c840"
          hoverColor="#1aab29"
          symbol={maximized ? '⇲' : '⛶'}
          title={maximized ? '还原' : '最大化'}
          onClick={() => window.winApi?.toggleMaximize()}
        />
      </div>
    </div>
  )
}

function CircleBtn({ color, hoverColor, symbol, title, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={title}
      className="w-4 h-4 rounded-full flex items-center justify-center transition-colors"
      style={{
        background: hover ? hoverColor : color,
        border: 'none',
        cursor: 'pointer',
        padding: 0
      }}
    >
      <span
        style={{
          fontSize: 11,
          lineHeight: 1,
          color: 'rgba(0,0,0,0.6)',
          opacity: hover ? 1 : 0,
          fontFamily: 'Segoe UI Symbol, Apple Symbols, sans-serif',
          fontWeight: 700
        }}
      >
        {symbol}
      </span>
    </button>
  )
}
