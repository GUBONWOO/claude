import { useState, useMemo } from "react";
import { useCrawler } from "./hooks/useCrawler";
import { searchListings, BikeListing } from "./utils/crawler";
import { SiteSource } from "./config/bikes";
import SearchBar from "./components/SearchBar";
import SearchResults from "./components/SearchResults";
import StatusBar from "./components/StatusBar";
import "./App.css";

export type SortKey = "none" | "price_asc" | "price_desc" | "year_desc" | "year_asc" | "mileage_asc" | "mileage_desc";

function parseNumber(str: string): number {
  const num = parseFloat(str.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? Infinity : num;
}

function sortListings(listings: BikeListing[], sortKey: SortKey): BikeListing[] {
  if (sortKey === "none") return listings;
  const sorted = [...listings];
  sorted.sort((a, b) => {
    switch (sortKey) {
      case "price_asc":
        return parseNumber(a.price) - parseNumber(b.price);
      case "price_desc":
        return parseNumber(b.price) - parseNumber(a.price);
      case "year_desc":
        return parseNumber(b.year) - parseNumber(a.year);
      case "year_asc":
        return parseNumber(a.year) - parseNumber(b.year);
      case "mileage_asc":
        return parseNumber(a.mileage) - parseNumber(b.mileage);
      case "mileage_desc":
        return parseNumber(b.mileage) - parseNumber(a.mileage);
      default:
        return 0;
    }
  });
  return sorted;
}

function App() {
  const [keyword, setKeyword] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedSource, setSelectedSource] = useState<SiteSource | "">("");
  const [sortKey, setSortKey] = useState<SortKey>("none");

  const { results, loading, lastCrawled, refresh } = useCrawler();

  const filteredListings = useMemo(() => {
    let filtered = selectedSource
      ? results.filter((r) => r.model.source === selectedSource)
      : results;
    if (selectedModel) {
      filtered = filtered.filter((r) => r.model.name === selectedModel);
    }
    const searched = searchListings(filtered, keyword);
    return sortListings(searched, sortKey);
  }, [results, keyword, selectedModel, selectedSource, sortKey]);

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-container">
          <div className="app-header__inner">
            <div>
              <span className="app-header__logo">Bike Search</span>
              <span className="app-header__subtitle">
                GooBike · リバースオート · メルカリ · ヤフオク
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="app-container">
          <StatusBar
            results={results}
            loading={loading}
            lastCrawled={lastCrawled}
            onRefresh={refresh}
          />

          <SearchBar
            keyword={keyword}
            onKeywordChange={setKeyword}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            selectedSource={selectedSource}
            onSourceChange={setSelectedSource}
          />

          {results.length > 0 ? (
            <SearchResults
              listings={filteredListings}
              keyword={keyword}
              sortKey={sortKey}
              onSortChange={setSortKey}
            />
          ) : loading ? (
            <div className="loading-state">
              <div className="loading-state__spinner" />
              <p className="loading-state__text">첫 크롤링 중...</p>
              <p className="loading-state__sub">모델당 5초 간격으로 수집합니다</p>
            </div>
          ) : (
            <div className="loading-state">
              <p className="loading-state__text">데이터를 불러오는 중입니다</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
