import React, { useState } from "react";

function UrlManager({ urls, onUrlsChange }) {
  const [input, setInput] = useState("");

  const addUrl = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
      if (!urls.includes(trimmed)) {
        onUrlsChange([...urls, trimmed]);
      }
      setInput("");
    } catch {
      alert("올바른 URL을 입력해주세요.");
    }
  };

  const removeUrl = (url) => {
    onUrlsChange(urls.filter((u) => u !== url));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addUrl();
    }
  };

  return (
    <div className="mb-4 p-3 bg-light rounded">
      <h6 className="fw-bold mb-2">크롤링 대상 URL 관리</h6>
      <div className="input-group mb-2">
        <input
          type="text"
          className="form-control"
          placeholder="https://example.com"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="btn btn-outline-success" onClick={addUrl}>
          추가
        </button>
      </div>
      {urls.length === 0 ? (
        <p className="text-muted small mb-0">등록된 URL이 없습니다.</p>
      ) : (
        <ul className="list-group">
          {urls.map((url) => (
            <li
              key={url}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <span className="text-truncate" style={{ maxWidth: "80%" }}>
                {url}
              </span>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => removeUrl(url)}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UrlManager;
