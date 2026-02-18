import { useState, useMemo } from "react";
import { useCrawler } from "./hooks/useCrawler";
import { searchCrawledData } from "./utils/crawler";
import SearchBar from "./components/SearchBar";
import SearchResults from "./components/SearchResults";
import UrlManager from "./components/UrlManager";
import StatusBar from "./components/StatusBar";

function App() {
  const [urls, setUrls] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showUrlManager, setShowUrlManager] = useState(true);

  const { data, loading, error, lastCrawled, refresh } = useCrawler(urls);

  const results = useMemo(
    () => searchCrawledData(data, searchTerm),
    [data, searchTerm]
  );

  const handleSearch = () => {
    setSearchTerm(keyword);
  };

  return (
    <div className="min-vh-100 bg-white">
      {/* 헤더 */}
      <nav className="navbar navbar-dark bg-dark mb-4">
        <div className="container">
          <span className="navbar-brand fw-bold">Web Crawler Search</span>
          <button
            className="btn btn-sm btn-outline-light"
            onClick={() => setShowUrlManager(!showUrlManager)}
          >
            {showUrlManager ? "URL 관리 숨기기" : "URL 관리 보기"}
          </button>
        </div>
      </nav>

      <div className="container" style={{ maxWidth: 900 }}>
        {/* URL 관리 */}
        {showUrlManager && <UrlManager urls={urls} onUrlsChange={setUrls} />}

        {/* 상태바 */}
        <StatusBar
          loading={loading}
          lastCrawled={lastCrawled}
          error={error}
          dataCount={data.length}
          onRefresh={refresh}
        />

        {/* 검색바 */}
        <SearchBar
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={handleSearch}
          loading={loading}
        />

        {/* 검색 결과 */}
        {searchTerm ? (
          <SearchResults results={results} keyword={searchTerm} />
        ) : data.length > 0 ? (
          <SearchResults results={data} keyword="" />
        ) : (
          <div className="text-center py-5 text-muted">
            <p className="fs-5">크롤링할 URL을 추가해주세요.</p>
            <p>URL을 추가하면 자동으로 크롤링이 시작됩니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
