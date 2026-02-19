import { useState, useEffect, useCallback, useRef } from "react";
import { crawlAllModels, CrawlResult } from "../utils/crawler";
import { saveCrawlData, loadCrawlData } from "../utils/storage";
import BIKE_MODELS, { CRAWL_INTERVAL } from "../config/bikes";

export function useCrawler() {
  // 표시용 데이터 (저장된 JSON 기반)
  const [results, setResults] = useState<CrawlResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastCrawled, setLastCrawled] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 저장된 데이터 불러오기
  const loadSaved = useCallback(() => {
    const saved = loadCrawlData();
    if (saved && saved.length > 0) {
      setResults(saved);
      const latest = saved.reduce(
        (max, r) => (r.crawledAt > max ? r.crawledAt : max),
        saved[0].crawledAt
      );
      setLastCrawled(new Date(latest));
    }
  }, []);

  const doCrawl = useCallback(async () => {
    setLoading(true);
    try {
      // 크롤링 중에는 기존 results를 건드리지 않음
      const data = await crawlAllModels(BIKE_MODELS);
      // 크롤링 완료 → JSON 저장
      saveCrawlData(data);
      // 저장된 데이터로 갱신 (리프레시)
      setResults(data);
      setLastCrawled(new Date());
    } catch {
      // 개별 모델 에러는 CrawlResult.error에 포함됨
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1) 저장된 데이터 먼저 표시
    loadSaved();
    // 2) 백그라운드 크롤링 시작
    doCrawl();
    intervalRef.current = setInterval(doCrawl, CRAWL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [doCrawl, loadSaved]);

  return { results, loading, lastCrawled, refresh: doCrawl };
}
