const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const db = require("./database/crawler-db");
const authDb = require("./database/auth-db");
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || "changeme-in-production";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID || "";
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI || "http://localhost:8080/auth/kakao/callback";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Google OAuth 팝업 허용을 위한 COOP 헤더 설정
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

// 프로덕션(Docker/Railway)에서 React 빌드 파일 서빙
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "build")));
}

// JWT 인증 미들웨어
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "로그인이 필요합니다" });
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "유효하지 않은 토큰입니다" });
  }
}

// 어드민 전용 미들웨어
function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "관리자 권한이 필요합니다" });
  }
  next();
}

// 회원가입
app.post("/api/auth/register", async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ error: "아이디, 비밀번호, 이메일을 모두 입력해주세요" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "비밀번호는 6자 이상이어야 합니다" });
  }
  try {
    const duplicate = await authDb.checkDuplicate(username, email);
    if (duplicate === "username") return res.status(409).json({ error: "이미 사용중인 아이디입니다" });
    if (duplicate === "email") return res.status(409).json({ error: "이미 사용중인 이메일입니다" });

    const user = await authDb.createUser(username, password, email);
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(201).json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error("[Auth] Register error:", err.message);
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

// 로그인
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "아이디와 비밀번호를 입력해주세요" });
  }
  try {
    const user = await authDb.findUserByUsername(username);
    if (!user) return res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다" });

    const valid = await authDb.verifyPassword(password, user.password);
    if (!valid) return res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다" });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error("[Auth] Login error:", err.message);
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

// 토큰 검증 (현재 로그인 유저 확인)
app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Google OAuth 로그인
app.post("/api/auth/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: "credential이 없습니다" });
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const username = payload.name || payload.email.split("@")[0];
    const email = payload.email;

    const user = await authDb.upsertGoogleUser(username, email);
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error("[Auth] Google login error:", err.message);
    res.status(401).json({ error: "Google 인증에 실패했습니다" });
  }
});

// Kakao OAuth - 로그인 페이지로 리다이렉트
app.get("/auth/kakao", (req, res) => {
  const kakaoAuthUrl =
    `https://kauth.kakao.com/oauth/authorize` +
    `?client_id=${KAKAO_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}` +
    `&response_type=code`;
  res.redirect(kakaoAuthUrl);
});

// Kakao OAuth - 콜백 처리
app.get("/auth/kakao/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("카카오 인증 코드가 없습니다");
  try {
    // 1) code로 access_token 교환
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: KAKAO_CLIENT_ID,
        redirect_uri: KAKAO_REDIRECT_URI,
        code,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[Auth] Kakao token error:", tokenData);
      return res.status(401).send("카카오 토큰 발급 실패");
    }

    // 2) access_token으로 사용자 정보 조회
    const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const kakaoUser = await userRes.json();
    const kakaoId = String(kakaoUser.id);
    const nickname =
      kakaoUser.kakao_account?.profile?.nickname ||
      kakaoUser.properties?.nickname ||
      `kakao_${kakaoId}`;

    // 3) DB upsert 후 JWT 발급
    const user = await authDb.upsertKakaoUser(nickname, kakaoId);
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 4) 토큰을 프론트엔드로 전달 - COOP을 unsafe-none으로 설정해야 postMessage가 허용됨
    res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
    res.send(`<!DOCTYPE html>
<html><body><script>
  window.opener && window.opener.postMessage({ type: 'KAKAO_LOGIN', token: '${token}' }, '*');
  window.close();
</script></body></html>`);
  } catch (err) {
    console.error("[Auth] Kakao callback error:", err.message);
    res.status(500).send("카카오 로그인 처리 중 오류가 발생했습니다");
  }
});

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

// 크롤링 데이터 저장 (DB - 완전 동기화, 어드민 전용)
app.post("/api/crawl-data", requireAuth, requireAdmin, async (req, res) => {
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
// 프로덕션에서 /api 이외의 모든 요청은 React 앱으로 전달
if (process.env.NODE_ENV === "production") {
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
  });
}

// Railway는 PORT를 자동 주입, 로컬은 SERVER_PORT 사용
const PORT = process.env.PORT || process.env.SERVER_PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
});
