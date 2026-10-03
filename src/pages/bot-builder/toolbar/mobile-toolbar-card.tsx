import React, { useCallback, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import './mobile-toolbar-card.scss';

// ─── Resize handles ─────────────────────────────────────────
type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const HANDLES: ResizeDir[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

interface Size { w: number; h: number }
interface Pos  { x: number; y: number }

const MIN_W = 56;
const MIN_H = 56;
const COLLAPSED_H = 44;

const MobileToolbarCard: React.FC<{ children: React.ReactNode }> = observer(({ children }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [collapsed, setCollapsed]   = useState(true);  // collapsed = zoom only strip
    const [hidden,    setHidden]       = useState(false);

    // Initial size/pos
    const [size, setSize] = useState<Size>({ w: 56, h: COLLAPSED_H });
    const [pos,  setPos]  = useState<Pos>({ x: 4, y: 0 });

    // Drag-to-move state
    const dragRef   = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
    // Resize state
    const resizeRef = useRef<{
        dir: ResizeDir;
        startX: number; startY: number;
        ow: number; oh: number; ox: number; oy: number;
    } | null>(null);

    // ── open: expand to show all tools ──────────────────────
    const expand = () => {
        setCollapsed(false);
        setSize({ w: Math.max(size.w, 58), h: 340 });
    };

    // ── DRAG MOVE ────────────────────────────────────────────
    const onHeaderPointerDown = useCallback((e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest('.mtc__controls')) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = { startX: e.clientX, startY: e.clientY, ox: pos.x, oy: pos.y };
    }, [pos]);

    const onHeaderPointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragRef.current) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPos({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy });
    }, []);

    const onHeaderPointerUp = useCallback(() => { dragRef.current = null; }, []);

    // ── RESIZE ───────────────────────────────────────────────
    const onResizePointerDown = useCallback((dir: ResizeDir, e: React.PointerEvent) => {
        e.stopPropagation();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        resizeRef.current = {
            dir, startX: e.clientX, startY: e.clientY,
            ow: size.w, oh: size.h, ox: pos.x, oy: pos.y,
        };
    }, [size, pos]);

    const onResizePointerMove = useCallback((e: React.PointerEvent) => {
        const r = resizeRef.current;
        if (!r) return;
        const dx = e.clientX - r.startX;
        const dy = e.clientY - r.startY;
        let { w, h, ox, oy } = { w: r.ow, h: r.oh, ox: r.ox, oy: r.oy };

        if (r.dir.includes('e'))  w = Math.max(MIN_W, r.ow + dx);
        if (r.dir.includes('s'))  h = Math.max(MIN_H, r.oh + dy);
        if (r.dir.includes('w')) { w = Math.max(MIN_W, r.ow - dx); ox = r.ox + (r.ow - w); }
        if (r.dir.includes('n')) { h = Math.max(MIN_H, r.oh - dy); oy = r.oy + (r.oh - h); }

        setSize({ w, h });
        setPos({ x: ox, y: oy });
    }, []);

    const onResizePointerUp = useCallback(() => { resizeRef.current = null; }, []);

    // ── Toggle collapsed ────────────────────────────────────
    const toggleCollapsed = () => {
        if (collapsed) {
            expand();
        } else {
            setCollapsed(true);
            setSize(s => ({ ...s, h: COLLAPSED_H }));
        }
    };

    if (hidden) {
        return (
            <button
                type='button'
                className='mtc__restore-btn'
                onClick={() => setHidden(false)}
                title='Show toolbar'
            >
                ⚙
            </button>
        );
    }

    return (
        <div
            ref={cardRef}
            className={`mtc ${collapsed ? 'mtc--collapsed' : 'mtc--expanded'}`}
            style={{
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                width:  collapsed ? `${MIN_W}px` : `${size.w}px`,
                height: collapsed ? `${COLLAPSED_H}px` : `${size.h}px`,
            }}
            onPointerMove={e => { onHeaderPointerMove(e); onResizePointerMove(e); }}
            onPointerUp={() => { onHeaderPointerUp(); onResizePointerUp(); }}
        >
            {/* ── Drag handle / header ── */}
            <div
                className='mtc__header'
                onPointerDown={onHeaderPointerDown}
            >
                <span className='mtc__grip'>⠿</span>
                <div className='mtc__controls'>
                    <button type='button' className='mtc__ctrl-btn' onClick={toggleCollapsed} title={collapsed ? 'Expand' : 'Collapse'}>
                        {collapsed ? '▲' : '▼'}
                    </button>
                    <button type='button' className='mtc__ctrl-btn mtc__ctrl-btn--close' onClick={() => setHidden(true)} title='Hide toolbar'>
                        ✕
                    </button>
                </div>
            </div>

            {/* ── Content ── */}
            <div className='mtc__body'>
                {children}
            </div>

            {/* ── Resize handles ── */}
            {!collapsed && HANDLES.map(dir => (
                <div
                    key={dir}
                    className={`mtc__resize-handle mtc__resize-handle--${dir}`}
                    onPointerDown={e => onResizePointerDown(dir, e)}
                />
            ))}
        </div>
    );
});

export default MobileToolbarCard;
