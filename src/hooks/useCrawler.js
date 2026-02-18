import { useState, useEffect, useCallback, useRef } from "react";
import { crawlPages } from "../utils/crawler";

const CRAWL_INTERVAL = 10 * 60 * 1000; // 10분

export function useCrawler(urls) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastCrawled, setLastCrawled] = useState(null);
  const intervalRef = useRef(null);

  const doCrawl = useCallback(async () => {
    if (urls.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const results = await crawlPages(urls);
      setData(results);
      setLastCrawled(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [urls]);

  // 최초 크롤링 + 10분 간격 갱신
  useEffect(() => {
    doCrawl();
    intervalRef.current = setInterval(doCrawl, CRAWL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [doCrawl]);

  return { data, loading, error, lastCrawled, refresh: doCrawl };
}
