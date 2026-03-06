const pool = require('./db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * 유저 생성 (회원가입)
 */
async function createUser(username, password, email) {
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await pool.query(
    `INSERT INTO users (username, password, email, role)
     VALUES ($1, $2, $3, 'user')
     RETURNING id, username, email, role, created_at`,
    [username, hashed, email]
  );
  return result.rows[0];
}

/**
 * username으로 유저 조회
 */
async function findUserByUsername(username) {
  const result = await pool.query(
    `SELECT * FROM users WHERE username = $1`,
    [username]
  );
  return result.rows[0] || null;
}

/**
 * 비밀번호 검증
 */
async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * username 또는 email 중복 확인
 */
async function checkDuplicate(username, email) {
  const result = await pool.query(
    `SELECT username, email FROM users WHERE username = $1 OR email = $2`,
    [username, email]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  if (row.username === username) return 'username';
  if (row.email === email) return 'email';
  return null;
}

/**
 * Google OAuth - email 기준으로 upsert
 * 첫 로그인이면 INSERT(role='user'), 이미 있으면 username만 최신으로 UPDATE
 */
async function upsertGoogleUser(username, email) {
  const result = await pool.query(
    `INSERT INTO users (username, email, role)
     VALUES ($1, $2, 'user')
     ON CONFLICT (email)
     DO UPDATE SET username = EXCLUDED.username
     RETURNING id, username, email, role`,
    [username, email]
  );
  return result.rows[0];
}

/**
 * Kakao OAuth - email(카카오 고유 ID) 기준으로 upsert
 * 첫 로그인이면 INSERT(role='user'), 이미 있으면 username만 최신으로 UPDATE
 */
async function upsertKakaoUser(username, kakaoId) {
  const email = `kakao_${kakaoId}`;
  const result = await pool.query(
    `INSERT INTO users (username, email, role)
     VALUES ($1, $2, 'user')
     ON CONFLICT (email)
     DO UPDATE SET username = EXCLUDED.username
     RETURNING id, username, email, role`,
    [username, email]
  );
  return result.rows[0];
}

module.exports = { createUser, findUserByUsername, verifyPassword, checkDuplicate, upsertGoogleUser, upsertKakaoUser };
