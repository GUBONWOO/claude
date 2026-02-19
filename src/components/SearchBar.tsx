import React from "react";
import BIKE_MODELS, { SiteSource, SOURCE_LABELS } from "../config/bikes";
import { CrawlResult } from "../utils/crawler";

interface SearchBarProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  selectedModel: string;
  onModelChange: (value: string) => void;
  selectedSource: SiteSource | "";
  onSourceChange: (value: SiteSource | "") => void;
  results: CrawlResult[];
}

function SearchBar({
  keyword,
  onKeywordChange,
  selectedModel,
  onModelChange,
  selectedSource,
  onSourceChange,
  results,
}: SearchBarProps) {
  const modelNames = Array.from(
    new Set(
      BIKE_MODELS
        .filter((m) => !selectedSource || m.source === selectedSource)
        .map((m) => m.name)
    )
  );

  const totalCount = results.reduce((sum, r) => sum + r.listings.length, 0);

  const countBySource = (source: SiteSource) =>
    results
      .filter((r) => r.model.source === source)
      .reduce((sum, r) => sum + r.listings.length, 0);

  return (
    <div className="search-bar">
      <div className="search-bar__filters">
        <button
          type="button"
          className={`filter-pill ${selectedSource === "" ? "filter-pill--active" : ""}`}
          onClick={() => {
            onSourceChange("");
            onModelChange("");
          }}
        >
          전체
          {totalCount > 0 && (
            <span className="filter-pill__count">{totalCount}</span>
          )}
        </button>
        {(Object.keys(SOURCE_LABELS) as SiteSource[]).map((key) => {
          const count = countBySource(key);
          return (
            <button
              type="button"
              key={key}
              className={`filter-pill filter-pill--${key} ${
                selectedSource === key
                  ? `filter-pill--active filter-pill--active-${key}`
                  : ""
              }`}
              onClick={() => {
                onSourceChange(key);
                onModelChange("");
              }}
            >
              <span className="filter-pill__dot" />
              {SOURCE_LABELS[key]}
              {count > 0 && (
                <span className="filter-pill__count">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="search-bar__inputs">
        <div className="search-select-wrap">
          <select
            className="search-select"
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
          >
            <option value="">전체 모델</option>
            {modelNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="search-input-wrap">
          <svg
            className="search-input-icon"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M13.5 13.5L17 17"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="검색어 입력 — 모델명, 년식, 주행거리..."
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
          />
          {keyword && (
            <button
              type="button"
              className="search-input-clear"
              onClick={() => onKeywordChange("")}
              aria-label="초기화"
            >
              <svg viewBox="0 0 12 12" fill="none" width="10" height="10">
                <path
                  d="M1 1l10 10M11 1L1 11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchBar;
