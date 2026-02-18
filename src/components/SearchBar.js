import React from "react";

function SearchBar({ keyword, onKeywordChange, onSearch, loading }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="input-group input-group-lg">
        <input
          type="text"
          className="form-control"
          placeholder="검색어를 입력하세요..."
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
        />
        <button
          className="btn btn-primary"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <span className="spinner-border spinner-border-sm me-1" />
          ) : null}
          검색
        </button>
      </div>
    </form>
  );
}

export default SearchBar;
