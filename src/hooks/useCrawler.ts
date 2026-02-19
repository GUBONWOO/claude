import { useState, useEffect, useCallback, useRef } from "react";
import { crawlAllModels, CrawlResult } from "../utils/crawler";
import { saveCrawlData, loadCrawlData } from "../utils/storage";
import BIKE_MODELS, { CRAWL_INTERVAL } from "../config/bikes";

// 모델별로 새 크롤링 결과를 기존 데이터에 병합
function mergeAllResults(existing: CrawlResult[], newResults: CrawlResult[]): CrawlResult[] {
  const merged = [...existing];
  for (const newResult of newResults) {
    const idx = merged.findIndex((r) => r.model.id === newResult.model.id);
    if (idx >= 0) {
      merged[idx] = newResult;
    } else {
      merged.push(newResult);
    }
  }
  return merged;
}

export function useCrawler() {
  const [results, setResults] = useState<CrawlResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastCrawled, setLastCrawled] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultsRef = useRef<CrawlResult[]>([]);
  resultsRef.current = results;

  const loadSaved = useCallback(async () => {
    const saved = await loadCrawlData();
    if (saved && saved.length > 0) {
      setResults(saved);
      resultsRef.current = saved;
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
      // 크롤링 중에는 화면 갱신하지 않음 — 기존 데이터 유지
      const crawled = await crawlAllModels(BIKE_MODELS);
      // 전체 완료 후 기존 데이터와 병합 → 화면 갱신 + 파일 저장
      const merged = mergeAllResults(resultsRef.current, crawled);
      setResults(merged);
      resultsRef.current = merged;
      setLastCrawled(new Date());
      saveCrawlData(merged);
    } catch {
      // 개별 모델 에러는 CrawlResult.error에 포함됨
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSaved();
    doCrawl();
    intervalRef.current = setInterval(doCrawl, CRAWL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [doCrawl, loadSaved]);

  return { results, loading, lastCrawled, refresh: doCrawl };
}
