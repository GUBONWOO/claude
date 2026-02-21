const pool = require('./db');

/**
 * 크롤링 데이터를 DB에 저장 (완전 동기화)
 * - 크롤링한 데이터만 DB에 유지
 * - 크롤링 결과에 없는 리스팅은 자동 삭제 (판매 완료)
 */
async function saveCrawlData(model, listings) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. 바이크 모델 저장 또는 업데이트
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

    // 2. 기존 리스팅 전체 삭제 (크롤링 결과만 남김)
    const deleteResult = await client.query(
      'DELETE FROM listings WHERE bike_id = $1',
      [bikeId]
    );

    // 3. 새로운 크롤링 결과만 저장
    let insertedCount = 0;
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
      insertedCount++;
    }

    await client.query('COMMIT');

    return {
      success: true,
      bikeId,
      deletedCount: deleteResult.rowCount,
      insertedCount: insertedCount
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 모든 바이크 모델 조회
 */
async function getAllBikes() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT
        b.*,
        COUNT(l.id) as listing_count
      FROM bikes b
      LEFT JOIN listings l ON b.id = l.bike_id
      GROUP BY b.id
      ORDER BY b.updated_at DESC
    `);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * 특정 바이크의 리스팅 조회
 */
async function getListingsByBikeId(bikeId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM listings WHERE bike_id = $1 ORDER BY created_at DESC`,
      [bikeId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * 모델 ID로 바이크와 리스팅 조회
 */
async function getBikeWithListings(modelId) {
  const client = await pool.connect();
  try {
    // 바이크 정보 조회
    const bikeResult = await client.query(
      `SELECT * FROM bikes WHERE model_id = $1`,
      [modelId]
    );

    if (bikeResult.rows.length === 0) {
      return null;
    }

    const bike = bikeResult.rows[0];

    // 리스팅 조회
    const listingsResult = await client.query(
      `SELECT * FROM listings WHERE bike_id = $1 ORDER BY created_at DESC`,
      [bike.id]
    );

    return {
      model: {
        id: bike.model_id,
        name: bike.name,
        maker: bike.maker,
        source: bike.source,
        url: bike.url
      },
      listings: listingsResult.rows.map(l => ({
        name: l.name,
        price: l.price,
        totalPrice: l.total_price,
        year: l.year,
        mileage: l.mileage,
        detailUrl: l.detail_url,
        imageUrl: l.image_url,
        model: l.model,
        maker: l.maker,
        source: l.source
      }))
    };
  } finally {
    client.release();
  }
}

/**
 * 검색어로 바이크 및 리스팅 조회
 */
async function searchBikes(keyword) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT DISTINCT
        b.id, b.model_id, b.name, b.maker, b.source, b.url,
        COUNT(l.id) as listing_count
       FROM bikes b
       LEFT JOIN listings l ON b.id = l.bike_id
       WHERE
         b.name ILIKE $1 OR
         b.maker ILIKE $1 OR
         l.name ILIKE $1
       GROUP BY b.id
       ORDER BY b.updated_at DESC`,
      [`%${keyword}%`]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

module.exports = {
  saveCrawlData,
  getAllBikes,
  getListingsByBikeId,
  getBikeWithListings,
  searchBikes
};
