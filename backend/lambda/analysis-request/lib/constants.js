/**
 * 분석 리포트 신청 상태 정의
 *
 * submitted  : 사용자가 입력을 제출함 (관리자 확인 대기)
 * confirmed  : 관리자가 입력을 확인함
 * writing    : 관리자가 보고서 작성 중
 * sent       : 보고서 전송 완료 (이메일 발송)
 */
const STATUS = {
  SUBMITTED: 'submitted',
  CONFIRMED: 'confirmed',
  WRITING: 'writing',
  SENT: 'sent',
};

const STATUS_ORDER = [STATUS.SUBMITTED, STATUS.CONFIRMED, STATUS.WRITING, STATUS.SENT];

const STATUS_LABEL = {
  [STATUS.SUBMITTED]: '접수 완료',
  [STATUS.CONFIRMED]: '관리자 확인',
  [STATUS.WRITING]: '보고서 작성 중',
  [STATUS.SENT]: '보고서 전송 완료',
};

const isValidStatus = (status) => STATUS_ORDER.includes(status);

module.exports = { STATUS, STATUS_ORDER, STATUS_LABEL, isValidStatus };
