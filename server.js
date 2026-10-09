const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
// DATA_DIR 환경변수로 Railway Volume 경로 지정 가능 (기본: 앱 내 data/)
const DATA_DIR   = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE  = path.join(DATA_DIR, 'content.json');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin365';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.use(express.json({ limit: '2mb' }));

// index.html에 네이버 인증 메타 태그 동적 주입
app.get('/', (req, res) => {
  const NAVER_VERIFY_TAG = process.env.NAVER_SITE_VERIFICATION
    ? `<meta name="naver-site-verification" content="${process.env.NAVER_SITE_VERIFICATION}">`
    : '';
  let html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
  if (NAVER_VERIFY_TAG) {
    html = html.replace('<meta charset="UTF-8">', `<meta charset="UTF-8">\n${NAVER_VERIFY_TAG}`);
  }
  res.set('Content-Type', 'text/html');
  res.send(html);
});

app.use(express.static(path.join(__dirname, 'public')));

const DEFAULT_DATA = {
  company: 'TV마스터365',
  ceo: '이천용',
  phone: '010-6213-0555',
  email: 'roqkq8202@naver.com',
  bizno: '130-40-56927',
  address: '경기도 부천시 소사로730번길 58, 5동 지2호',
  hours: '평일 09:30~18:00 · 토요일 09:00~13:00',
  year: '2025',
  desc: '벽에 구멍을 내지 않는 무타공 TV 벽걸이 설치 전문입니다. 서울·경기·인천 전 지역에서 50~100인치 TV를 책임 시공합니다.',

  hero: {
    eyebrow: '서울·경기·인천 전 지역 출장 시공',
    title: '벽은 그대로,\n50~100인치\nTV 벽걸이 전문',
    sub: '무타공 브라켓으로 구멍 없이 거는\nTV 벽걸이 설치 전문 TV마스터365.',
    cta1: '무료 견적 받기 →',
    cta2: '우리 집도 가능한가요?',
    stats: [
      { num: '8', unit: '년+', label: 'TV 벽걸이 설치 경력' },
      { num: '1', unit: '만+', label: '누적 시공 고객' },
      { num: '50', unit: '~100', label: '지원 인치 범위' }
    ]
  },

  problem: {
    eyebrow: 'THE PROBLEM',
    title: '무타공 업체를 고를 때,\n이 4가지를 꼭 확인하세요.',
    sub: '가격과 완성 사진만으로는 차이가 보이지 않습니다. 무엇이 적혀 있지 않은지를 보면 어떤 업체인지 알 수 있습니다.',
    cards: [
      { no: 'CHECK 01', text: '별점과 가격은 보여도, 대형 TV를 지탱할 수 있는 근거 자료는 적혀 있지 않습니다.' },
      { no: 'CHECK 02', text: '어떤 브라켓으로 어떻게 거는지가 빠지면, 가장 싼 곳을 고를 수밖에 없습니다.' },
      { no: 'CHECK 03', text: '간이사업자·부업 기사는 문제가 생겼을 때 연락이 닿지 않는 경우가 있습니다.' },
      { no: 'CHECK 04', text: 'TV가 떨어지거나 벽이 손상됐을 때, 보상은 보험 가입 여부와 시공 기록에서 시작됩니다.' }
    ],
    footer: '{company}는 이 4가지를 모두 먼저 보여드립니다. 벽을 뚫지 않고도 어떻게 TV 하중을 지탱하는지, 구조부터 설명해 드립니다.'
  },

  solution: {
    eyebrow: 'THE SOLUTION',
    title: '벽은 그대로, 100인치까지 겁니다.',
    sub: '벽을 뚫지 않고도 TV 하중을 안전하게 지탱하는 방법을 4단계로 보여드립니다.',
    steps: [
      { title: '단자함 안에 본체 고정', desc: '콘센트 안쪽 단자함에 본체(함체)를 끼워 고정합니다. 벽에 구멍을 내지 않습니다.' },
      { title: '함체에 프레임 연결', desc: '고정된 함체에 TV를 거는 프레임을 결합합니다. 스틸 수직 프레임이 하중을 받습니다.' },
      { title: '프레임에 TV 브라켓 설치', desc: '프레임에 TV 전용 브라켓을 장착합니다. TV 크기와 무게에 맞게 선택합니다.' },
      { title: 'TV 거치 및 마무리', desc: '브라켓에 TV를 걸어 마무리합니다. 프레임과 패드가 벽면 4면에 밀착해 하중을 분산합니다.' }
    ],
    specs: [
      { num: '50', unit: '~100인치', label: '지원 시공 범위', note: '표준 시공 기준' },
      { num: '100', unit: '인치', label: '가벽 최대 지원', note: '보강 가벽 기준' },
      { num: '당일', unit: '~2일', label: '예약 후 시공 일정', note: '지역별 상이' },
      { num: '1', unit: '~2시간', label: '현장 시공 소요 시간', note: '기기 추가 시 변동' }
    ]
  },

  cases: [
    { loc: '래미안 위례신도시', det: '75인치 · 콘크리트 벽 · 무타공 기본형', badge: '무타공', img: '', link: '' },
    { loc: '힐스테이트 동탄', det: '85인치 · 석고보드 가벽 · 보강판 적용', badge: '가벽 보강', img: '', link: '' },
    { loc: '자이 마곡', det: '65인치 · 선 매립 마감 · 기기 거치대 포함', badge: '선 매립', img: '', link: '' },
    { loc: '푸르지오 판교', det: '98인치 · 콘크리트 · 대형 TV 전용 브라켓', badge: '무타공', img: '', link: '' },
    { loc: 'e편한세상 용인', det: '75인치 · 아트월 단자함 일체형', badge: '아트월', img: '', link: '' },
    { loc: '롯데캐슬 송파', det: '55인치 · 콘크리트 · 사운드바 추가 설치', badge: '무타공', img: '', link: '' }
  ],

  reviews: [
    { text: '"벽에 구멍 하나 없이 75인치가 이렇게 안정적으로 걸릴 줄 몰랐어요. 시공 과정도 깔끔하고 선 정리까지 해주셔서 완전 만족입니다."', name: '이○○ 고객', apt: '성남 판교 자이' },
    { text: '"가벽이라 걱정했는데 보강 처리 후 85인치도 문제없이 시공됐어요. 기사님이 설명을 너무 잘 해주셔서 믿음이 갔습니다."', name: '박○○ 고객', apt: '수원 힐스테이트' },
    { text: '"이사하면서 재설치 요청드렸는데, 이전 설치 기록 보고 바로 확인해 주셨어요. 사후관리가 확실한 업체라 두고두고 믿을 수 있겠더라고요."', name: '김○○ 고객', apt: '인천 송도 더샵' },
    { text: '"98인치 대형 TV라 걱정이 많았는데, 사전에 벽면 사진 보내드렸더니 시공 가능 여부를 미리 확인해 주셨어요."', name: '정○○ 고객', apt: '용인 푸르지오' },
    { text: '"아트월 단자함 일체형 특수 시공인데, 기사님은 익숙하시다고 바로 진행하셨어요. 결과가 정말 깔끔했습니다."', name: '윤○○ 고객', apt: '동탄 e편한세상' },
    { text: '"견적 받을 때 영업 전화 없이 진행돼서 부담이 없었어요. 셋톱박스·공유기 선 정리까지 기본 포함이라 주변에도 추천했습니다."', name: '최○○ 고객', apt: '서울 마포' }
  ],

  compare: {
    eyebrow: 'DIRECT SERVICE',
    title: '설치보다 중요한 건,\n끝까지 책임지는 회사입니다.',
    sub: '견적부터 시공, 보증과 A/S까지 한 채널이 책임집니다.',
    generalTitle: '일반 외주 시공',
    generalItems: [
      '온라인 플랫폼에서 연결되는 다수 기사',
      '시공 기록 보관 없음, A/S 연락 불분명',
      '보험 미가입 또는 확인 어려움',
      '문제 발생 시 책임 소재 불분명'
    ],
    generalFooter: '시공은 끝났지만, 책임을 물을 곳이 없습니다.',
    proItems: [
      '전담 기사 1인 처음부터 끝까지 담당',
      '시공 기록 본사 보관, A/S 연락 명확',
      '배상책임보험 가입, 서류 요청 시 제공',
      '이사 재설치·이전 설치 사후관리까지 책임'
    ],
    proFooter: '견적, 시공, A/S까지 {company}가 끝까지 책임집니다.'
  },

  prices: [
    { size: '65인치 이하', range: '문의', note: '벽 구조와 추가 기기 여부에 따라 변동됩니다.' },
    { size: '70인치대', range: '문의', note: '브라켓 종류와 단자함 조건에 따라 변동됩니다.' },
    { size: '80인치대', range: '문의', note: 'TV 무게와 보강 상태 확인 후 확정합니다.' },
    { size: '90인치 이상', range: '문의', note: '대형 TV, 보조 인력, 특수 장비는 별도 검토합니다.' }
  ],

  priceIncludes: {
    title: '기본 포함 항목',
    tags: ['전용 자재', '방문 시공', '셋톱·공유기 선 정리', '배상책임보험', 'A/S 보증', '전문 설치기사']
  },

  process: {
    eyebrow: 'THE PROCESS',
    title: '견적은 30초,\n시공은 4단계로 진행합니다.',
    sub: '벽 환경과 추가 사양을 확인해 최종 견적을 안내드립니다.',
    steps: [
      { title: '무료 견적 신청', desc: 'TV 크기와 벽면 정보를 알려주시면 예상 견적을 바로 안내드립니다.', tag: '30초 이내' },
      { title: '상담 및 일정 확정', desc: '담당자가 통화 1회로 설치 방식, 자재, 일정을 확인하고 최종 견적을 안내합니다.', tag: '영업 전화 없음' },
      { title: '전문 기사 방문 시공', desc: '담당 기사가 방문해 무타공 브라켓 설치, 기기 거치, 선 정리까지 완료합니다.', tag: '1~2시간 소요' },
      { title: '시공 확인 및 A/S 등록', desc: '시공 완료 후 현장 확인, 기록 등록, A/S 연락처 안내까지 마무리합니다.', tag: '사후관리 책임' }
    ]
  },

  faq: [
    { q: '철골+석고보드로 만든 가벽에도 시공되나요?', a: '가벽에도 시공됩니다. 단자함 뒤를 철판(보강플레이트)으로 받쳐 보강한 가벽이라면 전용 가벽 키트로 최대 100인치까지 시공합니다. 콘크리트 벽에 석고보드를 마감한 벽도 그대로 시공됩니다.' },
    { q: '무타공인데 대형 TV가 떨어지지는 않나요?', a: '콘센트 안쪽 단자함에 본체(함체)를 고정하고 그 위에 프레임을 연결하는 2단계 구조입니다. 함체가 단자함을 상·하로 눌러 고정하고, 프레임과 패드가 벽면에 4면으로 밀착해 하중을 나눕니다.' },
    { q: '이사할 때 떼었다가 다시 쓸 수 있나요?', a: '함체와 프레임이 분리되는 2단계 구조라 이사할 때 재사용이 쉽습니다. 새 집 벽이 같은 환경이면 함체를 재사용해 시공합니다.' },
    { q: '견적은 무료인가요? 영업 전화가 오나요?', a: '상담과 1차 견적 안내는 무료입니다. 통화 1회로 설치 방식·자재·일정을 확인하고 예상 금액을 안내합니다. 확인 통화 외 별도 영업 전화는 없습니다.' },
    { q: '98인치·100인치 대형 TV도 시공되나요?', a: '됩니다. 지원 범위는 50~100인치이고 98인치 시공 사례가 실제로 있습니다. 콘크리트 벽은 표준 시공으로 진행하고, 가벽은 보강플레이트를 댄 뒤 전용 가벽 키트로 시공합니다.' }
  ],

  cta: {
    title: '지금 바로 무료 견적을\n받아보세요.',
    sub: 'TV 크기와 벽 정보만 알려주시면, 빠르게 안내드립니다.',
    btn: '무료 견적 받기 →',
    note: '영업 전화 없음 · 30초 이내 접수 완료'
  },

  floatBtn: '무료 견적 →'
};

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return DEFAULT_DATA;
  }
}

function saveData(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/content', (req, res) => { res.json(loadData()); });

app.post('/api/auth', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false, error: '비밀번호가 올바르지 않습니다.' });
  }
});

app.post('/api/content', (req, res) => {
  const { password, data } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: '인증 실패' });
  }
  try {
    saveData(data);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ── 블로그 포스트 CRUD ─────────────────────────────────────────────────────────

function loadPosts() {
  try { return JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8')); } catch { return []; }
}
function savePosts(posts) {
  fs.mkdirSync(path.dirname(POSTS_FILE), { recursive: true });
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');
}

app.use('/data/uploads', express.static(UPLOADS_DIR));

// 포스트 목록
app.get('/api/posts', (req, res) => {
  const posts = loadPosts();
  const limit = parseInt(req.query.limit) || 200;
  res.json(posts.slice(0, limit));
});

// 포스트 상세
app.get('/api/posts/:slug', (req, res) => {
  const post = loadPosts().find(p => p.slug === req.params.slug);
  if (!post) return res.status(404).json({ error: 'not found' });
  res.json(post);
});

// 포스트 등록 (블로그 자동 발행 앱에서 호출)
app.post('/api/posts', upload.single('thumbnail'), (req, res) => {
  const { region, title, body, slug, meta_description } = req.body;
  if (!title || !slug) return res.status(400).json({ error: 'title, slug 필수' });
  const posts = loadPosts();
  if (posts.find(p => p.slug === slug)) return res.status(409).json({ error: '중복 slug' });
  const thumbnailUrl = req.file ? `/data/uploads/${req.file.filename}` : '';
  const post = {
    id: Date.now().toString(),
    slug, region: region || '', title, body: body || '',
    thumbnail_url: thumbnailUrl,
    meta_description: meta_description || '',
    created_at: Date.now()
  };
  posts.unshift(post);
  savePosts(posts);
  res.json({ ok: true, id: post.id, slug: post.slug, url: `/blog/${post.slug}` });
});

// 포스트 삭제
app.delete('/api/posts/:id', (req, res) => {
  const posts = loadPosts().filter(p => p.id !== req.params.id);
  savePosts(posts);
  res.json({ ok: true });
});

// 블로그 포스트 페이지
app.get('/blog/:slug', (req, res) => {
  const post = loadPosts().find(p => p.slug === req.params.slug);
  if (!post) return res.status(404).send('Not found');
  const html = `<!DOCTYPE html><html lang="ko"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${post.title} | TV마스터365</title>
<meta name="description" content="${(post.meta_description||'').replace(/"/g,'&quot;')}">
<link rel="canonical" href="https://tvmaster365-production.up.railway.app/blog/${post.slug}">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Noto Sans KR',sans-serif;background:#F7F7F6;color:#111214;line-height:1.8}
.wrap{max-width:780px;margin:0 auto;padding:40px 24px 80px}
h1{font-size:clamp(22px,3.5vw,32px);font-weight:900;line-height:1.3;margin-bottom:16px;letter-spacing:-.025em}
h2{font-size:20px;font-weight:700;margin:36px 0 12px;padding-top:8px;border-top:2px solid #E8E8E8}
h3{font-size:16px;font-weight:700;margin:24px 0 8px;color:#333}
p{margin-bottom:14px;font-size:15.5px}
ul,ol{padding-left:22px;margin-bottom:14px}
li{margin-bottom:6px;font-size:15px}
table{width:100%;border-collapse:collapse;margin:18px 0;font-size:14px}
th{background:#111214;color:#fff;padding:10px 12px;text-align:left}
td{padding:9px 12px;border-bottom:1px solid #E0E0E0}
tr:nth-child(even) td{background:#F5F5F4}
.post-date{font-size:12.5px;color:#999;margin-bottom:28px}
.post-img-wrap{margin:20px 0;border-radius:8px;overflow:hidden}
.post-img-wrap img{width:100%;display:block}
.post-toc{background:#fff;border:1px solid #E0E0E0;border-radius:8px;padding:18px 22px;margin:20px 0 32px}
.post-toc strong{display:block;font-size:14px;font-weight:700;margin-bottom:10px}
.toc-list{padding-left:20px}
.toc-list li{margin-bottom:4px;font-size:13.5px}
.toc-list .toc-sub{padding-left:16px;list-style:circle;color:#555}
.cta-box{background:#111214;color:#fff;border-radius:10px;padding:28px 24px;margin:40px 0;text-align:center}
.cta-box h3{color:#fff;border:none;margin:0 0 8px;font-size:18px}
.cta-box p{color:rgba(255,255,255,.75);margin:0 0 16px}
.cta-box a{display:inline-block;background:#D42B2B;color:#fff;padding:10px 24px;border-radius:7px;font-weight:700;text-decoration:none;font-size:15px}
.hdr{background:#111214;padding:14px 24px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:10}
.hdr-logo{color:#fff;font-weight:900;font-size:16px;text-decoration:none}
.hdr-logo span{color:#D42B2B}
.hdr-back{color:rgba(255,255,255,.6);font-size:13px;text-decoration:none;margin-left:auto}
.hdr-back:hover{color:#fff}
</style></head><body>
<nav class="hdr"><a class="hdr-logo" href="/"><span>TV</span>마스터365</a><a class="hdr-back" href="/">← 홈으로</a></nav>
<div class="wrap">${post.body}</div>
</body></html>`;
  res.send(html);
});

// ── SEO: 사이트맵 & 네이버 서치 어드바이저 ────────────────────────────────────

const SITE_URL = process.env.SITE_URL || 'https://tvmaster365-production.up.railway.app';
const NAVER_VERIFY = process.env.NAVER_SITE_VERIFICATION || '';

// 동적 sitemap.xml — 홈 + 블로그 포스트 자동 포함
app.get('/sitemap.xml', (req, res) => {
  const posts = loadPosts();
  const today = new Date().toISOString().split('T')[0];

  const staticUrls = [
    `<url><loc>${SITE_URL}/</loc><changefreq>weekly</changefreq><priority>1.0</priority><lastmod>${today}</lastmod></url>`,
  ];

  const postUrls = posts.map(p => {
    const date = new Date(p.created_at).toISOString().split('T')[0];
    return `<url><loc>${SITE_URL}/blog/${p.slug}</loc><changefreq>monthly</changefreq><priority>0.8</priority><lastmod>${date}</lastmod></url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...postUrls].join('\n')}
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

// RSS 2.0 피드 — 블로그 포스트 자동 포함
app.get('/rss.xml', (req, res) => {
  const posts = loadPosts();
  const escXml = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const items = posts.slice(0, 50).map(p => {
    const pubDate = new Date(p.created_at).toUTCString();
    const thumbnail = p.thumbnail_url
      ? `<enclosure url="${SITE_URL}${escXml(p.thumbnail_url)}" type="image/jpeg" length="0"/>`
      : '';
    return `  <item>
    <title>${escXml(p.title)}</title>
    <link>${SITE_URL}/blog/${escXml(p.slug)}</link>
    <guid isPermaLink="true">${SITE_URL}/blog/${escXml(p.slug)}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${escXml(p.meta_description || p.title)}</description>
    ${thumbnail}
  </item>`;
  }).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TV마스터365 — TV 벽걸이 설치 전문</title>
    <link>${SITE_URL}/</link>
    <description>서울·경기·인천 TV 벽걸이 설치 전문 TV마스터365 블로그</description>
    <language>ko</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  res.set('Content-Type', 'application/rss+xml; charset=utf-8');
  res.send(rss);
});

// 네이버 서치 어드바이저 HTML 인증 파일 (NAVER_HTML_FILE 환경변수로 파일명, NAVER_HTML_CONTENT로 내용 지정)
const NAVER_HTML_FILE = process.env.NAVER_HTML_FILE || '';
const NAVER_HTML_CONTENT = process.env.NAVER_HTML_CONTENT || '';
if (NAVER_HTML_FILE && NAVER_HTML_CONTENT) {
  app.get(`/${NAVER_HTML_FILE}`, (req, res) => {
    res.set('Content-Type', 'text/html');
    res.send(NAVER_HTML_CONTENT);
  });
}

app.listen(PORT, () => {
  console.log(`TV마스터365 서버 실행 중: http://localhost:${PORT}`);
});
