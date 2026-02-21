const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function migrateData() {
  const client = await pool.connect();

  try {
    console.log('JSON 데이터 마이그레이션 시작...');

    // JSON 파일 읽기
    const jsonPath = path.join(__dirname, '..', 'crawl-data.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    console.log(`총 ${jsonData.length}개의 바이크 모델 데이터를 발견했습니다.`);

    await client.query('BEGIN');

    let bikeCount = 0;
    let listingCount = 0;

    for (const item of jsonData) {
      const { model, listings } = item;

      // bikes 테이블에 데이터 삽입 (중복 시 업데이트)
      const bikeResult = await client.query(
        `INSERT INTO bikes (model_id, name, maker, source, url)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (model_id)
         DO UPDATE SET
           name = EXCLUDED.name,
           maker = EXCLUDED.maker,
           source = EXCLUDED.source,
           url = EXCLUDED.url,
           updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [model.id, model.name, model.maker, model.source, model.url]
      );

      const bikeId = bikeResult.rows[0].id;
      bikeCount++;

      // listings 테이블에 데이터 삽입
      for (const listing of listings) {
        await client.query(
          `INSERT INTO listings (
            bike_id, name, price, total_price, year, mileage,
            detail_url, image_url, model, maker, source
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            bikeId,
            listing.name,
            listing.price,
            listing.totalPrice,
            listing.year,
            listing.mileage,
            listing.detailUrl,
            listing.imageUrl,
            listing.model,
            listing.maker,
            listing.source
          ]
        );
        listingCount++;
      }

      // 진행 상황 표시
      if (bikeCount % 10 === 0) {
        console.log(`진행 중... ${bikeCount}/${jsonData.length} 모델 처리 완료`);
      }
    }

    await client.query('COMMIT');

    console.log('\n마이그레이션 완료!');
    console.log(`- 바이크 모델: ${bikeCount}개`);
    console.log(`- 리스팅: ${listingCount}개`);

    // 데이터 확인
    const countResult = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM bikes) as bike_count,
        (SELECT COUNT(*) FROM listings) as listing_count
    `);

    console.log('\n데이터베이스 현황:');
    console.log(`- bikes 테이블: ${countResult.rows[0].bike_count}개`);
    console.log(`- listings 테이블: ${countResult.rows[0].listing_count}개`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('마이그레이션 오류:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 실행
migrateData()
  .then(() => {
    console.log('\n마이그레이션 성공!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n마이그레이션 실패:', error);
    process.exit(1);
  });
