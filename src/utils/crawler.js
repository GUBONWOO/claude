const PROXY_URL = "https://api.allorigins.win/raw?url=";

/**
 * CORS 프록시를 통해 URL의 HTML을 가져온다
 */
export async function fetchPage(url) {
  const response = await fetch(PROXY_URL + encodeURIComponent(url));
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

/**
 * HTML 문자열에서 텍스트와 링크를 파싱한다
 */
export function parseHTML(html, sourceUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // 제목 추출
  const title = doc.querySelector("title")?.textContent?.trim() || sourceUrl;

  // 본문 텍스트 추출 (script, style 제외)
  doc.querySelectorAll("script, style, noscript").forEach((el) => el.remove());
  const bodyText = doc.body?.textContent?.replace(/\s+/g, " ").trim() || "";

  // 링크 추출
  const links = [];
  doc.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    const text = a.textContent?.trim();
    if (href && text) {
      try {
        const absoluteUrl = new URL(href, sourceUrl).href;
        links.push({ url: absoluteUrl, text });
      } catch {
        // 잘못된 URL은 무시
      }
    }
  });

  return { title, bodyText, links, sourceUrl };
}

/**
 * 여러 URL을 크롤링하여 파싱된 데이터를 반환한다
 */
export async function crawlPages(urls) {
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const html = await fetchPage(url);
      return parseHTML(html, url);
    })
  );

  return results
    .filter((r) => r.status === "fulfilled")
    .map((r) => ({
      ...r.value,
      crawledAt: new Date().toISOString(),
    }));
}

/**
 * 크롤링 데이터에서 키워드 검색
 */
export function searchCrawledData(data, keyword) {
  if (!keyword.trim()) return data;

  const lower = keyword.toLowerCase();
  return data
    .map((page) => {
      const titleMatch = page.title.toLowerCase().includes(lower);
      const bodyMatch = page.bodyText.toLowerCase().includes(lower);
      const linkMatches = page.links.filter(
        (link) =>
          link.text.toLowerCase().includes(lower) ||
          link.url.toLowerCase().includes(lower)
      );

      if (!titleMatch && !bodyMatch && linkMatches.length === 0) return null;

      // 검색어 주변 텍스트 스니펫 생성
      let snippet = "";
      if (bodyMatch) {
        const idx = page.bodyText.toLowerCase().indexOf(lower);
        const start = Math.max(0, idx - 80);
        const end = Math.min(page.bodyText.length, idx + keyword.length + 80);
        snippet =
          (start > 0 ? "..." : "") +
          page.bodyText.slice(start, end) +
          (end < page.bodyText.length ? "..." : "");
      }

      return {
        ...page,
        snippet,
        titleMatch,
        bodyMatch,
        linkMatches,
      };
    })
    .filter(Boolean);
}
