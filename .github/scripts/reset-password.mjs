// 직원 비밀번호를 임시 비밀번호로 바꾸고, 다음 로그인 때 새 비밀번호를 정하게 합니다.
// GitHub Actions "직원 비밀번호 초기화"에서 실행됩니다. 총무 PC 화면의 ⑥ [비밀번호 초기화] 버튼이 이 작업을 요청합니다.
import { createRequire } from 'module';
const require = createRequire(process.env.ADMIN_SDK_DIR ? process.env.ADMIN_SDK_DIR + '/index.js' : import.meta.url);
const admin = require('firebase-admin');

const EMAIL_DOMAIN = 'fund.asudi.co.kr';
const memberId = String(process.env.MEMBER_ID || '').trim();
const tempPw = String(process.env.TEMP_PASSWORD || '');

if (!/^u[0-9a-f]{2,120}$/.test(memberId)) fail('직원 계정 ID 형식이 올바르지 않습니다.');
if (!/^[A-Za-z0-9]{8,32}$/.test(tempPw)) fail('임시 비밀번호 형식이 올바르지 않습니다.');
console.log(`::add-mask::${tempPw}`);

const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
admin.initializeApp(sa
  ? { credential: admin.credential.cert(JSON.parse(sa)) }
  : { projectId: process.env.GCLOUD_PROJECT || 'demo-fund' }); // 에뮬레이터 테스트용

try {
  // 계정 메일이 회사 메일로 바뀌었을 수 있으므로 직원 문서의 uid로 계정을 찾음
  const doc = await admin.firestore().doc(`members/${memberId}`).get();
  const uid = doc.exists && doc.data().uid;
  const user = uid ? await admin.auth().getUser(uid) : await admin.auth().getUserByEmail(`${memberId}@${EMAIL_DOMAIN}`);
  await admin.auth().updateUser(user.uid, { password: tempPw });
  await admin.auth().revokeRefreshTokens(user.uid);
  await admin.firestore().doc(`members/${memberId}`).set({
    mustChange: true,
    pwResetAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log('비밀번호를 임시 비밀번호로 바꿨습니다. 다음 로그인 때 새 비밀번호를 정해야 합니다.');
} catch (e) {
  fail(e.code === 'auth/user-not-found' ? '해당 직원의 계정이 없습니다. ⑥에서 계정을 먼저 만들어 주세요.' : `실패: ${e.code || e.message}`);
}

function fail(msg) {
  console.log(`::error::${msg}`);
  process.exit(1);
}
