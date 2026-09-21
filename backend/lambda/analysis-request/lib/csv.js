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

/**
 * 신청 목록 → CSV 문자열
 * 기본 컬럼 + answers 의 모든 키를 동적으로 컬럼화
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

  const answerKeys = [];
  for (const item of items) {
    for (const key of Object.keys(item.answers || {})) {
      if (!answerKeys.includes(key)) answerKeys.push(key);
    }
  }

  const header = [...baseColumns.map(([, label]) => label), ...answerKeys.map((k) => `답변:${k}`)];
  const rows = items.map((item) => {
    const base = baseColumns.map(([key]) =>
      key === 'statusLabel' ? STATUS_LABEL[item.status] || item.status : item[key]
    );
    const answers = answerKeys.map((k) => item.answers?.[k]);
    return [...base, ...answers].map(csvCell).join(',');
  });

  return BOM + [header.map(csvCell).join(','), ...rows].join('\r\n');
}

module.exports = { requestsToCsv, csvCell };
