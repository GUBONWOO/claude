const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  const client = await pool.connect();

  try {
    console.log('데이터베이스 연결 성공!');

    // schema.sql 파일 읽기
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // 스키마 실행
    await client.query(schema);
    console.log('테이블 생성 완료!');

    // 테이블 확인
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);

    console.log('생성된 테이블 목록:');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

  } catch (error) {
    console.error('데이터베이스 초기화 오류:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 실행
initDatabase()
  .then(() => {
    console.log('\n데이터베이스 초기화 성공!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n데이터베이스 초기화 실패:', error);
    process.exit(1);
  });
