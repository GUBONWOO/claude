import { CrawlResult } from "./crawler";

const STORAGE_KEY = "goobike_crawl_data";

export function saveCrawlData(results: CrawlResult[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  } catch {
    // localStorage 용량 초과 시 무시
  }
}

export function loadCrawlData(): CrawlResult[] | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as CrawlResult[];
  } catch {
    return null;
  }
}
