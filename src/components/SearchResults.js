import React from "react";

function highlightText(text, keyword) {
  if (!keyword) return text;
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-warning px-0">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function SearchResults({ results, keyword }) {
  if (results.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <p className="fs-5">검색 결과가 없습니다.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-muted mb-3">
        총 <strong>{results.length}</strong>개의 결과
      </p>
      {results.map((result, idx) => (
        <div key={idx} className="card mb-3 shadow-sm">
          <div className="card-body">
            <h5 className="card-title">
              <a
                href={result.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-decoration-none"
              >
                {highlightText(result.title, keyword)}
              </a>
            </h5>
            <p className="card-text text-muted small mb-1">{result.sourceUrl}</p>
            {result.snippet && (
              <p className="card-text">{highlightText(result.snippet, keyword)}</p>
            )}
            {result.linkMatches && result.linkMatches.length > 0 && (
              <div className="mt-2">
                <small className="text-muted">관련 링크:</small>
                <ul className="list-unstyled ms-2 mt-1">
                  {result.linkMatches.slice(0, 5).map((link, i) => (
                    <li key={i}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="small"
                      >
                        {highlightText(link.text, keyword)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <small className="text-muted">
              크롤링 시각: {new Date(result.crawledAt).toLocaleString("ko-KR")}
            </small>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SearchResults;
