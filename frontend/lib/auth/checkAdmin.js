// 관리자 이메일 목록 (백업용)
const ADMIN_EMAILS = [
  'dark.dduu@gmail.com'
];

// 관리자인지 확인 (Cognito Groups 우선, 이메일 백업)
export function isAdmin() {
  const idToken = localStorage.getItem('idToken');
  if (!idToken) return false;

  try {
    // JWT 디코딩 (payload 부분)
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    
    // 방법 1: Cognito Groups 확인 (우선)
    const groups = payload['cognito:groups'] || [];
    if (groups.includes('Admins')) {
      console.log('✅ Admin access granted via Cognito Groups');
      return true;
    }
    
    // 방법 2: 이메일 확인 (백업)
    const email = payload.email;
    if (ADMIN_EMAILS.includes(email)) {
      console.log('✅ Admin access granted via email whitelist');
      return true;
    }
    
    console.log('❌ Not an admin user');
    return false;
  } catch (error) {
    console.error('Failed to check admin status:', error);
    return false;
  }
}

// 관리자 권한 필수 (페이지 접근 제한)
export function requireAdmin() {
  if (!isAdmin()) {
    alert('⛔ 관리자 권한이 필요합니다.');
    window.location.href = '/';
    return false;
  }
  return true;
}