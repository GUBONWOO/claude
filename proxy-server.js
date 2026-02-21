const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const db = require("./database/crawler-db");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// DPoP 토큰 생성
function generateDPoP(method, htu) {
  const ec = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
  const jwk = ec.publicKey.export({ format: "jwk" });
  const header = JSON.stringify({
    typ: "dpop+jwt",
    alg: "ES256",
    jwk: { kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y },
  });
  const payload = JSON.stringify({
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID(),
    htm: method,
    htu: htu,
  });
  const si =
    Buffer.from(header).toString("base64url") +
    "." +
    Buffer.from(payload).toString("base64url");
  const sig = crypto.sign("SHA256", Buffer.from(si), {
    key: ec.privateKey,
    dsaEncoding: "ieee-p1363",
  });
  return si + "." + sig.toString("base64url");
}

// メルカリ API プロキシ
app.post("/api/mercari", async (req, res) => {
  console.log("[Mercari Proxy] Request received, keyword:", req.body?.searchCondition?.keyword);
  try {
    const apiUrl = "https://api.mercari.jp/v2/entities:search";
    const dpop = generateDPoP("POST", apiUrl);

    // 필수 필드 보완
    const body = {
      userId: "",
      pageSize: req.body.pageSize || 120,
      pageToken: req.body.pageToken || "",
      searchSessionId: crypto.randomUUID(),
      indexRouting: "INDEX_ROUTING_UNSPECIFIED",
      searchCondition: {
        keyword: req.body.searchCondition?.keyword || "",
        excludeKeyword: "",
        sort: req.body.searchCondition?.sort || "SORT_CREATED_TIME",
        order: req.body.searchCondition?.order || "ORDER_DESC",
        status: req.body.searchCondition?.status || ["STATUS_ON_SALE"],
        sizeId: [],
        categoryId: req.body.searchCondition?.categoryId || [],
        brandId: [],
        sellerId: [],
        priceMin: 0,
        priceMax: 0,
        itemConditionId: [],
        shippingPayerId: [],
        shippingFromArea: [],
        shippingMethod: [],
        colorId: [],
        hasCoupon: false,
        attributes: [],
        itemTypes: [],
        skuIds: [],
      },
      defaultDatasets:
        req.body.defaultDatasets || ["DATASET_TYPE_MERCARI"],
      serviceFrom: req.body.serviceFrom || "suruga",
      withItemBrand: true,
      withItemSize: true,
      withItemPromotions: true,
      withItemSizes: true,
      withShopname: false,
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Platform": "web",
        DPoP: dpop,
        Accept: "application/json, text/plain, */*",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("[Mercari Proxy] Response status:", response.status, "items:", data.items?.length || 0);
    res.status(response.status).json(data);
  } catch (err) {
    console.error("[Mercari Proxy] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ヤフオク HTML プロキシ
app.get("/api/yahoo", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "url parameter required" });
  console.log("[Yahoo Proxy] Fetching:", url);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ja,en;q=0.9",
      },
    });
    const html = await response.text();
    console.log("[Yahoo Proxy] Response status:", response.status, "length:", html.length);
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    console.error("[Yahoo Proxy] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 범용 HTML プロキシ (GooBike, リバースオート 등)
app.get("/api/proxy", async (req, res) => {
  const url = req.query.url;
  const encoding = req.query.encoding || "utf-8";
  if (!url) return res.status(400).json({ error: "url parameter required" });
  console.log("[HTML Proxy] Fetching:", url);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ja,en;q=0.9",
      },
    });
    const buffer = await response.arrayBuffer();
    const decoded = new TextDecoder(encoding).decode(buffer);
    console.log("[HTML Proxy] Response status:", response.status, "length:", decoded.length);
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(decoded);
  } catch (err) {
    console.error("[HTML Proxy] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 크롤링 데이터 저장 (DB - 완전 동기화)
app.post("/api/crawl-data", async (req, res) => {
  try {
    // DB에 저장 (기존 데이터는 삭제되고 크롤링 결과만 유지)
    const results = [];
    let totalDeleted = 0;
    let totalInserted = 0;

    for (const item of req.body) {
      const result = await db.saveCrawlData(item.model, item.listings);
      results.push(result);
      totalDeleted += result.deletedCount;
      totalInserted += result.insertedCount;
    }

    console.log(`[DB] 동기화 완료 - 모델: ${results.length}개, 삭제: ${totalDeleted}개, 추가: ${totalInserted}개`);

    res.json({
      ok: true,
      stats: {
        models: results.length,
        deleted: totalDeleted,
        inserted: totalInserted
      },
      dbResults: results
    });
  } catch (err) {
    console.error("[DB] Save error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 크롤링 데이터 불러오기 (DB)
app.get("/api/crawl-data", async (req, res) => {
  try {
    // DB에서 데이터 조회
    const bikes = await db.getAllBikes();

    if (!bikes || bikes.length === 0) {
      console.log("[DB] No data found in database");
      return res.json([]);
    }

    console.log("[DB] Loaded crawl data from database:", bikes.length, "models");

    // DB 데이터를 기존 형식으로 변환
    const result = [];
    for (const bike of bikes) {
      const listings = await db.getListingsByBikeId(bike.id);
      result.push({
        model: {
          id: bike.model_id,
          name: bike.name,
          maker: bike.maker,
          source: bike.source,
          url: bike.url
        },
        listings: listings.map(l => ({
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
      });
    }
    res.json(result);
  } catch (err) {
    console.error("[DB] Load error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DB에서 특정 모델 조회
app.get("/api/bikes/:modelId", async (req, res) => {
  try {
    const data = await db.getBikeWithListings(req.params.modelId);
    if (!data) return res.status(404).json({ error: "Bike not found" });
    res.json(data);
  } catch (err) {
    console.error("[DB] Get bike error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DB에서 바이크 검색
app.get("/api/bikes/search/:keyword", async (req, res) => {
  try {
    const bikes = await db.searchBikes(req.params.keyword);
    res.json(bikes);
  } catch (err) {
    console.error("[DB] Search error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DB 모든 바이크 목록 조회
app.get("/api/bikes", async (req, res) => {
  try {
    const bikes = await db.getAllBikes();
    res.json(bikes);
  } catch (err) {
    console.error("[DB] Get all bikes error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 환경변수 검증
if (!process.env.PORT) {
  console.warn('⚠️  PORT not set in .env, using default 3001');
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
});
