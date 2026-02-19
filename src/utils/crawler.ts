import { BikeModel, SiteSource, REQUEST_DELAY, MERCARI_CATEGORY_ID } from "../config/bikes";

const PROXY_URL = "https://api.codetabs.com/v1/proxy/?quest=";

export interface BikeListing {
  name: string;
  price: string;
  totalPrice: string;
  year: string;
  mileage: string;
  detailUrl: string;
  imageUrl: string;
  model: string;
  maker: string;
  source: SiteSource;
}

export interface CrawlResult {
  model: BikeModel;
  listings: BikeListing[];
  crawledAt: string;
  error?: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MIN_PRICE_YEN = 50000;

// 가격 문자열에서 엔화 금액 추출
function parsePriceToYen(price: string): number {
  if (!price) return 0;
  // "XX.X万円" or "XX万円" 형식
  const manMatch = price.match(/([\d.]+)\s*万/);
  if (manMatch) return parseFloat(manMatch[1]) * 10000;
  // "XXX,XXX円" or "XXX,XXX" 형식
  const yenMatch = price.replace(/[,、]/g, "").match(/([\d]+)/);
  if (yenMatch) return parseInt(yenMatch[1], 10);
  return 0;
}

// 저가 매물 필터 (악세사리 등 제외)
function filterLowPriceListings(listings: BikeListing[]): BikeListing[] {
  return listings.filter((l) => {
    const yen = parsePriceToYen(l.price);
    return yen === 0 || yen >= MIN_PRICE_YEN;
  });
}

// 프록시를 통해 HTML 가져오기 (인코딩 자동 감지)
async function fetchPageAsText(url: string, encoding: string = "utf-8"): Promise<string> {
  const proxyUrl = PROXY_URL + url;
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder(encoding);
  return decoder.decode(buffer);
}

// ============================================================
// GooBike 파서
// ============================================================
function parseGoobikeListings(html: string, model: BikeModel): BikeListing[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const listings: BikeListing[] = [];

  const bikeImgDivs = doc.querySelectorAll("div.bike_img");

  bikeImgDivs.forEach((imgDiv) => {
    const link = imgDiv.querySelector('a[href*="/spread/"]');
    if (!link) return;
    const href = link.getAttribute("href") || "";
    const detailUrl = `https://www.goobike.com${href}`;

    const img = imgDiv.querySelector("img");
    const imageUrl = img?.getAttribute("real-url") || img?.getAttribute("src") || "";

    const parent = imgDiv.parentElement;
    const infoDiv = parent?.querySelector("div.bike_info");
    if (!infoDiv) return;

    const titleLink = infoDiv.querySelector("a.detail_kakaku_link");
    const name = titleLink?.textContent?.trim() || "";
    if (!name) return;

    const priceSpan = infoDiv.querySelector("span.num_ff:not(.total)");
    let price = "";
    if (priceSpan) {
      const b = priceSpan.querySelector("b");
      const afterB = priceSpan.textContent?.replace(b?.textContent || "", "") || "";
      price = (b?.textContent || "") + afterB.replace(/万円/, "").trim();
      price = price.trim() + "万円";
    }

    const totalSpan = infoDiv.querySelector("span.num_ff.total");
    let totalPrice = "";
    if (totalSpan) {
      const b = totalSpan.querySelector("b");
      const afterB = totalSpan.textContent?.replace(b?.textContent || "", "") || "";
      totalPrice = (b?.textContent || "") + afterB.replace(/万円/, "").trim();
      totalPrice = totalPrice.trim() + "万円";
    }

    const specBolds = infoDiv.querySelectorAll("div.cont01 li b");
    let year = "";
    let mileage = "";
    specBolds.forEach((b) => {
      const text = b.textContent?.trim() || "";
      if (/\d{4}年/.test(text) && !year) year = text;
      if (/[\d,]+Km/i.test(text)) mileage = text;
    });

    listings.push({
      name,
      price,
      totalPrice,
      year,
      mileage,
      detailUrl,
      imageUrl: imageUrl.includes("loading") || imageUrl.includes("nophoto") ? "" : imageUrl,
      model: model.name,
      maker: model.maker,
      source: "goobike",
    });
  });

  return listings;
}

// ============================================================
// リバースオート 파서
// HTML 구조:
//   <section class="clearfix">
//     <p class="shop">점포명</p>
//     <header><h2><a href="/recent/bikes/ID">모델명</a></h2></header>
//     <div class="thumb"><a><img src="이미지"></a></div>
//     <div class="itemInfo">
//       <table> td: 년식, 색, 주행거리, 차검, 배기량 </table>
//       <table> td.price > em: 가격(円) </table>
//     </div>
//   </section>
// ============================================================
function parseRebirthListings(html: string, model: BikeModel): BikeListing[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const listings: BikeListing[] = [];

  const sections = doc.querySelectorAll("section.clearfix");

  sections.forEach((section) => {
    // 매물명 + 상세 링크
    const titleLink = section.querySelector("header h2 a");
    if (!titleLink) return;
    const name = titleLink.textContent?.trim() || "";
    const href = titleLink.getAttribute("href") || "";
    const detailUrl = href.startsWith("http") ? href : `https://re-birth8.com${href}`;

    // 이미지
    const img = section.querySelector("div.thumb img");
    let imageUrl = img?.getAttribute("src") || "";
    if (imageUrl && !imageUrl.startsWith("http")) {
      imageUrl = `https://re-birth8.com${imageUrl}`;
    }

    // 점포
    const shopEl = section.querySelector("p.shop");
    const shop = shopEl?.textContent?.trim() || "";

    // 스펙 테이블: 첫 번째 테이블의 두 번째 tr에 td들
    const tables = section.querySelectorAll("div.itemInfo table");
    let year = "";
    let mileage = "";
    let price = "";

    if (tables.length >= 1) {
      const specTds = tables[0].querySelectorAll("tr:last-child td");
      // 순서: 년식, 색, 주행거리, 차검, 배기량
      if (specTds.length >= 1) year = specTds[0]?.textContent?.trim() || "";
      if (specTds.length >= 3) mileage = specTds[2]?.textContent?.trim() || "";
    }

    if (tables.length >= 2) {
      const priceEm = tables[1].querySelector("td.price em");
      price = priceEm?.textContent?.trim() || "";
    }

    if (!name) return;

    listings.push({
      name: `${name}${shop ? ` (${shop})` : ""}`,
      price,
      totalPrice: "",
      year,
      mileage,
      detailUrl,
      imageUrl,
      model: model.name,
      maker: model.maker,
      source: "rebirth",
    });
  });

  return listings;
}

// ============================================================
// メルカリ API (로컬 프록시 경유)
// ============================================================
interface MercariItem {
  id: string;
  name: string;
  price: string;
  thumbnails: string[];
  status: string;
  categoryId: string;
  itemSize?: { name: string } | null;
}

const MERCARI_PROXY = "http://localhost:3001/api/mercari";
const YAHOO_PROXY = "http://localhost:3001/api/yahoo";

async function crawlMercari(model: BikeModel): Promise<BikeListing[]> {
  const body = {
    searchCondition: {
      keyword: model.url,
      categoryId: [MERCARI_CATEGORY_ID],
      sort: "SORT_CREATED_TIME",
      order: "ORDER_DESC",
      status: ["STATUS_ON_SALE"],
    },
    defaultDatasets: ["DATASET_TYPE_MERCARI"],
    serviceFrom: "suruga",
    pageSize: 120,
    pageToken: "",
  };

  const response = await fetch(MERCARI_PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Mercari API HTTP ${response.status}`);
  }

  const data = await response.json();
  const items: MercariItem[] = data.items || [];

  // 検索条件が似ている商品 제외: categoryId가 949(オートバイ車体)인 것만
  return items
    .filter((item) => String(item.categoryId) === String(MERCARI_CATEGORY_ID))
    .map((item) => ({
      name: item.name,
      price: item.price ? `${Number(item.price).toLocaleString()}円` : "",
      totalPrice: "",
      year: "",
      mileage: item.itemSize?.name || "",
      detailUrl: `https://jp.mercari.com/item/${item.id}`,
      imageUrl: item.thumbnails?.[0] || "",
      model: model.name,
      maker: model.maker,
      source: "mercari" as SiteSource,
    }));
}

// ============================================================
// ヤフオク 파서
// ============================================================
function parseYahooListings(html: string, model: BikeModel): BikeListing[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const listings: BikeListing[] = [];

  const items = doc.querySelectorAll("li.Product");

  items.forEach((item) => {
    // 타이틀 + 상세 링크
    const titleLink = item.querySelector("a.Product__titleLink");
    if (!titleLink) return;
    const name = titleLink.getAttribute("data-auction-title") || titleLink.textContent?.trim() || "";
    const detailUrl = titleLink.getAttribute("href") || "";

    // 이미지
    const img = item.querySelector("img.Product__imageData");
    const imageUrl = img?.getAttribute("src") || "";

    // 현재 가격
    const priceValues = item.querySelectorAll(".Product__price");
    let price = "";
    let totalPrice = "";
    priceValues.forEach((p) => {
      const label = p.querySelector(".Product__label")?.textContent?.trim() || "";
      const value = p.querySelector(".Product__priceValue")?.textContent?.trim() || "";
      if (label === "現在") price = value;
      if (label === "即決") totalPrice = value;
    });

    // 남은 시간
    const timeEl = item.querySelector(".Product__time");
    const remaining = timeEl?.textContent?.trim() || "";

    if (!name) return;

    listings.push({
      name,
      price,
      totalPrice,
      year: "",
      mileage: remaining ? `残り${remaining}` : "",
      detailUrl,
      imageUrl,
      model: model.name,
      maker: model.maker,
      source: "yahoo",
    });
  });

  return listings;
}

async function crawlYahoo(model: BikeModel): Promise<BikeListing[]> {
  const response = await fetch(`${YAHOO_PROXY}?url=${encodeURIComponent(model.url)}`);
  if (!response.ok) {
    throw new Error(`Yahoo Proxy HTTP ${response.status}`);
  }
  const html = await response.text();
  return parseYahooListings(html, model);
}

// ============================================================
// 모델별 크롤링
// ============================================================
async function crawlModel(model: BikeModel): Promise<BikeListing[]> {
  let listings: BikeListing[];
  if (model.source === "goobike") {
    listings = await crawlGoobikePages(model);
  } else if (model.source === "mercari") {
    listings = await crawlMercari(model);
  } else if (model.source === "yahoo") {
    listings = await crawlYahoo(model);
  } else {
    const html = await fetchPageAsText(model.url, "utf-8");
    listings = parseRebirthListings(html, model);
  }
  return filterLowPriceListings(listings);
}

// GooBike 페이지네이션
async function crawlGoobikePages(model: BikeModel, maxPages: number = 3): Promise<BikeListing[]> {
  const allListings: BikeListing[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const pageUrl =
      page === 1
        ? model.url
        : model.url.replace("index.html", `index${page}.html`);

    if (page > 1) await delay(REQUEST_DELAY);

    try {
      const html = await fetchPageAsText(pageUrl, "euc-jp");
      const listings = parseGoobikeListings(html, model);
      if (listings.length === 0) break;
      allListings.push(...listings);
    } catch {
      break;
    }
  }

  return allListings;
}

// 모든 모델 순차 크롤링
export async function crawlAllModels(models: BikeModel[]): Promise<CrawlResult[]> {
  const results: CrawlResult[] = [];

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    if (i > 0) await delay(REQUEST_DELAY);

    try {
      const listings = await crawlModel(model);
      results.push({ model, listings, crawledAt: new Date().toISOString() });
    } catch (err: any) {
      results.push({ model, listings: [], crawledAt: new Date().toISOString(), error: err.message });
    }
  }

  return results;
}

// 키워드 검색
export function searchListings(results: CrawlResult[], keyword: string): BikeListing[] {
  const allListings = results.flatMap((r) => r.listings);
  if (!keyword.trim()) return allListings;

  const lower = keyword.toLowerCase();
  return allListings.filter(
    (listing) =>
      listing.name.toLowerCase().includes(lower) ||
      listing.price.toLowerCase().includes(lower) ||
      listing.year.toLowerCase().includes(lower) ||
      listing.mileage.toLowerCase().includes(lower) ||
      listing.model.toLowerCase().includes(lower) ||
      listing.maker.toLowerCase().includes(lower) ||
      listing.detailUrl.toLowerCase().includes(lower)
  );
}
