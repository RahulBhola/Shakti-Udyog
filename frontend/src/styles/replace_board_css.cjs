const fs = require('fs');

const newBoardCSS = `.prod-board {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 20px;
  padding: 24px 32px;
  overflow: hidden;
  max-width: 100%;
  background: #f8fafc;
}
.prod-board__loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;
  color: #6b7280;
  font-size: 14px;
}
.prod-board__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.prod-board__header-left h1 {
  font-size: 24px;
  font-weight: 800;
  color: #111827;
  margin: 0;
  letter-spacing: -0.3px;
}
.prod-board__header-left p {
  font-size: 14px;
  color: #6b7280;
  margin: 4px 0 0;
}
.prod-board__header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.prod-board__kpi {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
}
.prod-board__kpi-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  flex-shrink: 0;
}
.prod-board__kpi-value {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}
.prod-board__kpi-label {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
}
.prod-board__segments {
  display: flex;
  gap: 2px;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 2px;
}
.prod-board__seg-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  border: none;
  background: transparent;
  transition: all .15s;
}
.prod-board__seg-btn:hover { color: #111827; }
.prod-board__seg-btn--active {
  background: #fff;
  color: #111827;
  box-shadow: 0 1px 2px rgba(0,0,0,.06);
}
.prod-board__btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 10px;
  background: #2563eb;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all .15s;
  box-shadow: 0 1px 3px rgba(37,99,235,.3);
}
.prod-board__btn-primary:hover { background: #1d4ed8; }
.prod-board__btn-ghost {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
}
.prod-board__btn-ghost:hover { background: #f8fafc; color: #111827; }
.prod-board__filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.prod-board__search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0 14px;
  width: 240px;
  height: 38px;
  box-shadow: 0 1px 2px rgba(0,0,0,.03);
}
.prod-board__search input {
  border: none;
  outline: none;
  font-size: 13px;
  color: #111827;
  width: 100%;
  font-family: inherit;
  background: transparent;
}
.prod-board__search input::placeholder { color: #9ca3af; }
.prod-board__filter-select {
  height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  font-size: 12px;
  color: #374151;
  background: #fff;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  min-width: 130px;
}
.prod-board__priority-chips {
  display: flex;
  gap: 4px;
  margin-left: auto;
}
.prod-board__chip {
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  transition: all .15s;
}
.prod-board__chip:hover { background: #f8fafc; }
.prod-board__chip--active { background: #eef2ff; border-color: #2563eb; color: #2563eb; }
.prod-board__columns {
  display: flex;
  gap: 24px;
  overflow-x: auto;
  flex: 1;
  padding-bottom: 16px;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}
.prod-board__columns::-webkit-scrollbar { height: 6px; }
.prod-board__columns::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
.prod-board__column {
  width: 320px;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
  max-height: calc(100vh - 340px);
}
.prod-board__column-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #f1f5f9;
}
.prod-board__column-marker {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px rgba(255,255,255,.5);
}
.prod-board__column-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.prod-board__column-count {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 6px;
  min-width: 22px;
  text-align: center;
}
.prod-board__column-more {
  cursor: pointer;
  color: #9ca3af;
  display: flex;
  align-items: center;
  padding: 2px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
}
.prod-board__column-more:hover { color: #374151; }
.prod-board__column-weight {
  padding: 6px 16px 10px;
  font-size: 11px;
  color: #9ca3af;
  font-weight: 500;
  border-bottom: 1px solid #f1f5f9;
}
.prod-board__cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  overflow-y: auto;
  flex: 1;
}
.prod-board__cards::-webkit-scrollbar { width: 4px; }
.prod-board__cards::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
.prod-board__card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
  padding: 14px;
  cursor: pointer;
  transition: all .2s ease;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.prod-board__card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,.08);
  border-color: #2563eb;
  transform: translateY(-1px);
}
.prod-board__card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.prod-board__card-id {
  font-size: 12px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.2px;
  font-family: "SF Mono", "Fira Code", monospace;
}
.prod-board__card-warn { width: 14px; height: 14px; color: #f59e0b; flex-shrink: 0; }
.prod-board__card-casting { font-size: 14px; font-weight: 600; color: #111827; }
.prod-board__card-customer { font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 4px; }
.prod-board__card-divider { height: 1px; background: #f1f5f9; margin: 2px 0; }
.prod-board__card-meta { display: flex; gap: 16px; flex-wrap: wrap; }
.prod-board__card-meta-item { font-size: 11px; color: #9ca3af; }
.prod-board__card-meta-item strong { color: #374151; font-weight: 600; }
.prod-board__card-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 4px; }
.prod-board__card-priority { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; letter-spacing: .03em; }
.prod-board__card-priority--critical { background: #fef2f2; color: #dc2626; }
.prod-board__card-priority--high { background: #fff7ed; color: #f97316; }
.prod-board__card-priority--medium { background: #fffbeb; color: #ca8a04; }
.prod-board__card-priority--low { background: #f0fdf4; color: #16a34a; }
.prod-board__more {
  padding: 10px 16px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  border-top: 1px solid #f1f5f9;
  transition: all .15s;
}
.prod-board__more:hover { background: #fafbff; }
.prod-board__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0 0;
  border-top: 1px solid #e5e7eb;
  margin-top: auto;
}
.prod-board__bottom-count { font-size: 12px; color: #6b7280; }
.prod-board__bottom-legend { display: flex; align-items: center; gap: 12px; }
.prod-board__legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #6b7280; }
.prod-board__legend-dot { width: 8px; height: 8px; border-radius: 50%; }
.prod-board__column--droppable { outline: 2px dashed #2563eb; outline-offset: -2px; }
.prod-board__card--dragging { opacity: .5; }
.prod-board__card--blocked { border-left: 3px solid #ef4444; }
`;

let c = fs.readFileSync('site.css', 'utf8');
const start = c.indexOf('.prod-board {');
const detailStart = c.indexOf('/* ── Production Job Detail Panel ── */');

if (start < 0 || detailStart < 0) {
  console.log('FAIL: markers not found at', start, detailStart);
  process.exit(1);
}

c = c.slice(0, start) + newBoardCSS + c.slice(detailStart);
fs.writeFileSync('site.css', c);
console.log('SUCCESS: CSS replaced');
