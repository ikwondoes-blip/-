// Firebase 콘솔 → 프로젝트 설정 → 내 앱(웹)에서 복사한 값으로 바꿔 넣으세요.
// 이 값은 공개돼도 괜찮습니다. 데이터 보호는 firestore.rules가 담당합니다.
window.FUND_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDBTmIXWMJduTajUTXxKpp0eDogXb1v_BA",
  authDomain: "asudi-fund.firebaseapp.com",
  projectId: "asudi-fund",
  storageBucket: "asudi-fund.firebasestorage.app",
  messagingSenderId: "396176686144",
  appId: "1:396176686144:web:a92fda040a74e0246633a5"
};

// 로그인 아이디(이름) → Firebase 계정 이메일 변환 규칙.
// 총무 PC 화면(관리자)과 반드시 같아야 합니다.
window.FUND_EMAIL_DOMAIN = "fund.asudi.co.kr";
window.fundIdOf = function (name) {
  const bytes = new TextEncoder().encode(String(name).normalize("NFC").replace(/\s+/g, ""));
  return "u" + Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
};
window.fundEmailOf = function (name) {
  return window.fundIdOf(name) + "@" + window.FUND_EMAIL_DOMAIN;
};
