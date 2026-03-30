// composables/useDraggableFab.ts

import { ref, onMounted, onUnmounted } from 'vue'

interface FabPosition { x: number; y: number }

interface Options {
  storageKey:         string
  defaultPos:         FabPosition
  fabSize?:           number
  longPressDuration?: number
}

export function useDraggableFab(opts: Options) {
  const {
    storageKey,
    defaultPos,
    fabSize           = 56,
    longPressDuration = 500,
  } = opts

  const position   = ref<FabPosition>({ ...defaultPos })
  const isDragging = ref(false)
  const isDimmed   = ref(false)

  let timer:        ReturnType<typeof setTimeout> | null = null
  let startTouch:   { x: number; y: number } | null = null
  let startPos:     FabPosition | null = null
  let _didLongPress = false
  let _didMove      = false

  // ── helpers ──────────────────────────────────────────────

  const clamp = (pos: FabPosition): FabPosition => ({
    x: Math.max(4, Math.min(pos.x, window.innerWidth  - fabSize - 4)),
    y: Math.max(4, Math.min(pos.y, window.innerHeight - fabSize - 4)),
  })

  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(position.value)) } catch {}
  }

  const load = () => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) position.value = clamp(JSON.parse(raw) as FabPosition)
    } catch {}
  }

  const cancelTimer = () => {
    if (timer) { clearTimeout(timer); timer = null }
  }

  const activate = () => {
    _didLongPress    = true
    isDragging.value = true
    isDimmed.value   = true
    if (navigator?.vibrate) navigator.vibrate(30)
  }

  const deactivate = () => {
    cancelTimer()
    if (isDragging.value) save()
    isDragging.value = false
    isDimmed.value   = false
    startTouch = null
    startPos   = null
  }

  // ── TOUCH — dipasang manual agar bisa { passive: false } ──

  let _el: HTMLElement | null = null

  const _onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    _didLongPress = false
    _didMove      = false
    startTouch    = { x: t.clientX, y: t.clientY }
    startPos      = { ...position.value }
    timer = setTimeout(activate, longPressDuration)
  }

  const _onTouchMove = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t || !startTouch) return
    const dx = t.clientX - startTouch.x
    const dy = t.clientY - startTouch.y

    if (!isDragging.value) {
      if (Math.hypot(dx, dy) > 6) {
        _didMove = true
        cancelTimer()
      }
      return
    }

    // Drag aktif — cegah scroll
    e.preventDefault()
    if (!startPos) return
    position.value = clamp({ x: startPos.x + dx, y: startPos.y + dy })
  }

  const _onTouchEnd = () => deactivate()

  // ── MOUSE ─────────────────────────────────────────────────

  const _onMouseMoveGlobal = (e: MouseEvent) => {
    if (!startTouch) return
    const dx = e.clientX - startTouch.x
    const dy = e.clientY - startTouch.y
    if (!isDragging.value) {
      if (Math.hypot(dx, dy) > 6) { _didMove = true; cancelTimer() }
      return
    }
    if (!startPos) return
    position.value = clamp({ x: startPos.x + dx, y: startPos.y + dy })
  }

  const _onMouseUpGlobal = () => {
    deactivate()
    window.removeEventListener('mousemove', _onMouseMoveGlobal)
    window.removeEventListener('mouseup',   _onMouseUpGlobal)
  }

  const _onMouseDown = (e: MouseEvent) => {
    _didLongPress = false
    _didMove      = false
    startTouch    = { x: e.clientX, y: e.clientY }
    startPos      = { ...position.value }
    timer = setTimeout(activate, longPressDuration)
    window.addEventListener('mousemove', _onMouseMoveGlobal)
    window.addEventListener('mouseup',   _onMouseUpGlobal)
  }

  // ── attach/detach ke elemen ───────────────────────────────

  const attachTo = (el: HTMLElement) => {
    _el = el
    // touchstart & touchend boleh passive
    el.addEventListener('touchstart', _onTouchStart, { passive: true })
    el.addEventListener('touchend',   _onTouchEnd,   { passive: true })
    // touchmove HARUS non-passive agar e.preventDefault() jalan
    el.addEventListener('touchmove',  _onTouchMove,  { passive: false })
    el.addEventListener('mousedown',  _onMouseDown)
  }

  const detachFrom = (el: HTMLElement) => {
    el.removeEventListener('touchstart', _onTouchStart)
    el.removeEventListener('touchend',   _onTouchEnd)
    el.removeEventListener('touchmove',  _onTouchMove)
    el.removeEventListener('mousedown',  _onMouseDown)
  }

  // ── resize ────────────────────────────────────────────────

  const onResize = () => { position.value = clamp(position.value); save() }

  onMounted(() => {
    load()
    window.addEventListener('resize', onResize)
  })

  onUnmounted(() => {
    cancelTimer()
    if (_el) detachFrom(_el)
    window.removeEventListener('resize',    onResize)
    window.removeEventListener('mousemove', _onMouseMoveGlobal)
    window.removeEventListener('mouseup',   _onMouseUpGlobal)
  })

  return {
    position,
    isDragging,
    isDimmed,
    attachTo,
    detachFrom,
    shouldClick: () => !_didLongPress && !_didMove,
  }
}