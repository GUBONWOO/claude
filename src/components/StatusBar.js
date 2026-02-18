import React from "react";

function StatusBar({ loading, lastCrawled, error, dataCount, onRefresh }) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded">
      <div className="d-flex align-items-center gap-3">
        <span className="badge bg-info">{dataCount}개 페이지 수집됨</span>
        {lastCrawled && (
          <small className="text-muted">
            마지막 크롤링: {lastCrawled.toLocaleString("ko-KR")}
          </small>
        )}
        {loading && (
          <span className="spinner-border spinner-border-sm text-primary" />
        )}
      </div>
      <div className="d-flex align-items-center gap-2">
        {error && <small className="text-danger">{error}</small>}
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={onRefresh}
          disabled={loading}
        >
          수동 새로고침
        </button>
      </div>
    </div>
  );
}

export default StatusBar;
