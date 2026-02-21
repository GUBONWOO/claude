-- 바이크 모델 테이블
CREATE TABLE IF NOT EXISTS bikes (
    id SERIAL PRIMARY KEY,
    model_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    maker VARCHAR(255) NOT NULL,
    source VARCHAR(100) NOT NULL,
    url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 바이크 리스팅 테이블
CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY,
    bike_id INTEGER REFERENCES bikes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price VARCHAR(100),
    total_price VARCHAR(100),
    year VARCHAR(50),
    mileage VARCHAR(100),
    detail_url TEXT,
    image_url TEXT,
    model VARCHAR(255),
    maker VARCHAR(255),
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bikes_model_id ON bikes(model_id);
CREATE INDEX IF NOT EXISTS idx_bikes_maker ON bikes(maker);
CREATE INDEX IF NOT EXISTS idx_listings_bike_id ON listings(bike_id);
CREATE INDEX IF NOT EXISTS idx_listings_model ON listings(model);
CREATE INDEX IF NOT EXISTS idx_listings_source ON listings(source);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
DROP TRIGGER IF EXISTS update_bikes_updated_at ON bikes;
CREATE TRIGGER update_bikes_updated_at
    BEFORE UPDATE ON bikes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
