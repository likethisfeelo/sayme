/**
 * CSV 변환 유틸 (Excel 한글 호환을 위해 UTF-8 BOM 포함)
 */
const { STATUS_LABEL } = require('./constants');

const BOM = '﻿';

function csvCell(value) {
  if (value === undefined || value === null) return '';
  let s;
  if (Array.isArray(value)) s = value.join(' | ');
  else if (typeof value === 'object') s = JSON.stringify(value);
  else s = String(value);
  // CSV injection 방지 (=, +, -, @ 로 시작하는 셀)
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

const isWorksheet = (v) => v && typeof v === 'object' && Array.isArray(v.items) && typeof v.title === 'string';

/**
 * answers → 평탄화된 { 컬럼명: 값 }
 * - 워크시트({title, subLabels, items}) : "제목 1", "제목 1 · 하위라벨" 컬럼
 * - 그 외 중첩 객체/배열 : 점(.)으로 이어 붙인 경로
 */
function flattenAnswers(answers = {}, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(answers)) {
    const name = prefix ? `${prefix}.${key}` : key;
    if (value === undefined || value === null) continue;
    if (isWorksheet(value)) {
      const subLabels = Array.isArray(value.subLabels) ? value.subLabels : [];
      value.items.forEach((item, i) => {
        const n = i + 1;
        out[`${value.title} ${n}`] = item?.text ?? '';
        (item?.subs || []).forEach((sub, j) => {
          out[`${value.title} ${n} · ${subLabels[j] || `하위${j + 1}`}`] = sub ?? '';
        });
      });
    } else if (Array.isArray(value)) {
      if (value.every((v) => typeof v !== 'object' || v === null)) out[name] = value.join(' | ');
      else value.forEach((v, i) => flattenAnswers({ [i + 1]: v }, name, out));
    } else if (typeof value === 'object') {
      flattenAnswers(value, name, out);
    } else {
      out[name] = value;
    }
  }
  return out;
}

/**
 * 신청 목록 → CSV 문자열
 * 기본 컬럼 + answers 를 평탄화한 모든 컬럼
 */
function requestsToCsv(items) {
  const baseColumns = [
    ['requestId', '요청ID'],
    ['status', '상태코드'],
    ['statusLabel', '상태'],
    ['name', '이름'],
    ['email', '이메일'],
    ['phone', '연락처'],
    ['createdAt', '접수시각'],
    ['updatedAt', '수정시각'],
    ['sentAt', '보고서전송시각'],
    ['reportTitle', '보고서제목'],
    ['adminNote', '관리자메모'],
    ['userId', '사용자ID'],
  ];

  const flattened = items.map((item) => flattenAnswers(item.answers || {}));
  const answerKeys = [];
  for (const f of flattened) {
    for (const key of Object.keys(f)) if (!answerKeys.includes(key)) answerKeys.push(key);
  }

  const header = [...baseColumns.map(([, label]) => label), ...answerKeys.map((k) => `답변:${k}`)];
  const rows = items.map((item, idx) => {
    const base = baseColumns.map(([key]) =>
      key === 'statusLabel' ? STATUS_LABEL[item.status] || item.status : item[key]
    );
    const answers = answerKeys.map((k) => flattened[idx][k]);
    return [...base, ...answers].map(csvCell).join(',');
  });

  return BOM + [header.map(csvCell).join(','), ...rows].join('\r\n');
}

module.exports = { requestsToCsv, csvCell, flattenAnswers };
