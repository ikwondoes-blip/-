// 직원 계정의 로그인 메일을 회사 메일로 바꿉니다(비밀번호는 그대로).
// 총무 PC 화면이 조직도의 "회사메일"을 Firestore logins/{직원ID}에 올려 두면, 이 작업이 계정에 반영합니다.
// 실행 기록에는 건수만 남기고 이름·메일은 남기지 않습니다.
import { createRequire } from 'module';
const require = createRequire(process.env.ADMIN_SDK_DIR ? process.env.ADMIN_SDK_DIR + '/index.js' : import.meta.url);
const admin = require('firebase-admin');

const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
admin.initializeApp(sa
  ? { credential: admin.credential.cert(JSON.parse(sa)) }
  : { projectId: process.env.GCLOUD_PROJECT || 'demo-fund' }); // 에뮬레이터 테스트용

const db = admin.firestore();
const logins = await db.collection('logins').get();
let changed = 0, same = 0, noAccount = 0, failed = 0;
for (const d of logins.docs) {
  const email = String(d.data().email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { failed++; continue; }
  const m = await db.doc(`members/${d.id}`).get();
  const uid = m.exists && m.data().uid;
  if (!uid) { noAccount++; continue; }
  try {
    const u = await admin.auth().getUser(uid);
    if ((u.email || '').toLowerCase() === email) { same++; continue; }
    await admin.auth().updateUser(uid, { email });
    changed++;
  } catch (e) {
    failed++;
    console.log(`::warning::계정 1건 변경 실패 (${e.code || e.message})`);
  }
}
console.log(`회사 메일로 전환 ${changed}건 · 이미 전환됨 ${same}건 · 계정 없음 ${noAccount}건 · 실패 ${failed}건`);
if (failed) process.exitCode = 1;
