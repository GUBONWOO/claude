import React from "react";
import { CrawlResult } from "../utils/crawler";
import BIKE_MODELS, { SOURCE_LABELS } from "../config/bikes";

interface StatusBarProps {
  results: CrawlResult[];
  loading: boolean;
  lastCrawled: Date | null;
  onRefresh: () => void;
}

function StatusBar({ results, loading, lastCrawled, onRefresh }: StatusBarProps) {
  const totalListings = results.reduce((sum, r) => sum + r.listings.length, 0);
  const errors = results.filter((r) => r.error);

  return (
    <section className="status-bar">
      <div className="status-bar__summary">
        <div className="status-bar__stats">
          <div className="status-stat">
            <span className="status-stat__number">{totalListings}</span>
            <span className="status-stat__label">매물</span>
          </div>
          <div className="status-stat__divider" />
          <div className="status-stat">
            <span className="status-stat__number">
              {new Set(BIKE_MODELS.map((m) => m.name)).size}
            </span>
            <span className="status-stat__label">모델</span>
          </div>
          {lastCrawled && (
            <>
              <div className="status-stat__divider" />
              <span className="status-bar__crawl-time">
                {lastCrawled.toLocaleString("ko-KR")}
              </span>
            </>
          )}
          {loading && <span className="status-bar__spinner" />}
        </div>
        <button className="btn-refresh" onClick={onRefresh} disabled={loading}>
          {loading ? "크롤링 중..." : "새로고침"}
        </button>
      </div>

      <div className="status-bar__sources">
        {(["goobike", "rebirth", "mercari", "yahoo"] as const).map((source) => {
          const sourceResults = results.filter((r) => r.model.source === source);
          if (sourceResults.length === 0) return null;
          return (
            <div key={source} className={`source-row source-row--${source}`}>
              <span className="source-row__dot" />
              <span className="source-row__label">{SOURCE_LABELS[source]}</span>
              <div className="source-row__chips">
                {sourceResults.map((r) => (
                  <span
                    key={r.model.id}
                    className={`source-chip ${r.error ? "source-chip--error" : ""}`}
                  >
                    {r.model.name}
                    <span className="source-chip__count">
                      {r.error ? "에러" : r.listings.length}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {errors.length > 0 && (
        <p className="status-bar__errors">
          {errors.map((e) => `${e.model.name}: ${e.error}`).join(" · ")}
        </p>
      )}
    </section>
  );
}

export default StatusBar;
