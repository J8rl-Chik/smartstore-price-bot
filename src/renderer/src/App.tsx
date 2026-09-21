import { useState, useEffect, useRef } from 'react';

type Screen = 'list' | 'settings' | 'progress' | 'complete';

const PRODUCTS = [
  {
    id: 1,
    name: '무선 블루투스 이어폰 Pro',
    price: 32000,
    category: '전자기기',
    status: '대기',
    date: '2026.03.10',
    checked: false,
  },
  {
    id: 2,
    name: '스테인리스 텀블러 500ml',
    price: 18500,
    category: '생활용품',
    status: '대기',
    date: '2026.03.09',
    checked: false,
  },
  {
    id: 3,
    name: '오가닉 코튼 베이직 티셔츠',
    price: 29000,
    category: '의류',
    status: '완료',
    date: '2026.03.09',
    checked: false,
  },
  {
    id: 4,
    name: 'LED 눈보호 데스크 램프',
    price: 45000,
    category: '인테리어',
    status: '대기',
    date: '2026.03.08',
    checked: false,
  },
  {
    id: 5,
    name: '프리미엄 무독성 요가 매트',
    price: 38000,
    category: '스포츠',
    status: '오류',
    date: '2026.03.08',
    checked: false,
  },
  {
    id: 6,
    name: '초고속 보조배터리 20000mAh',
    price: 25000,
    category: '전자기기',
    status: '대기',
    date: '2026.03.07',
    checked: false,
  },
];

const WORK_LOG_FINAL = [
  { order: 1, name: '무선 블루투스 이어폰 Pro', fields: '상품명, 가격', result: '완료' },
  { order: 2, name: '프리미엄 무독성 요가 매트', fields: '상품명', result: '완료' },
  { order: 3, name: '오가닉 코튼 베이직 티셔츠', fields: '카테고리', result: '완료' },
  { order: 4, name: '스테인리스 텀블러 500ml', fields: '가격', result: '완료' },
  { order: 5, name: '초고속 보조배터리 20000mAh', fields: '상품명, 카테고리', result: '완료' },
];

const FAILED_ITEMS = [
  {
    name: 'LED 눈보호 데스크 램프',
    field: '가격 일괄 조정',
    reason: '해외 통화 규격 파싱 오류 (USD)',
  },
  {
    name: '프리미엄 무독성 요가 매트',
    field: '카테고리 재분류',
    reason: '유효하지 않은 제품 규격 카테고리',
  },
];
const SUCCESS_ITEMS = [
  { name: '무선 블루투스 이어폰 Pro', field: '상품명, 가격', reason: '' },
  { name: '프리미엄 무독성 요가 매트', field: '상품명', reason: '' },
  { name: '오가닉 코튼 베이직 티셔츠', field: '카테고리', reason: '' },
  { name: '스테인리스 텀블러 500ml', field: '가격', reason: '' },
  { name: '초고속 보조배터리 20000mAh', field: '상품명, 카테고리', reason: '' },
];

function StatusBadge({ status }: { status: string }) {
  if (status === '완료')
    return (
      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
        완료
      </span>
    );
  if (status === '오류')
    return (
      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-600">
        오류
      </span>
    );
  return <span className="text-sm text-gray-400">대기</span>;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-6' : ''}`}
      />
    </button>
  );
}

function Sidebar({ screen, onNav }: { screen: Screen; onNav: (s: Screen) => void }) {
  return (
    <aside className="w-40 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1" fill="white" />
            <rect x="9" y="2" width="5" height="5" rx="1" fill="white" />
            <rect x="2" y="9" width="5" height="5" rx="1" fill="white" />
            <rect x="9" y="9" width="5" height="5" rx="1" fill="white" />
          </svg>
        </div>
        <span
          className="text-sm font-bold text-gray-900"
          style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          프로덕트 매니저
        </span>
      </div>
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
        <button
          onClick={() => onNav('list')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${screen === 'list' || screen === 'progress' || screen === 'complete' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="1.5" rx="0.75" fill="currentColor" />
            <rect x="2" y="7" width="12" height="1.5" rx="0.75" fill="currentColor" />
            <rect x="2" y="11" width="12" height="1.5" rx="0.75" fill="currentColor" />
          </svg>
          제품 목록
        </button>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 2a6 6 0 1 1 0 12A6 6 0 0 1 8 2zm0 1.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM8 5v3l2 1"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          수정 이력
        </button>
        <button
          onClick={() => onNav('settings')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${screen === 'settings' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          설정
        </button>
      </nav>
      <div className="p-4 border-t border-gray-100 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="14" fill="#e5e7eb" />
            <circle cx="14" cy="11" r="4" fill="#9ca3af" />
            <ellipse cx="14" cy="22" rx="7" ry="4" fill="#9ca3af" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-gray-800 truncate">토스 파트너스</div>
          <div className="text-xs text-gray-400 truncate">admin@toss.im</div>
        </div>
      </div>
    </aside>
  );
}

// ───────────────────── SCREEN 1: Product List ─────────────────────
function ProductListScreen({ onStart }: { onStart: () => void }) {
  const [products, setProducts] = useState(PRODUCTS);
  const allChecked = products.every((p) => p.checked);

  const toggleAll = () => setProducts(products.map((p) => ({ ...p, checked: !allChecked })));
  const toggleOne = (id: number) =>
    setProducts(products.map((p) => (p.id === id ? { ...p, checked: !p.checked } : p)));

  return (
    <div className="flex-1 p-8 min-h-screen bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          제품 목록
        </h1>
        <button
          onClick={onStart}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.2" />
            <path d="M5 7h4M7 5v4" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          자동 수정 시작
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: '총 제품 수', value: '128개', sub: '등록된 활성 상품 기준' },
          { label: '수정 대기', value: '45개', sub: '대기중인 자동 보정 대상' },
          { label: '최근 수정', value: '3시간 전', sub: '자동 최적화 완료 시간' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
            <div
              className="text-2xl font-bold text-gray-900 mb-1"
              style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
            >
              {stat.value}
            </div>
            <div className="text-xs text-gray-400">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2
            className="text-base font-bold text-gray-800"
            style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
          >
            최근 유입된 제품 목록
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-gray-300 text-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">상품명</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">가격</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">카테고리</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">상태</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                최종 수정일
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.id}
                className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer ${p.checked ? 'bg-blue-50/40' : ''}`}
                onClick={() => toggleOne(p.id)}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={p.checked}
                    onChange={() => toggleOne(p.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">{p.name}</td>
                <td className="px-4 py-3 text-sm text-gray-700">₩{p.price.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.category}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">{p.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ───────────────────── SCREEN 2: Settings ─────────────────────
interface SettingsState {
  productName: boolean;
  priceAdjust: boolean;
  autoDesc: boolean;
  categoryReclassify: boolean;
  autoTag: boolean;
  priceRate: string;
  applyScope: 'selected' | 'all';
}

function SettingsScreen({ onConfirm }: { onConfirm: (settings: SettingsState) => void }) {
  const [settings, setSettings] = useState<SettingsState>({
    productName: true,
    priceAdjust: true,
    autoDesc: false,
    categoryReclassify: true,
    autoTag: false,
    priceRate: '+10%',
    applyScope: 'selected',
  });

  const activeOption = settings.priceAdjust
    ? { label: '수정 옵션 - 가격 일괄 조정', showInput: true }
    : settings.productName
      ? { label: '수정 옵션 - 상품명 최적화', showInput: false }
      : settings.categoryReclassify
        ? { label: '수정 옵션 - 카테고리 재분류', showInput: false }
        : null;

  const items = [
    {
      key: 'productName' as const,
      label: '상품명 최적화',
      desc: '검색 키워드를 반영한 상품명 자동 수정',
    },
    {
      key: 'priceAdjust' as const,
      label: '가격 일괄 조정',
      desc: '일정한 규칙이나 비율에 따른 가격 보정',
    },
    {
      key: 'autoDesc' as const,
      label: '상품 설명 자동 생성',
      desc: '인공지능 모델 기반 상세 설명 보강',
    },
    {
      key: 'categoryReclassify' as const,
      label: '카테고리 재분류',
      desc: '상품 정보를 인식하여 올바른 카테고리 배치',
    },
    {
      key: 'autoTag' as const,
      label: '태그 자동 추가',
      desc: '추천 해시태그 및 키워드 자동 분석 삽입',
    },
  ];

  return (
    <div className="flex-1 p-8 min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1
          className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          수정 설정
        </h1>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 flex flex-col gap-3">
          <h2
            className="text-base font-bold text-gray-800 mb-1"
            style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
          >
            수정 항목 선택
          </h2>
          {items.map((item) => (
            <div
              key={item.key}
              className={`bg-white rounded-xl px-5 py-4 border flex items-center justify-between transition-colors ${settings[item.key] ? 'border-blue-400' : 'border-gray-100'}`}
            >
              <div>
                <div
                  className={`text-sm font-semibold ${settings[item.key] ? 'text-blue-600' : 'text-gray-800'}`}
                  style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
                >
                  {item.label}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
              </div>
              <Toggle
                checked={settings[item.key]}
                onChange={() => setSettings((s) => ({ ...s, [item.key]: !s[item.key] }))}
              />
            </div>
          ))}
        </div>

        <div className="w-72 flex-shrink-0">
          {activeOption ? (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3
                className="text-sm font-bold text-gray-800 mb-4"
                style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
              >
                {activeOption.label}
              </h3>

              {activeOption.showInput && (
                <>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    가격 조정 비율
                  </label>
                  <input
                    type="text"
                    value={settings.priceRate}
                    onChange={(e) => setSettings((s) => ({ ...s, priceRate: e.target.value }))}
                    className="w-full border-2 border-blue-400 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-500 mb-1"
                  />
                  <p className="text-xs text-gray-400 mb-4">
                    기존 가격 대비 10% 인상하여 적용합니다. (소수점 버림)
                  </p>
                </>
              )}

              <label className="block text-xs font-medium text-gray-600 mb-3">적용 범위</label>
              <div className="flex flex-col gap-2 mb-6">
                {[
                  { value: 'selected' as const, label: '선택된 제품만 적용' },
                  { value: 'all' as const, label: '전체 제품 적용' },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${settings.applyScope === opt.value ? 'border-blue-500' : 'border-gray-300'}`}
                      onClick={() => setSettings((s) => ({ ...s, applyScope: opt.value }))}
                    >
                      {settings.applyScope === opt.value && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  취소
                </button>
                <button
                  onClick={() => onConfirm(settings)}
                  className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
                >
                  수정 시작
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col items-center justify-center min-h-48 text-center">
              <div className="text-gray-300 mb-2">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="14" stroke="#d1d5db" strokeWidth="2" />
                  <path
                    d="M16 10v6M16 20v2"
                    stroke="#d1d5db"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-400">
                수정 항목을 선택하면
                <br />
                옵션이 표시됩니다.
              </p>
              <button
                onClick={() => onConfirm(settings)}
                className="mt-4 w-full py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
              >
                수정 시작
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────── SCREEN 3: Progress ─────────────────────
function ProgressScreen({ onStop, onComplete }: { onStop: () => void; onComplete: () => void }) {
  const [progress, setProgress] = useState(26);
  const [currentIdx, setCurrentIdx] = useState(1);
  const [log, setLog] = useState(WORK_LOG_FINAL.slice(0, 3));
  const [stopped, setStopped] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (stopped) return;
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + 2;
        if (next >= 100) {
          clearInterval(timerRef.current!);
          setTimeout(onComplete, 600);
          return 100;
        }
        return next;
      });
      setCurrentIdx((i) => Math.min(i + 1, PRODUCTS.length - 1));
      setLog((l) => {
        if (l.length < WORK_LOG_FINAL.length) return [...l, WORK_LOG_FINAL[l.length]];
        return l;
      });
    }, 800);
    return () => clearInterval(timerRef.current!);
  }, [stopped, onComplete]);

  const handleStop = () => {
    setStopped(true);
    clearInterval(timerRef.current!);
    onStop();
  };

  const completed = Math.round((progress / 100) * 45);
  const currentProduct = PRODUCTS[currentIdx];

  return (
    <div className="flex-1 p-8 min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1
          className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          자동 수정 진행중
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div
              className="text-base font-bold text-gray-800 mb-1"
              style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
            >
              제품 목록 최적화 보정 중...
            </div>
            <div className="text-sm text-gray-400">
              인공지능 규칙에 따라 정보를 재구성하고 있습니다.
            </div>
          </div>
          <span className="text-blue-500 font-semibold text-sm">
            45개 중 {completed}개 완료 ({progress}%)
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
            <svg
              className="animate-spin-slow"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle
                cx="8"
                cy="8"
                r="6"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="28 10"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-0.5">
              Currently Processing
            </div>
            <div
              className="text-sm font-bold text-gray-900"
              style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
            >
              {currentProduct.name}
            </div>
          </div>
        </div>
        <span className="text-sm text-gray-500">가격 일괄 조정 (+10%) 보정 중...</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2
            className="text-base font-bold text-gray-800"
            style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
          >
            실시간 작업 로그
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 w-16">순서</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">상품명</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">수정 항목</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">결과</th>
            </tr>
          </thead>
          <tbody>
            {log.map((item) => (
              <tr key={item.order} className="border-b border-gray-50">
                <td className="px-6 py-3 text-sm text-gray-400">{item.order}</td>
                <td className="px-6 py-3 text-sm text-gray-800">{item.name}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{item.fields}</td>
                <td className="px-6 py-3">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                    완료
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={handleStop}
          className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-500 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="#ef4444" strokeWidth="1.2" />
            <rect x="4.5" y="4.5" width="5" height="5" rx="0.5" fill="#ef4444" />
          </svg>
          수정 중지
        </button>
      </div>
    </div>
  );
}

// ───────────────────── SCREEN 4: Complete ─────────────────────
function CompleteScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<'fail' | 'success'>('fail');

  return (
    <div className="flex-1 p-8 min-h-screen bg-gray-50">
      <div className="bg-white rounded-xl border border-gray-100 p-8 mb-6 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12l4 4 10-10"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1
          className="text-xl font-bold text-gray-900 mb-2"
          style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          자동 수정 완료!
        </h1>
        <p className="text-sm text-gray-500">
          45개 제품 수정이 완료되었습니다. 수정 과정 결과를 확인하세요.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '수정 성공', value: '43개' },
          { label: '수정 실패', value: '2개' },
          { label: '소요 시간', value: '4분 12초' },
          { label: '수정 항목', value: '3개' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab('fail')}
            className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === 'fail' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            실패 항목 (2)
          </button>
          <button
            onClick={() => setTab('success')}
            className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === 'success' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            성공 항목 (43)
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">
                {tab === 'fail' ? '실패한 상품명' : '상품명'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">
                수정 대상 항목
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">
                {tab === 'fail' ? '실패 원인' : '결과'}
              </th>
            </tr>
          </thead>
          <tbody>
            {(tab === 'fail' ? FAILED_ITEMS : SUCCESS_ITEMS).map((item, i) => (
              <tr key={i} className="border-b border-gray-50">
                <td className="px-6 py-3 text-sm text-gray-800">{item.name}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{item.field}</td>
                <td className="px-6 py-3 text-sm">
                  {tab === 'fail' ? (
                    <span className="text-orange-500 font-medium">{item.reason}</span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                      완료
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1v8M4 6l3 3 3-3M2 11h10"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            수정 내역 다운로드
          </button>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M9 2L4 7l5 5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            목록으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────── Root App ─────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>('list');

  return (
    <div
      className="flex min-h-screen bg-gray-50"
      style={{ fontFamily: "'Noto Sans KR', 'Inter', sans-serif" }}
    >
      <Sidebar screen={screen} onNav={setScreen} />
      {screen === 'list' && <ProductListScreen onStart={() => setScreen('settings')} />}
      {screen === 'settings' && <SettingsScreen onConfirm={() => setScreen('progress')} />}
      {screen === 'progress' && (
        <ProgressScreen onStop={() => setScreen('list')} onComplete={() => setScreen('complete')} />
      )}
      {screen === 'complete' && <CompleteScreen onBack={() => setScreen('list')} />}
    </div>
  );
}
