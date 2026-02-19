import { CrawlResult } from "./crawler";

const API_URL = "http://localhost:3001/api/crawl-data";

export async function saveCrawlData(results: CrawlResult[]): Promise<void> {
  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(results),
    });
  } catch {
    // 저장 실패 시 무시
  }
}

export async function loadCrawlData(): Promise<CrawlResult[] | null> {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    return data as CrawlResult[] | null;
  } catch {
    return null;
  }
}
