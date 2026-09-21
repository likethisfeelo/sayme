/**
 * 분석 리포트 신청 - 입력 폼 스키마 & 상태 정의
 *
 * 폼 항목은 이 파일만 수정하면 사용자 입력 화면 / 사용자 상세 / 관리자 상세 / CSV 가 함께 반영됩니다.
 * (백엔드는 answers 를 스키마 없이 그대로 저장하므로 별도 수정이 필요 없습니다)
 *
 * field.type: text | tel | email | textarea | select | radio | checkbox-group | date
 */
export const ANALYSIS_FORM_SECTIONS = [
  {
    id: 'basic',
    title: '기본 정보',
    description: '보고서 전달과 연락을 위해 필요한 정보예요.',
    fields: [
      { key: 'name', label: '이름', type: 'text', required: true, placeholder: '홍길동', top: true },
      { key: 'phone', label: '연락처', type: 'tel', required: true, placeholder: '010-0000-0000', top: true },
      { key: 'email', label: '이메일', type: 'email', required: false, placeholder: '보고서를 받을 이메일 (기본: 가입 이메일)', top: true },
      {
        key: '성별', label: '성별', type: 'radio', required: true,
        options: ['여성', '남성', '선택 안 함'],
      },
      { key: '생년월일', label: '생년월일', type: 'date', required: true },
      {
        key: '태어난 시간', label: '태어난 시간', type: 'select', required: false,
        options: ['모름', '자시(23:30~01:29)', '축시(01:30~03:29)', '인시(03:30~05:29)', '묘시(05:30~07:29)', '진시(07:30~09:29)', '사시(09:30~11:29)', '오시(11:30~13:29)', '미시(13:30~15:29)', '신시(15:30~17:29)', '유시(17:30~19:29)', '술시(19:30~21:29)', '해시(21:30~23:29)'],
      },
      { key: '출생 도시', label: '출생 도시', type: 'text', required: false, placeholder: '예: 서울' },
    ],
  },
  {
    id: 'request',
    title: '분석 요청',
    description: '어떤 부분을 함께 들여다볼지 알려주세요.',
    fields: [
      {
        key: '관심 분야', label: '관심 분야 (복수 선택)', type: 'checkbox-group', required: true,
        options: ['커리어·일', '관계·사랑', '재정·돈', '건강·에너지', '성장·자기이해', '올해의 흐름'],
      },
      {
        key: '현재 고민', label: '현재 가장 큰 고민', type: 'textarea', required: true, rows: 5, maxLength: 2000,
        placeholder: '지금 마음에 걸리는 일, 결정해야 할 일, 반복되는 패턴 등을 자유롭게 적어주세요.',
      },
      {
        key: '기대하는 점', label: '이번 분석에서 기대하는 점', type: 'textarea', required: false, rows: 3, maxLength: 1000,
        placeholder: '보고서에서 꼭 다뤄줬으면 하는 질문이 있다면 적어주세요.',
      },
      {
        key: '알게 된 경로', label: '서비스를 알게 된 경로', type: 'select', required: false,
        options: ['지인 추천', '인스타그램', '검색', '기존 회원', '기타'],
      },
    ],
  },
];

export const CONSENT_TEXT =
  '입력하신 정보는 분석 보고서 작성 및 결과 안내(이메일) 목적으로만 사용되며, 보고서 전송 후 관련 법령에 따라 보관됩니다.';

/** 상단(top) 필드는 answers 가 아닌 최상위(name/phone/email) 로 전송 */
export const TOP_LEVEL_KEYS = ['name', 'phone', 'email'];

export const allFields = () => ANALYSIS_FORM_SECTIONS.flatMap((s) => s.fields);

/** 폼 값 → API 페이로드 */
export function buildSubmitPayload(values, { source = 'web' } = {}) {
  const answers = {};
  for (const field of allFields()) {
    if (field.top) continue;
    const v = values[field.key];
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
    answers[field.key] = v;
  }
  return {
    name: values.name?.trim() || '',
    phone: values.phone?.trim() || '',
    email: values.email?.trim() || '',
    answers,
    consent: values.consent === true,
    source,
  };
}

/** 필수값 검증 → { key: message } */
export function validateForm(values) {
  const errors = {};
  for (const field of allFields()) {
    if (!field.required) continue;
    const v = values[field.key];
    const empty = v === undefined || v === null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0);
    if (empty) errors[field.key] = `${field.label.replace(/\s*\(.*\)$/, '')}을(를) 입력해 주세요.`;
  }
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = '이메일 형식을 확인해 주세요.';
  if (values.consent !== true) errors.consent = '개인정보 수집·이용에 동의해 주세요.';
  return errors;
}

// ---------- 상태 ----------

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
