import React from "react";
import { CrawlResult } from "../utils/crawler";

interface StatusBarProps {
  results: CrawlResult[];
  loading: boolean;
  lastCrawled: Date | null;
  onRefresh?: () => void;
}

function StatusBar({ results, loading, lastCrawled, onRefresh }: StatusBarProps) {
  const totalListings = results.reduce((sum, r) => sum + r.listings.length, 0);

  return (
    <section className="status-bar">
      <div className="status-bar__summary">
        <div className="status-bar__stats">
          <span className="status-bar__total">
            총 <strong>{totalListings}</strong>대
          </span>
          {lastCrawled && (
            <span className="status-bar__crawl-time">
              {lastCrawled.toLocaleString("ko-KR")}
            </span>
          )}
          {loading && <span className="status-bar__spinner" />}
        </div>
        {onRefresh && (
          <button className="btn-refresh" onClick={onRefresh} disabled={loading}>
            {loading ? "크롤링 중..." : "새로고침"}
          </button>
        )}
      </div>
    </section>
  );
}

export default StatusBar;
