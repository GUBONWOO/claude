export type SiteSource = 'goobike' | 'rebirth' | 'mercari' | 'yahoo';

export interface BikeModel {
  id: string;
  name: string;
  maker: string;
  source: SiteSource;
  url: string;
}

// 크롤링 대상 바이크 모델
// 순서: リバースオート → メルカリ → ヤフオク → GooBike (GooBike가 가장 마지막)
const BIKE_MODELS: BikeModel[] = [
  // === リバースオート ===
  // Kawasaki
  { id: 'rebirth-ninja400',  name: 'Ninja 400', maker: 'Kawasaki', source: 'rebirth', url: 'https://re-birth8.com/recent/maker/kawasaki/?bike_line_id=2229' },
  { id: 'rebirth-zx-6r',    name: 'ZX-6R',     maker: 'Kawasaki', source: 'rebirth', url: 'https://re-birth8.com/recent/maker/kawasaki/?bike_line_id=408' },
  { id: 'rebirth-zx-10r',   name: 'ZX-10R',    maker: 'Kawasaki', source: 'rebirth', url: 'https://re-birth8.com/recent/maker/kawasaki/?bike_line_id=409' },
  { id: 'rebirth-z900',     name: 'Z900',      maker: 'Kawasaki', source: 'rebirth', url: 'https://re-birth8.com/recent/maker/kawasaki/?bike_line_id=2232' },
  // Yamaha
  { id: 'rebirth-yzf-r7',  name: 'YZF-R7',  maker: 'Yamaha', source: 'rebirth', url: 'https://re-birth8.com/recent/maker/yamaha/?bike_line_id=1445' },
  { id: 'rebirth-yzf-r6',  name: 'YZF-R6',  maker: 'Yamaha', source: 'rebirth', url: 'https://re-birth8.com/recent/maker/yamaha/?bike_line_id=184' },
  { id: 'rebirth-mt-09',   name: 'MT-09',   maker: 'Yamaha', source: 'rebirth', url: 'https://re-birth8.com/recent/maker/yamaha/?bike_line_id=1377' },
  { id: 'rebirth-xsr900',  name: 'XSR900',  maker: 'Yamaha', source: 'rebirth', url: 'https://re-birth8.com/recent/maker/yamaha/?bike_line_id=1440' },
  // Honda
  { id: 'rebirth-cbr600rr',   name: 'CBR600RR',   maker: 'Honda', source: 'rebirth', url: 'https://re-birth8.com/recent/maker/honda/?bike_line_id=96' },
  { id: 'rebirth-cbr1000rr-r', name: 'CBR1000RR-R', maker: 'Honda', source: 'rebirth', url: 'https://re-birth8.com/recent/maker/honda/?bike_line_id=2241' },
  { id: 'rebirth-cb650r',     name: 'CB650R',     maker: 'Honda', source: 'rebirth', url: 'https://re-birth8.com/recent/maker/honda/?bike_line_id=2226' },
  { id: 'rebirth-cb400sf',    name: 'CB400SF',    maker: 'Honda', source: 'rebirth', url: 'https://re-birth8.com/recent/maker/honda/?bike_line_id=60' },
  // Suzuki
  { id: 'rebirth-gsx-r600',  name: 'GSX-R600',  maker: 'Suzuki', source: 'rebirth', url: 'https://re-birth8.com/recent/maker/suzuki/?bike_line_id=247' },
  { id: 'rebirth-gsx-r1000', name: 'GSX-R1000', maker: 'Suzuki', source: 'rebirth', url: 'https://re-birth8.com/recent/maker/suzuki/?bike_line_id=249' },
  { id: 'rebirth-gsx-s1000', name: 'GSX-S1000', maker: 'Suzuki', source: 'rebirth', url: 'https://re-birth8.com/recent/maker/suzuki/?bike_line_id=2227' },

  // === メルカリ ===
  // Kawasaki
  { id: 'mercari-ninja400', name: 'Ninja 400', maker: 'Kawasaki', source: 'mercari', url: 'ninja 400' },
  { id: 'mercari-zx6r',    name: 'ZX-6R',     maker: 'Kawasaki', source: 'mercari', url: 'zx-6r 車体' },
  { id: 'mercari-zx10r',   name: 'ZX-10R',    maker: 'Kawasaki', source: 'mercari', url: 'zx-10r 車体' },
  { id: 'mercari-z900',    name: 'Z900',      maker: 'Kawasaki', source: 'mercari', url: 'z900 kawasaki 車体' },
  // Yamaha
  { id: 'mercari-yzf-r7', name: 'YZF-R7', maker: 'Yamaha', source: 'mercari', url: 'yzf-r7' },
  { id: 'mercari-yzf-r6', name: 'YZF-R6', maker: 'Yamaha', source: 'mercari', url: 'yzf-r6' },
  { id: 'mercari-mt-09',  name: 'MT-09',  maker: 'Yamaha', source: 'mercari', url: 'mt-09 yamaha 車体' },
  { id: 'mercari-xsr900', name: 'XSR900', maker: 'Yamaha', source: 'mercari', url: 'xsr900 車体' },
  // Honda
  { id: 'mercari-cbr600rr',    name: 'CBR600RR',    maker: 'Honda', source: 'mercari', url: 'cbr600rr 車体' },
  { id: 'mercari-cbr1000rr-r', name: 'CBR1000RR-R', maker: 'Honda', source: 'mercari', url: 'cbr1000rr-r 車体' },
  { id: 'mercari-cb650r',      name: 'CB650R',      maker: 'Honda', source: 'mercari', url: 'cb650r 車体' },
  { id: 'mercari-cb400sf',     name: 'CB400SF',     maker: 'Honda', source: 'mercari', url: 'cb400sf 車体' },
  // Suzuki
  { id: 'mercari-gsx-r600',  name: 'GSX-R600',  maker: 'Suzuki', source: 'mercari', url: 'gsx-r600 車体' },
  { id: 'mercari-gsx-r1000', name: 'GSX-R1000', maker: 'Suzuki', source: 'mercari', url: 'gsx-r1000 車体' },
  { id: 'mercari-gsx-s1000', name: 'GSX-S1000', maker: 'Suzuki', source: 'mercari', url: 'gsx-s1000 車体' },

  // === ヤフオク ===
  // Kawasaki
  { id: 'yahoo-ninja400', name: 'Ninja 400', maker: 'Kawasaki', source: 'yahoo', url: 'https://auctions.yahoo.co.jp/search/search?p=ninja+400+%E8%BB%8A%E4%BD%93&ei=utf-8' },
  { id: 'yahoo-zx-6r',   name: 'ZX-6R',     maker: 'Kawasaki', source: 'yahoo', url: 'https://auctions.yahoo.co.jp/search/search?p=zx-6r+%E8%BB%8A%E4%BD%93&ei=utf-8' },
  { id: 'yahoo-zx-10r',  name: 'ZX-10R',    maker: 'Kawasaki', source: 'yahoo', url: 'https://auctions.yahoo.co.jp/search/search?p=zx-10r+%E8%BB%8A%E4%BD%93&ei=utf-8' },
  { id: 'yahoo-z900',    name: 'Z900',      maker: 'Kawasaki', source: 'yahoo', url: 'https://auctions.yahoo.co.jp/search/search?p=z900+kawasaki+%E8%BB%8A%E4%BD%93&ei=utf-8' },
  // Yamaha
  { id: 'yahoo-yzf-r7', name: 'YZF-R7', maker: 'Yamaha', source: 'yahoo', url: 'https://auctions.yahoo.co.jp/search/search?p=yzf-r7+%E8%BB%8A%E4%BD%93&ei=utf-8' },
  { id: 'yahoo-yzf-r6', name: 'YZF-R6', maker: 'Yamaha', source: 'yahoo', url: 'https://auctions.yahoo.co.jp/search/search?p=yzf-r6+%E8%BB%8A%E4%BD%93&ei=utf-8' },
  { id: 'yahoo-mt-09',  name: 'MT-09',  maker: 'Yamaha', source: 'yahoo', url: 'https://auctions.yahoo.co.jp/search/search?p=mt-09+yamaha+%E8%BB%8A%E4%BD%93&ei=utf-8' },
  { id: 'yahoo-xsr900', name: 'XSR900', maker: 'Yamaha', source: 'yahoo', url: 'https://auctions.yahoo.co.jp/search/search?p=xsr900+%E8%BB%8A%E4%BD%93&ei=utf-8' },
  // Honda
  { id: 'yahoo-cbr600rr',    name: 'CBR600RR',    maker: 'Honda', source: 'yahoo', url: 'https://auctions.yahoo.co.jp/search/search?p=cbr600rr+%E8%BB%8A%E4%BD%93&ei=utf-8' },
  { id: 'yahoo-cbr1000rr-r', name: 'CBR1000RR-R', maker: 'Honda', source: 'yahoo', url: 'https://auctions.yahoo.co.jp/search/search?p=cbr1000rr-r+%E8%BB%8A%E4%BD%93&ei=utf-8' },
  { id: 'yahoo-cb650r',      name: 'CB650R',      maker: 'Honda', source: 'yahoo', url: 'https://auctions.yahoo.co.jp/search/search?p=cb650r+%E8%BB%8A%E4%BD%93&ei=utf-8' },
  { id: 'yahoo-cb400sf',     name: 'CB400SF',     maker: 'Honda', source: 'yahoo', url: 'https://auctions.yahoo.co.jp/search/search?p=cb400sf+%E8%BB%8A%E4%BD%93&ei=utf-8' },
  // Suzuki
  { id: 'yahoo-gsx-r600',  name: 'GSX-R600',  maker: 'Suzuki', source: 'yahoo', url: 'https://auctions.yahoo.co.jp/search/search?p=gsx-r600+%E8%BB%8A%E4%BD%93&ei=utf-8' },
  { id: 'yahoo-gsx-r1000', name: 'GSX-R1000', maker: 'Suzuki', source: 'yahoo', url: 'https://auctions.yahoo.co.jp/search/search?p=gsx-r1000+%E8%BB%8A%E4%BD%93&ei=utf-8' },
  { id: 'yahoo-gsx-s1000', name: 'GSX-S1000', maker: 'Suzuki', source: 'yahoo', url: 'https://auctions.yahoo.co.jp/search/search?p=gsx-s1000+%E8%BB%8A%E4%BD%93&ei=utf-8' },

  // === GooBike ===
  // Kawasaki
  { id: 'goobike-ninja400', name: 'Ninja 400', maker: 'Kawasaki', source: 'goobike', url: 'https://www.goobike.com/maker-kawasaki/car-ninja_400/index.html' },
  { id: 'goobike-zx-6r',   name: 'ZX-6R',     maker: 'Kawasaki', source: 'goobike', url: 'https://www.goobike.com/maker-kawasaki/car-ninja_zx_6r/index.html' },
  { id: 'goobike-zx-10r',  name: 'ZX-10R',    maker: 'Kawasaki', source: 'goobike', url: 'https://www.goobike.com/maker-kawasaki/car-ninja_zx_10r/index.html' },
  { id: 'goobike-z900',    name: 'Z900',      maker: 'Kawasaki', source: 'goobike', url: 'https://www.goobike.com/maker-kawasaki/car-z900/index.html' },
  // Yamaha
  { id: 'goobike-yzf-r7', name: 'YZF-R7', maker: 'Yamaha', source: 'goobike', url: 'https://www.goobike.com/maker-yamaha/car-yzf_r7/index.html' },
  { id: 'goobike-yzf-r6', name: 'YZF-R6', maker: 'Yamaha', source: 'goobike', url: 'https://www.goobike.com/maker-yamaha/car-yzf_r6/index.html' },
  { id: 'goobike-mt-09',  name: 'MT-09',  maker: 'Yamaha', source: 'goobike', url: 'https://www.goobike.com/maker-yamaha/car-mt_09/index.html' },
  { id: 'goobike-xsr900', name: 'XSR900', maker: 'Yamaha', source: 'goobike', url: 'https://www.goobike.com/maker-yamaha/car-xsr900/index.html' },
  // Honda
  { id: 'goobike-cbr600rr',    name: 'CBR600RR',    maker: 'Honda', source: 'goobike', url: 'https://www.goobike.com/maker-honda/car-cbr600rr/index.html' },
  { id: 'goobike-cbr1000rr-r', name: 'CBR1000RR-R', maker: 'Honda', source: 'goobike', url: 'https://www.goobike.com/maker-honda/car-cbr1000rr_r/index.html' },
  { id: 'goobike-cb650r',      name: 'CB650R',      maker: 'Honda', source: 'goobike', url: 'https://www.goobike.com/maker-honda/car-cb650r/index.html' },
  { id: 'goobike-cb400sf',     name: 'CB400SF',     maker: 'Honda', source: 'goobike', url: 'https://www.goobike.com/maker-honda/car-cb400_super_four/index.html' },
  // Suzuki
  { id: 'goobike-gsx-r600',  name: 'GSX-R600',  maker: 'Suzuki', source: 'goobike', url: 'https://www.goobike.com/maker-suzuki/car-gsx_r600/index.html' },
  { id: 'goobike-gsx-r1000', name: 'GSX-R1000', maker: 'Suzuki', source: 'goobike', url: 'https://www.goobike.com/maker-suzuki/car-gsx_r1000/index.html' },
  { id: 'goobike-gsx-s1000', name: 'GSX-S1000', maker: 'Suzuki', source: 'goobike', url: 'https://www.goobike.com/maker-suzuki/car-gsx_s1000/index.html' },
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
