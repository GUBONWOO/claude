export type SiteSource = 'goobike' | 'rebirth' | 'mercari' | 'yahoo';

export interface BikeModel {
  id: string;
  name: string;
  maker: string;
  source: SiteSource;
  url: string;
}

// 크롤링 대상 바이크 모델
const BIKE_MODELS: BikeModel[] = [
  // === GooBike ===
  {
    id: 'goobike-ninja400',
    name: 'Ninja 400',
    maker: 'Kawasaki',
    source: 'goobike',
    url: 'https://www.goobike.com/maker-kawasaki/car-ninja_400/index.html',
  },
  {
    id: 'goobike-yzf-r7',
    name: 'YZF-R7',
    maker: 'Yamaha',
    source: 'goobike',
    url: 'https://www.goobike.com/maker-yamaha/car-yzf_r7/index.html',
  },
  {
    id: 'goobike-yzf-r6',
    name: 'YZF-R6',
    maker: 'Yamaha',
    source: 'goobike',
    url: 'https://www.goobike.com/maker-yamaha/car-yzf_r6/index.html',
  },
  {
    id: 'goobike-zx-6r',
    name: 'ZX-6R',
    maker: 'Kawasaki',
    source: 'goobike',
    url: 'https://www.goobike.com/maker-kawasaki/car-ninja_zx_6r/index.html',
  },
  // === リバースオート ===
  {
    id: 'rebirth-ninja400',
    name: 'Ninja 400',
    maker: 'Kawasaki',
    source: 'rebirth',
    url: 'https://re-birth8.com/recent/maker/kawasaki/?bike_line_id=2229',
  },
  {
    id: 'rebirth-zx-6r',
    name: 'ZX-6R',
    maker: 'Kawasaki',
    source: 'rebirth',
    url: 'https://re-birth8.com/recent/maker/kawasaki/?bike_line_id=408',
  },
  {
    id: 'rebirth-yzf-r7',
    name: 'YZF-R7',
    maker: 'Yamaha',
    source: 'rebirth',
    url: 'https://re-birth8.com/recent/maker/yamaha/?bike_line_id=1445',
  },
  // === メルカリ ===
  {
    id: 'mercari-ninja400',
    name: 'Ninja 400',
    maker: 'Kawasaki',
    source: 'mercari',
    url: 'ninja 400',
  },
  {
    id: 'mercari-yzf-r7',
    name: 'YZF-R7',
    maker: 'Yamaha',
    source: 'mercari',
    url: 'yzf-r7',
  },
  {
    id: 'mercari-yzf-r6',
    name: 'YZF-R6',
    maker: 'Yamaha',
    source: 'mercari',
    url: 'yzf-r6',
  },
  {
    id: 'mercari-zx6r',
    name: 'ZX-6R',
    maker: 'Kawasaki',
    source: 'mercari',
    url: 'zx6r',
  },
  // === ヤフオク ===
  {
    id: 'yahoo-ninja400',
    name: 'Ninja 400',
    maker: 'Kawasaki',
    source: 'yahoo',
    url: 'https://auctions.yahoo.co.jp/search/search?p=ninja+400+%E8%BB%8A%E4%BD%93&ei=utf-8',
  },
  {
    id: 'yahoo-yzf-r7',
    name: 'YZF-R7',
    maker: 'Yamaha',
    source: 'yahoo',
    url: 'https://auctions.yahoo.co.jp/search/search?p=yzf-r7+%E8%BB%8A%E4%BD%93&ei=utf-8',
  },
  {
    id: 'yahoo-yzf-r6',
    name: 'YZF-R6',
    maker: 'Yamaha',
    source: 'yahoo',
    url: 'https://auctions.yahoo.co.jp/search/search?p=yzf-r6+%E8%BB%8A%E4%BD%93&ei=utf-8',
  },
  {
    id: 'yahoo-zx-6r',
    name: 'ZX-6R',
    maker: 'Kawasaki',
    source: 'yahoo',
    url: 'https://auctions.yahoo.co.jp/search/search?p=zx-6r+%E8%BB%8A%E4%BD%93&ei=utf-8',
  },
];

// メルカリ カテゴリID: オートバイ車体
export const MERCARI_CATEGORY_ID = 949;

// 사이트 표시명
export const SOURCE_LABELS: Record<SiteSource, string> = {
  goobike: 'GooBike',
  rebirth: 'リバースオート',
  mercari: 'メルカリ',
  yahoo: 'ヤフオク',
};

// 크롤링 간격: 30분
export const CRAWL_INTERVAL = 30 * 60 * 1000;

// 각 페이지 요청 사이 딜레이: 5초 (차단 방지)
export const REQUEST_DELAY = 5000;

export default BIKE_MODELS;
