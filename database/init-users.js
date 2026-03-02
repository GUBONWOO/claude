/**
 * admin 계정 초기 삽입 스크립트
 * 실행: node database/init-users.js
 */
const pool = require('./db');
const bcrypt = require('bcrypt');

async function initUsers() {
  const client = await pool.connect();
  try {
    // users 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);

    // admin 계정 초기 삽입 (이미 있으면 skip)
    const adminPassword = await bcrypt.hash('admin1234', 10);
    await client.query(`
      INSERT INTO users (username, password, email, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO NOTHING
    `, ['admin', adminPassword, 'admin@bikesearch.com', 'admin']);

    console.log('✅ users 테이블 생성 및 admin 계정 초기화 완료');
    console.log('   아이디: admin / 비밀번호: admin1234');
  } finally {
    client.release();
    await pool.end();
  }
}

initUsers().catch(err => {
  console.error('❌ 초기화 실패:', err.message);
  process.exit(1);
});
