/**
 * 나의 만다라트 - 워크시트 정의 / 상태 / 임시저장 / 페이로드 유틸
 *
 * 워크시트 2종 (각 8칸 + 칸당 3개의 파고들기 항목)
 *  - complete : 나를 완성시켜주는 것들 (없으면 내가 내가 아니게 되는 것)
 *  - torment  : 나를 괴롭히는 것들 (빼고 싶지만 안 빠지는 것)
 *
 * 저장 형식 (answers)
 *  { complete: { title, subtitle, subLabels:[3], items:[{ text, subs:[3] } x8] }, torment: {...} }
 */
export const SERVICE_NAME = '나의 만다라트';
export const SERVICE_TAGLINE = '나를 완성시키는 것과 괴롭히는 것, 8칸으로 정리하고 파고들기';

export const CELL_COUNT = 8;
export const SUB_COUNT = 3;

export const WORKSHEETS = [
  {
    key: 'complete',
    title: '나를 완성시켜주는 것들',
    subtitle: '없으면 내가 내가 아니게 되는 것',
    center: '나',
    subLabels: ['1년 뒤 계획', '2년 뒤 계획', '3년 뒤 계획'],
    subHint: '이것을 지키고 키우기 위한 계획을 적어보세요.',
    theme: {
      acc: '#0F6E56', accln: '#1D9E75', accbg: '#E1F5EE', accd: '#04342C', soft: 'rgba(29,158,117,0.12)',
    },
  },
  {
    key: 'torment',
    title: '나를 괴롭히는 것들',
    subtitle: '빼고 싶지만 안 빠지는 것',
    center: '나',
    subLabels: ['괴로운 이유', '내가 느끼는 감정', '괴롭지 않으려면'],
    subHint: '왜 괴로운지, 어떤 감정인지, 어떻게 하면 덜 괴로울지 적어보세요.',
    theme: {
      acc: '#993C1D', accln: '#D85A30', accbg: '#FAECE7', accd: '#4A1B0C', soft: 'rgba(216,90,48,0.12)',
    },
  },
];

export const worksheetByKey = (key) => WORKSHEETS.find((w) => w.key === key);

/** 흐름 단계 정의 (플로우 페이지 상단 진행 표시) */
export const FLOW_STEPS = [
  { id: 'complete-fill', sheet: 'complete', mode: 'fill', label: '완성 · 8칸', short: '1' },
  { id: 'complete-dig', sheet: 'complete', mode: 'dig', label: '완성 · 파고들기', short: '2' },
  { id: 'torment-fill', sheet: 'torment', mode: 'fill', label: '괴롭힘 · 8칸', short: '3' },
  { id: 'torment-dig', sheet: 'torment', mode: 'dig', label: '괴롭힘 · 파고들기', short: '4' },
  { id: 'submit', sheet: null, mode: 'submit', label: '확인 · 제출', short: '5' },
];

// ---------- 워크시트 데이터 ----------

export const emptySheet = () => ({
  items: Array.from({ length: CELL_COUNT }, () => ({ text: '', subs: Array(SUB_COUNT).fill('') })),
});

export const emptyDraft = () => ({
  version: 1,
  step: 0,
  sheets: { complete: emptySheet(), torment: emptySheet() },
  contact: { name: '', phone: '', email: '' },
  consent: false,
  updatedAt: null,
});

export const filledCount = (sheet) => (sheet?.items || []).filter((it) => (it?.text || '').trim()).length;
export const isSheetComplete = (sheet) => filledCount(sheet) === CELL_COUNT;
export const subFilledCount = (sheet) =>
  (sheet?.items || []).reduce((n, it) => n + (it?.subs || []).filter((s) => (s || '').trim()).length, 0);

/** 저장된 answers (서버) → 화면용 sheets 로 정규화 */
export function sheetsFromAnswers(answers = {}) {
  const sheets = {};
  for (const ws of WORKSHEETS) {
    const raw = answers?.[ws.key];
    const items = Array.isArray(raw?.items) ? raw.items : [];
    sheets[ws.key] = {
      items: Array.from({ length: CELL_COUNT }, (_, i) => ({
        text: items[i]?.text || '',
        subs: Array.from({ length: SUB_COUNT }, (_, j) => items[i]?.subs?.[j] || ''),
      })),
    };
  }
  return sheets;
}

/** 화면용 sheets → 서버 answers */
export function answersFromSheets(sheets) {
  const answers = {};
  for (const ws of WORKSHEETS) {
    const sheet = sheets?.[ws.key] || emptySheet();
    answers[ws.key] = {
      title: ws.title,
      subtitle: ws.subtitle,
      subLabels: ws.subLabels,
      items: sheet.items.map((it) => ({
        text: (it.text || '').trim(),
        subs: (it.subs || []).map((s) => (s || '').trim()),
      })),
    };
  }
  return answers;
}

export function buildSubmitPayload(draft, { source = 'mandalart-web' } = {}) {
  return {
    name: (draft.contact?.name || '').trim(),
    phone: (draft.contact?.phone || '').trim(),
    email: (draft.contact?.email || '').trim(),
    answers: answersFromSheets(draft.sheets),
    consent: draft.consent === true,
    source,
  };
}

export function validateContact(contact, consent) {
  const errors = {};
  if (!(contact?.name || '').trim()) errors.name = '이름을 입력해 주세요.';
  if (!(contact?.phone || '').trim()) errors.phone = '연락처를 입력해 주세요.';
  else if (!/^[0-9+\-\s()]{8,20}$/.test(contact.phone.trim())) errors.phone = '연락처 형식을 확인해 주세요.';
  if (contact?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) errors.email = '이메일 형식을 확인해 주세요.';
  if (consent !== true) errors.consent = '개인정보 수집·이용에 동의해 주세요.';
  return errors;
}

/** 텍스트 내보내기 (복사용) */
export function sheetsToText(sheets) {
  const out = [];
  for (const ws of WORKSHEETS) {
    out.push(`${ws.title} — ${ws.subtitle}`, '');
    (sheets?.[ws.key]?.items || []).forEach((it, i) => {
      out.push(`${i + 1}. ${(it.text || '').trim()}`);
      (it.subs || []).forEach((s, j) => {
        if ((s || '').trim()) out.push(`   - ${ws.subLabels[j]}: ${s.trim()}`);
      });
    });
    out.push('');
  }
  return out.join('\n').trim();
}

// ---------- 임시저장 (localStorage) ----------

export const DRAFT_KEY = 'sayme-mandalart-draft-v1';

export function loadDraft() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return null;
    const base = emptyDraft();
    return {
      ...base,
      ...parsed,
      sheets: sheetsFromAnswers({
        complete: { items: parsed.sheets?.complete?.items },
        torment: { items: parsed.sheets?.torment?.items },
      }),
      contact: { ...base.contact, ...(parsed.contact || {}) },
    };
  } catch {
    return null;
  }
}

export function saveDraft(draft) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }));
  } catch {
    /* 저장 공간 부족 등 무시 */
  }
}

export function clearDraft() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export const draftProgress = (draft) => {
  if (!draft) return 0;
  const a = filledCount(draft.sheets?.complete);
  const b = filledCount(draft.sheets?.torment);
  return Math.round(((a + b) / (CELL_COUNT * 2)) * 100);
};

// ---------- 처리 상태 ----------

export const STATUS_STEPS = [
  { key: 'submitted', label: '접수 완료', short: '접수', description: '입력하신 내용이 접수되었어요. 관리자가 곧 확인합니다.', icon: '📝' },
  { key: 'confirmed', label: '관리자 확인', short: '확인', description: '관리자가 입력 내용을 확인했어요.', icon: '👀' },
  { key: 'writing', label: '보고서 작성 중', short: '작성', description: '분석 보고서를 정성껏 작성하고 있어요.', icon: '✍️' },
  { key: 'sent', label: '보고서 전송 완료', short: '전송', description: '보고서가 전송되었어요. 이메일과 이 화면에서 확인할 수 있어요.', icon: '📬' },
];

export const STATUS_LABEL = Object.fromEntries(STATUS_STEPS.map((s) => [s.key, s.label]));
export const statusIndex = (status) => Math.max(0, STATUS_STEPS.findIndex((s) => s.key === status));

export const STATUS_BADGE_CLASS = {
  submitted: 'bg-[rgba(123,203,255,0.18)] text-[#2F6E9C]',
  confirmed: 'bg-[rgba(191,167,255,0.22)] text-[#5D48A5]',
  writing: 'bg-[rgba(255,193,120,0.25)] text-[#9A5A12]',
  sent: 'bg-[rgba(169,180,160,0.35)] text-[#3E5A3A]',
};

export const formatDateTime = (iso) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

// ---------- 관리자용 보고서 템플릿 ----------

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 사용자의 입력을 포함한 보고서 HTML 시작 템플릿 */
export function buildReportTemplate(request) {
  const sheets = sheetsFromAnswers(request?.answers);
  const name = esc(request?.name || '');

  const sheetHtml = WORKSHEETS.map((ws) => {
    const items = sheets[ws.key].items;
    const cells = items.map((it, i) => `<div class="cell"><span class="n">${i + 1}</span>${esc(it.text || '-')}</div>`);
    cells.splice(4, 0, `<div class="cell center" style="background:${ws.theme.accbg};border-color:${ws.theme.accln};color:${ws.theme.accd}">${esc(ws.center)}</div>`);
    const digs = items
      .map((it, i) => {
        const subs = it.subs.map((s, j) => (s ? `<li><b>${esc(ws.subLabels[j])}</b> · ${esc(s)}</li>` : '')).join('');
        return subs ? `<div class="dig"><div class="dig-t">${i + 1}. ${esc(it.text)}</div><ul>${subs}</ul></div>` : '';
      })
      .join('');
    return `
<section class="sheet">
  <h2 style="color:${ws.theme.acc}">${esc(ws.title)}</h2>
  <p class="sub">${esc(ws.subtitle)}</p>
  <div class="grid">${cells.join('')}</div>
  ${digs ? `<div class="digs">${digs}</div>` : ''}
  <h3>분석</h3>
  <p>여기에 ${esc(ws.title)}에 대한 분석을 작성하세요.</p>
</section>`;
  }).join('\n');

  return `<style>
.mr{font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard","Noto Sans KR",sans-serif;color:#26251f;line-height:1.7}
.mr h1{font-size:22px;margin:0 0 6px}
.mr h2{font-size:18px;margin:28px 0 2px}
.mr h3{font-size:15px;margin:20px 0 6px}
.mr .sub{margin:0 0 12px;font-size:13px;color:#94928b}
.mr .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.mr .cell{position:relative;min-height:72px;border:1px solid #c9c7bd;border-radius:8px;padding:20px 8px 8px;font-size:13px;background:#fff}
.mr .cell .n{position:absolute;top:4px;left:8px;font-size:11px;color:#94928b}
.mr .cell.center{display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:600;padding:8px}
.mr .digs{margin-top:12px;display:grid;gap:8px}
.mr .dig{border:1px solid #e4e2da;border-radius:10px;padding:10px 12px;background:#faf9f5;font-size:13px}
.mr .dig-t{font-weight:600;margin-bottom:4px}
.mr ul{margin:0;padding-left:18px}
.mr .summary{border-left:3px solid #BFA7FF;padding:8px 14px;background:#f7f4ff;border-radius:0 10px 10px 0}
</style>
<div class="mr">
  <h1>${name ? `${name}님의 ` : ''}만다라트 분석 보고서</h1>
  <p class="sub">${esc(SERVICE_NAME)} · 작성일 ${new Date().toLocaleDateString('ko-KR')}</p>
  <div class="summary"><b>한눈에 보기</b><br/>여기에 전체 요약을 작성하세요.</div>
  ${sheetHtml}
  <h2>다음 한 걸음</h2>
  <p>여기에 제안을 작성하세요.</p>
</div>`;
}
