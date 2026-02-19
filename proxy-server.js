const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

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

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
