/**
 * 관리자가 입력한 보고서 HTML 의 최소 안전 처리
 *  - <script>, <iframe>, <object>, <embed> 제거
 *  - on* 이벤트 핸들러 속성 제거
 *  - javascript: URL 제거
 * (관리자 신뢰 콘텐츠이므로 화이트리스트 방식이 아닌 최소 제거만 수행)
 */
function sanitizeReportHtml(html = '') {
  let out = String(html);
  out = out.replace(/<\s*(script|iframe|object|embed)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
  out = out.replace(/<\s*(script|iframe|object|embed)\b[^>]*\/?>/gi, '');
  out = out.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  out = out.replace(/(href|src)\s*=\s*(["']?)\s*javascript:[^"'>\s]*\2/gi, '$1=$2#$2');
  return out;
}

module.exports = { sanitizeReportHtml };
