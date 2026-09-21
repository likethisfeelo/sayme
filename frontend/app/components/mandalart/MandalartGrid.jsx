'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CELL_COUNT, SUB_COUNT } from '@/lib/mandalart';
import { playCrystal, isSoundEnabled, setSoundEnabled } from '@/lib/crystalSound';

/**
 * 3x3 만다라트 그리드
 *
 * mode
 *  - 'fill'     : 8칸 입력 (textarea, Enter 로 다음 칸 이동)
 *  - 'dig'      : 칸을 눌러 파고들기(하위 3항목) 입력 - 행 아래로 드로어가 펼쳐짐
 *  - 'readonly' : 조회 전용 (칸을 누르면 하위 항목 열람)
 */
const POSITION_TO_INDEX = [0, 1, 2, 3, null, 4, 5, 6, 7];

function AutoTextarea({ value, onChange, onEnter, placeholder, className, style, inputRef, readOnly, maxLength = 200, ariaLabel }) {
  const innerRef = useRef(null);
  const ref = inputRef || innerRef;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.max(el.scrollHeight, 44)}px`;
  }, [value, ref]);

  return (
    <textarea
      ref={ref}
      value={value}
      readOnly={readOnly}
      maxLength={maxLength}
      rows={1}
      placeholder={placeholder}
      aria-label={ariaLabel}
      enterKeyHint={onEnter ? 'next' : 'done'}
      onChange={(e) => onChange?.(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey && onEnter) {
          e.preventDefault();
          onEnter();
        }
      }}
      className={`block w-full resize-none bg-transparent outline-none text-[16px] leading-[1.45] text-[#26251f] placeholder:text-[#b3b0a6] ${className || ''}`}
      style={{ overflow: 'hidden', ...style }}
    />
  );
}

export default function MandalartGrid({
  sheet,
  data,
  mode = 'fill',
  onChange,
  errorCells = [],
  autoFocusFirst = false,
  initialOpenCell = null,
  onOpenCellChange,
  large = false,
}) {
  const theme = sheet.theme;
  const items = data?.items || [];
  const [openCell, setOpenCell] = useState(initialOpenCell);
  const [soundOn, setSoundOn] = useState(() => (typeof window !== 'undefined' ? isSoundEnabled() : true));
  const cellRefs = useRef([]);
  const subRefs = useRef([]);
  const isDig = mode === 'dig' || mode === 'readonly';
  const readOnly = mode === 'readonly';

  useEffect(() => {
    if (mode === 'fill' && autoFocusFirst) {
      const firstEmpty = items.findIndex((it) => !(it.text || '').trim());
      const target = cellRefs.current[firstEmpty >= 0 ? firstEmpty : 0];
      // 모바일에서 자동 키보드 팝업은 피하고 데스크톱에서만 포커스
      if (target && window.matchMedia('(hover: hover)').matches) target.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    onOpenCellChange?.(openCell);
  }, [openCell, onOpenCellChange]);

  useEffect(() => {
    if (openCell === null || readOnly) return;
    const t = setTimeout(() => {
      const first = subRefs.current[0];
      if (first && window.matchMedia('(hover: hover)').matches) first.focus();
    }, 320);
    return () => clearTimeout(t);
  }, [openCell, readOnly]);

  const updateText = (index, text) => {
    const next = items.map((it, i) => (i === index ? { ...it, text } : it));
    onChange?.({ ...data, items: next });
  };

  const updateSub = (index, subIdx, text) => {
    const next = items.map((it, i) =>
      i === index ? { ...it, subs: it.subs.map((s, j) => (j === subIdx ? text : s)) } : it
    );
    onChange?.({ ...data, items: next });
  };

  const focusCell = (index) => {
    const el = cellRefs.current[index];
    if (el) {
      el.focus();
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  };

  const toggleCell = (index) => {
    setOpenCell((cur) => (cur === index ? null : index));
  };

  const filled = items.filter((it) => (it.text || '').trim()).length;
  const allFilled = filled === CELL_COUNT;

  const themeVars = {
    '--glass-accent': theme.accln,
    '--glass-accent-soft': theme.soft,
    '--glass-accent-bg': theme.accbg,
    '--glass-blob-a': theme.soft.replace(/[\d.]+\)$/, '0.9)'),
    '--glass-blob-b': 'rgba(191,167,255,0.55)',
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playCrystal({ pitch: 1.2 });
  };

  const renderCell = (position) => {
    const index = POSITION_TO_INDEX[position];

    if (index === null) {
      return (
        <motion.div
          key="center"
          role="button"
          tabIndex={0}
          onClick={() => playCrystal({ pitch: 0.75, chord: true })}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') playCrystal({ pitch: 0.75, chord: true }); }}
          className={`glass-center relative overflow-hidden flex items-center justify-center rounded-[14px] font-bold select-none min-h-[92px] cursor-pointer ${large ? 'text-[26px] md:text-[32px]' : 'text-[21px]'}`}
          style={{ color: theme.accd }}
          animate={allFilled ? { scale: [1, 1.06, 1], boxShadow: [`0 0 0 0 ${theme.soft}`, `0 0 0 12px rgba(0,0,0,0)`, `0 0 0 0 rgba(0,0,0,0)`] } : { scale: 1 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          {sheet.center}
          {allFilled && mode === 'fill' && (
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-1.5 text-[10px] font-medium"
              style={{ color: theme.acc }}
            >
              완성 ✓
            </motion.span>
          )}
        </motion.div>
      );
    }

    const item = items[index] || { text: '', subs: [] };
    const hasText = !!(item.text || '').trim();
    const subFilled = (item.subs || []).filter((s) => (s || '').trim()).length;
    const isError = errorCells.includes(index);
    const isOpen = openCell === index;

    if (mode === 'fill') {
      return (
        <motion.div
          key={`cell-${index}`}
          layout
          animate={isError ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className={`glass-cell rounded-[14px] min-h-[92px] ${large ? 'px-3 pb-3 pt-8 md:px-4 md:pt-9' : 'px-2.5 pb-2 pt-6'} ${hasText ? 'is-filled' : ''} ${isError ? 'is-error' : ''}`}
          onClick={() => {
            if (document.activeElement !== cellRefs.current[index]) playCrystal({ pitch: 0.95 + index * 0.05 });
            focusCell(index);
          }}
        >
          <span className={`absolute top-1.5 left-2.5 text-[#94928b] ${large ? 'text-[13px] md:text-[14px] top-2 left-3' : 'text-[11px]'}`}>{index + 1}</span>
          <AnimatePresence>
            {hasText && (
              <motion.span
                key="check"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className="absolute top-1 right-2 w-[16px] h-[16px] rounded-full text-[10px] text-white grid place-items-center"
                style={{ background: theme.accln }}
              >
                ✓
              </motion.span>
            )}
          </AnimatePresence>
          <AutoTextarea
            inputRef={(el) => { cellRefs.current[index] = el; }}
            value={item.text}
            onChange={(v) => updateText(index, v)}
            onEnter={() => {
              const nextIdx = index + 1 < CELL_COUNT ? index + 1 : null;
              if (nextIdx === null) cellRefs.current[index]?.blur();
              else focusCell(nextIdx);
            }}
            placeholder="입력"
            ariaLabel={`${index + 1}번 칸`}
            className={large ? 'text-[18px] md:text-[20px] leading-[1.4]' : ''}
          />
        </motion.div>
      );
    }

    // dig / readonly
    return (
      <motion.button
        key={`cell-${index}`}
        type="button"
        layout
        onClick={() => {
          playCrystal({ pitch: isOpen ? 0.85 : 1.05 + index * 0.04 });
          toggleCell(index);
        }}
        whileTap={{ scale: 0.97 }}
        className={`glass-cell text-left rounded-[14px] min-h-[92px] leading-[1.45] text-[#26251f] ${large ? 'px-3 pb-3 pt-8 md:px-4 md:pt-9 text-[17px] md:text-[19px]' : 'px-2.5 pb-2 pt-6 text-[14px]'} ${subFilled > 0 ? 'is-filled' : ''} ${isOpen ? 'is-active' : ''}`}
        aria-expanded={isOpen}
        aria-label={`${index + 1}번 칸 ${item.text || ''} 파고들기`}
      >
        <span className={`absolute top-1.5 left-2.5 text-[#94928b] ${large ? 'text-[13px] md:text-[14px] top-2 left-3' : 'text-[11px]'}`}>{index + 1}</span>
        <span className="absolute top-1.5 right-2.5 flex gap-[3px]" aria-hidden>
          {Array.from({ length: SUB_COUNT }).map((_, j) => (
            <span
              key={j}
              className="w-[6px] h-[6px] rounded-full transition-colors"
              style={{ background: (item.subs?.[j] || '').trim() ? theme.accln : '#e4e2da' }}
            />
          ))}
        </span>
        <span className="block break-words">{item.text || <span className="text-[#b3b0a6]">(비어 있음)</span>}</span>
        {!readOnly && (
          <span className={`absolute bottom-1.5 right-2.5 ${large ? 'text-[12px] bottom-2 right-3' : 'text-[10px]'}`} style={{ color: theme.acc }}>
            {isOpen ? '닫기' : subFilled > 0 ? `${subFilled}/${SUB_COUNT}` : '파고들기 ›'}
          </span>
        )}
      </motion.button>
    );
  };

  const renderDrawer = (row) => {
    if (openCell === null) return null;
    const pos = POSITION_TO_INDEX.indexOf(openCell);
    if (Math.floor(pos / 3) !== row) return null;
    const col = pos % 3;
    const item = items[openCell] || { text: '', subs: [] };
    const prev = openCell > 0 ? openCell - 1 : null;
    const next = openCell < CELL_COUNT - 1 ? openCell + 1 : null;

    return (
      <motion.div
        key={`drawer-${openCell}`}
        className="relative"
        style={{ gridColumn: '1 / -1' }}
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <span
          className="absolute top-0 w-[12px] h-[12px] border-l border-t rotate-45 translate-y-[4px] transition-[left] duration-200"
          style={{
            background: 'rgba(255,255,255,0.75)',
            borderColor: 'rgba(255,255,255,0.9)',
            left: `calc(${col} * ((100% - 12px) / 3 + 6px) + (100% - 12px) / 6 - 6px)`,
          }}
        />
        <div className="glass-panel mt-[9px] rounded-[16px] p-3">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="text-[13px] text-[#5f5e5a] min-w-0">
              <span className="font-semibold text-[#26251f]">{openCell + 1}. {item.text || `${openCell + 1}번 칸`}</span>
              {!readOnly && <span className="ml-2 text-[11px] text-[#94928b] hidden sm:inline">{sheet.subHint}</span>}
            </div>
            <button type="button" onClick={() => setOpenCell(null)} className="text-[#94928b] text-[18px] leading-none px-1" aria-label="닫기">×</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {sheet.subLabels.map((label, j) => (
              <motion.div
                key={j}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * j + 0.1 }}
                className="flex flex-col gap-1"
              >
                <span className={`text-[#94928b] ${large ? 'text-[13px]' : 'text-[11px]'}`}>{label}</span>
                {readOnly ? (
                  <div className={`min-h-[52px] rounded-[10px] border border-white/80 bg-white/60 px-2.5 py-2 leading-[1.5] text-[#26251f] whitespace-pre-wrap ${large ? 'text-[15px] md:text-[16px]' : 'text-[13px]'}`}>
                    {(item.subs?.[j] || '').trim() || <span className="text-[#b3b0a6]">-</span>}
                  </div>
                ) : (
                  <div
                    className="rounded-[10px] border border-dashed bg-white/65 px-2.5 py-2 transition-colors focus-within:border-solid focus-within:bg-white/90"
                    style={{ borderColor: '#c9c7bd' }}
                  >
                    <AutoTextarea
                      inputRef={(el) => { subRefs.current[j] = el; }}
                      value={item.subs?.[j] || ''}
                      onChange={(v) => updateSub(openCell, j, v)}
                      onEnter={() => {
                        if (j < SUB_COUNT - 1) subRefs.current[j + 1]?.focus();
                        else if (next !== null) setOpenCell(next);
                        else subRefs.current[j]?.blur();
                      }}
                      placeholder={label}
                      maxLength={500}
                      className={large ? 'text-[16px] md:text-[17px]' : 'text-[15px]'}
                      style={{ minHeight: large ? 64 : 52 }}
                      ariaLabel={`${openCell + 1}번 칸 ${label}`}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3">
            <button
              type="button"
              disabled={prev === null}
              onClick={() => setOpenCell(prev)}
              className="text-[12px] px-3 py-2 rounded-lg border border-[#e4e2da] bg-white text-[#5f5e5a] disabled:opacity-40"
            >
              ‹ 이전 칸
            </button>
            <span className="text-[11px] text-[#94928b]">{openCell + 1} / {CELL_COUNT}</span>
            <button
              type="button"
              onClick={() => (next === null ? setOpenCell(null) : setOpenCell(next))}
              className="text-[12px] px-3 py-2 rounded-lg border font-medium"
              style={{ borderColor: theme.accln, color: theme.acc, background: theme.accbg }}
            >
              {next === null ? '완료' : '다음 칸 ›'}
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const rows = [0, 1, 2];

  return (
    <div>
      <div className="flex justify-end mb-1.5">
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? '효과음 끄기' : '효과음 켜기'}
          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-white/70 border border-white/90 text-[#5f5e5a] shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
        >
          <span aria-hidden>{soundOn ? '🔔' : '🔕'}</span> 크리스탈 효과음 {soundOn ? '켜짐' : '꺼짐'}
        </button>
      </div>
      <div className={`glass-stage ${large ? 'glass-grid-large' : ''}`} style={themeVars}>
        <div className={`grid grid-cols-3 ${large ? 'gap-2 md:gap-3' : 'gap-2'}`}>
          {rows.map((row) => (
            <div key={row} className="contents">
              {[0, 1, 2].map((col) => renderCell(row * 3 + col))}
              <AnimatePresence initial={false}>{isDig && renderDrawer(row)}</AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
