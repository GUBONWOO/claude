import React, { useState, useEffect } from "react";
import { BikeListing } from "../utils/crawler";
import { SOURCE_LABELS } from "../config/bikes";
import { SortKey } from "../App";

const PER_PAGE = 10;

interface SearchResultsProps {
  listings: BikeListing[];
  keyword: string;
  sortKey: SortKey;
  onSortChange: (key: SortKey) => void;
}

function highlightText(text: string, keyword: string): React.ReactNode {
  if (!keyword || !text) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i}>{part}</mark>
    ) : (
      part
    )
  );
}

function SearchResults({ listings, keyword, sortKey, onSortChange }: SearchResultsProps) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [keyword, listings.length, sortKey]);

  if (listings.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">
          <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
            <path d="M16 20h16M16 28h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="empty-state__title">매물이 없습니다</p>
        <p className="empty-state__subtitle">검색어나 필터를 변경해 보세요</p>
      </div>
    );
  }

  const totalPages = Math.ceil(listings.length / PER_PAGE);
  const start = (page - 1) * PER_PAGE;
  const pageListings = listings.slice(start, start + PER_PAGE);

  return (
    <div>
      {/* Toolbar */}
      <div className="results-toolbar">
        <p className="results-toolbar__count">
          <strong>{listings.length}</strong>대의 매물
          <span className="results-toolbar__range">
            ({start + 1}–{Math.min(start + PER_PAGE, listings.length)})
          </span>
        </p>
        <select
          className="sort-select"
          value={sortKey}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
        >
          <option value="none">기본 정렬</option>
          <option value="price_asc">금액 낮은순</option>
          <option value="price_desc">금액 높은순</option>
          <option value="year_desc">연식 최신순</option>
          <option value="year_asc">연식 오래된순</option>
          <option value="mileage_asc">주행거리 적은순</option>
          <option value="mileage_desc">주행거리 많은순</option>
        </select>
      </div>

      {/* Listings */}
      <div className="listings-grid">
        {pageListings.map((listing, idx) => (
          <article
            key={start + idx}
            className={`listing-card listing-card--${listing.source}`}
          >
            <div className="listing-card__image-wrap">
              {listing.imageUrl ? (
                <img
                  src={listing.imageUrl}
                  alt={listing.name}
                  className="listing-card__image"
                  onError={(e) => {
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) parent.classList.add("listing-card__image-wrap--error");
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="listing-card__image-placeholder">
                  <svg viewBox="0 0 40 40" fill="none" width="32" height="32">
                    <rect x="4" y="14" width="32" height="14" rx="4" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="12" cy="28" r="4" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="28" cy="28" r="4" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
              )}
            </div>

            <div className="listing-card__body">
              <div className="listing-card__meta-top">
                <span className={`source-tag source-tag--${listing.source}`}>
                  <span className="source-tag__dot" />
                  {SOURCE_LABELS[listing.source]}
                </span>
                <span className="meta-tag">{listing.maker}</span>
                <span className="meta-tag">{listing.model}</span>
              </div>

              <h3 className="listing-card__title">
                <a
                  href={listing.detailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="listing-card__link"
                >
                  {highlightText(listing.name, keyword)}
                </a>
              </h3>

              <div className="listing-card__bottom">
                <div className="listing-card__price-group">
                  {listing.price && (
                    <span className="listing-card__price">
                      {highlightText(listing.price, keyword)}
                    </span>
                  )}
                  {listing.totalPrice && listing.totalPrice !== listing.price && (
                    <span className="listing-card__total-price">
                      総額 {listing.totalPrice}
                    </span>
                  )}
                </div>
                <div className="listing-card__specs">
                  {listing.year && (
                    <span className="spec-item">
                      {highlightText(listing.year, keyword)}
                    </span>
                  )}
                  {listing.mileage && (
                    <span className="spec-item">
                      {highlightText(listing.mileage, keyword)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="pagination-bar">
          <button
            className="pager-btn"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            ← 이전
          </button>
          <div className="pager-pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2
              )
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="pager-ellipsis">...</span>
                  )}
                  <button
                    className={`pager-page ${p === page ? "pager-page--active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
          </div>
          <button
            className="pager-btn"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
          >
            다음 →
          </button>
        </nav>
      )}
    </div>
  );
}

export default SearchResults;
