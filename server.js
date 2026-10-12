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

// index.html — OG 메타 태그 + 네이버 인증 태그 동적 주입
app.get('/', (req, res) => {
  const d = loadData();
  const siteUrl = process.env.SITE_URL || 'https://tvmaster365-production.up.railway.app';

  const ogTitle = 'TV마스터365 — TV 벽걸이 설치 전문';
  const ogDesc  = d.desc || '서울·경기·인천 TV 벽걸이 설치 전문. 무료 견적 010-6213-0555';
  // OG 이미지: 어드민에서 설정한 히어로 이미지 → 환경변수 → 없으면 생략
  const heroImg = d.hero?.img || '';
  const ogImgUrl = heroImg
    ? (heroImg.startsWith('http') ? heroImg : siteUrl + heroImg)
    : (process.env.OG_IMAGE_URL || '');

  const ogTags = [
    `<meta name="description" content="${ogDesc.replace(/"/g,'&quot;')}">`,
    `<link rel="canonical" href="${siteUrl}/">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="TV마스터365">`,
    `<meta property="og:title" content="${ogTitle}">`,
    `<meta property="og:description" content="${ogDesc.replace(/"/g,'&quot;')}">`,
    `<meta property="og:url" content="${siteUrl}/">`,
    ogImgUrl ? `<meta property="og:image" content="${ogImgUrl}">` : '',
    ogImgUrl ? `<meta property="og:image:width" content="1200">` : '',
    ogImgUrl ? `<meta property="og:image:height" content="630">` : '',
    `<meta name="twitter:card" content="${ogImgUrl ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${ogTitle}">`,
    `<meta name="twitter:description" content="${ogDesc.replace(/"/g,'&quot;')}">`,
    ogImgUrl ? `<meta name="twitter:image" content="${ogImgUrl}">` : '',
    process.env.NAVER_SITE_VERIFICATION
      ? `<meta name="naver-site-verification" content="${process.env.NAVER_SITE_VERIFICATION}">` : '',
  ].filter(Boolean).join('\n');

  // JSON-LD 구조화 데이터
  const escJ = v => JSON.stringify(v || '');
  const faqEntities = (d.faq || []).map(f =>
    `{"@type":"Question","name":${escJ(f.q)},"acceptedAnswer":{"@type":"Answer","text":${escJ(f.a)}}}`
  ).join(',');
  const jsonLd = [
    `<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"TV마스터365","alternateName":"TV마스터365 — TV 벽걸이 설치 전문","url":"${siteUrl}/","potentialAction":{"@type":"SearchAction","target":{"@type":"EntryPoint","urlTemplate":"${siteUrl}/blog?q={search_term_string}"},"query-input":"required name=search_term_string"}}</script>`,
    `<script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness","name":${escJ(d.company)},"url":"${siteUrl}/","telephone":${escJ(d.phone)},"address":{"@type":"PostalAddress","streetAddress":"소사로730번길 58, 5동 지2호","addressLocality":"부천시","addressRegion":"경기도","addressCountry":"KR"},"areaServed":["서울","경기","인천"],"openingHours":["Mo-Fr 09:30-18:00","Sa 09:00-13:00"]${ogImgUrl ? `,"image":${escJ(ogImgUrl)}` : ''}}</script>`,
    `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":${escJ(d.company)},"url":"${siteUrl}/","contactPoint":{"@type":"ContactPoint","telephone":${escJ(d.phone)},"contactType":"customer service","availableLanguage":"Korean"}}</script>`,
    faqEntities ? `<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[${faqEntities}]}</script>` : '',
  ].filter(Boolean).join('\n');

  let html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
  html = html.replace('<meta charset="UTF-8">', `<meta charset="UTF-8">\n${ogTags}`);
  html = html.replace('</head>', `${jsonLd}\n</head>`);
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
  desc: 'TV 벽걸이 설치 전문입니다. 서울·경기·인천 전 지역에서 50~100인치 TV를 책임 시공합니다.',

  hero: {
    eyebrow: '서울·경기·인천 전 지역 출장 시공',
    title: '벽은 그대로,\n50~100인치\nTV 벽걸이 전문',
    sub: '서울·경기·인천 전 지역\nTV 벽걸이 설치 전문 TV마스터365.',
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
    title: 'TV 벽걸이 설치 업체를 고를 때,\n이 4가지를 꼭 확인하세요.',
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
    { loc: '래미안 위례신도시', det: '75인치 · 콘크리트 벽 · 브라켓 설치', badge: '콘크리트', img: '', link: '' },
    { loc: '힐스테이트 동탄', det: '85인치 · 석고보드 가벽 · 보강판 적용', badge: '가벽 보강', img: '', link: '' },
    { loc: '자이 마곡', det: '65인치 · 선 매립 마감 · 기기 거치대 포함', badge: '선 매립', img: '', link: '' },
    { loc: '푸르지오 판교', det: '98인치 · 콘크리트 · 대형 TV 전용 브라켓', badge: '대형전용', img: '', link: '' },
    { loc: 'e편한세상 용인', det: '75인치 · 아트월 단자함 일체형', badge: '아트월', img: '', link: '' },
    { loc: '롯데캐슬 송파', det: '55인치 · 콘크리트 · 사운드바 추가 설치', badge: '사운드바', img: '', link: '' }
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
      { title: '전문 기사 방문 시공', desc: '담당 기사가 방문해 TV 브라켓 설치, 기기 거치, 선 정리까지 완료합니다.', tag: '1~2시간 소요' },
      { title: '시공 확인 및 A/S 등록', desc: '시공 완료 후 현장 확인, 기록 등록, A/S 연락처 안내까지 마무리합니다.', tag: '사후관리 책임' }
    ]
  },

  faq: [
    { q: '철골+석고보드로 만든 가벽에도 시공되나요?', a: '가벽에도 시공됩니다. 단자함 뒤를 철판(보강플레이트)으로 받쳐 보강한 가벽이라면 전용 가벽 키트로 최대 100인치까지 시공합니다. 콘크리트 벽에 석고보드를 마감한 벽도 그대로 시공됩니다.' },
    { q: '설치된 TV가 벽에서 떨어지지는 않나요?', a: '전용 브라켓과 고강도 앵커볼트로 고정하므로 올바른 시공 시 하중 문제가 없습니다. 설치 후 하중 테스트를 완료하고 마무리합니다.' },
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

// 범용 이미지 업로드 (히어로 이미지 등)
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '파일 없음' });
  res.json({ ok: true, url: `/data/uploads/${req.file.filename}` });
});

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
<link rel="canonical" href="${SITE_URL}/blog/${post.slug}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="TV마스터365">
<meta property="og:title" content="${post.title.replace(/"/g,'&quot;')} | TV마스터365">
<meta property="og:description" content="${(post.meta_description||post.title).replace(/"/g,'&quot;')}">
<meta property="og:url" content="${SITE_URL}/blog/${post.slug}">
${post.thumbnail_url ? `<meta property="og:image" content="${SITE_URL}${post.thumbnail_url}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE_URL}${post.thumbnail_url}">` : '<meta name="twitter:card" content="summary">'}
<meta name="twitter:title" content="${post.title.replace(/"/g,'&quot;')}">
<meta name="twitter:description" content="${(post.meta_description||post.title).replace(/"/g,'&quot;')}">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"TV마스터365","alternateName":"TV마스터365","url":"${SITE_URL}/"}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"TV마스터365","item":"${SITE_URL}/"},{"@type":"ListItem","position":2,"name":"블로그","item":"${SITE_URL}/blog"},{"@type":"ListItem","position":3,"name":"${post.title.replace(/"/g,'&quot;')}","item":"${SITE_URL}/blog/${post.slug}"}]}</script>
${post.thumbnail_url ? `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"${post.title.replace(/"/g,'&quot;')}","image":["${SITE_URL}${post.thumbnail_url}"],"datePublished":"${new Date(post.created_at).toISOString()}","dateModified":"${new Date(post.created_at).toISOString()}","author":{"@type":"Organization","name":"TV마스터365","url":"${SITE_URL}/"},"publisher":{"@type":"Organization","name":"TV마스터365","url":"${SITE_URL}/"}}</script>` : ''}
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

// ── 지역 동 데이터 ────────────────────────────────────────────────────────────
const AREA_DATA = {
  '서울': {
    '강남구':['역삼동','삼성동','청담동','도곡동','개포동','일원동','수서동','대치동','압구정동','논현동','신사동','세곡동'],
    '강동구':['천호동','성내동','암사동','강일동','길동','명일동','고덕동','상일동','둔촌동'],
    '강북구':['미아동','번동','수유동','우이동','인수동'],
    '강서구':['화곡동','방화동','등촌동','가양동','마곡동','발산동','염창동','우장산동','내발산동','외발산동'],
    '관악구':['신림동','봉천동','서원동','남현동','청룡동','행운동','낙성대동'],
    '광진구':['광장동','자양동','구의동','능동','중곡동','화양동','군자동'],
    '구로구':['구로동','신도림동','가리봉동','오류동','천왕동','고척동','항동','개봉동'],
    '금천구':['가산동','독산동','시흥동'],
    '노원구':['상계동','중계동','하계동','공릉동','월계동'],
    '도봉구':['도봉동','방학동','쌍문동','창동'],
    '동대문구':['이문동','휘경동','청량리동','회기동','전농동','용두동','신설동','답십리동'],
    '동작구':['사당동','흑석동','상도동','노량진동','대방동','신대방동'],
    '마포구':['공덕동','합정동','망원동','서교동','상암동','성산동','용강동','아현동'],
    '서대문구':['홍제동','홍은동','남가좌동','북가좌동','연희동','신촌동','창천동'],
    '서초구':['서초동','방배동','잠원동','반포동','양재동','내곡동'],
    '성동구':['성수동','왕십리동','금호동','옥수동','행당동','마장동','응봉동'],
    '성북구':['성북동','정릉동','장위동','길음동','석관동','종암동','동소문동'],
    '송파구':['잠실동','방이동','오금동','석촌동','풍납동','가락동','거여동','마천동'],
    '양천구':['목동','신정동','신월동'],
    '영등포구':['여의도동','영등포동','당산동','문래동','양평동','도림동','신길동','대림동'],
    '용산구':['이태원동','한남동','후암동','용산동','서계동','원효로동','청파동'],
    '은평구':['응암동','불광동','진관동','갈현동','구산동','녹번동','역촌동'],
    '종로구':['종로동','창신동','숭인동','무악동','교남동','사직동','청운동','효자동'],
    '중구':['명동','충무로','황학동','신당동','다산동','약수동','청구동'],
    '중랑구':['면목동','신내동','상봉동','묵동','망우동','중화동'],
  },
  '인천': {
    '계양구':['효성동','계산동','작전동','귤현동','박촌동','임학동','동양동'],
    '남동구':['구월동','만수동','논현동','간석동','장수동','운연동','남촌동'],
    '동구':['만석동','화수동','송현동','화평동','창영동'],
    '미추홀구':['주안동','도화동','용현동','학익동','숭의동','문학동'],
    '부평구':['부평동','갈산동','삼산동','청천동','십정동','산곡동','작전동','일신동','구산동','부개동'],
    '서구':['검단동','가정동','신현동','연희동','청라동','석남동','심곡동'],
    '연수구':['송도동','연수동','청학동','옥련동','선학동'],
    '중구':['인현동','신흥동','신포동','운남동','율목동','도원동'],
    '강화군':['강화읍','불은면','선원면','화도면','길상면'],
    '옹진군':['북도면','자월면','영흥면','덕적면'],
  },
  '경기': {
    '가평군':['가평읍','청평면','상면','조종면'],
    '고양시':['일산동구','일산서구','덕양구'],
    '과천시':['중앙동','별양동','갈현동','과천동','문원동'],
    '광명시':['철산동','하안동','광명동','소하동','학온동'],
    '광주시':['경안동','오포읍','초월읍','곤지암읍'],
    '구리시':['수택동','인창동','교문동','토평동','아천동'],
    '군포시':['산본동','금정동','부곡동','당정동','대야미동'],
    '김포시':['풍무동','사우동','양촌읍','통진읍','고촌읍'],
    '남양주시':['화도읍','다산동','오남읍','진접읍','별내동'],
    '동두천시':['생연동','지행동','소요동','걸산동'],
    '부천시':['소사구','오정구','원미구'],
    '성남시':['분당구','중원구','수정구'],
    '수원시':['팔달구','영통구','권선구','장안구'],
    '시흥시':['정왕동','신천동','능곡동','월곶동','배곧동'],
    '안산시':['단원구','상록구'],
    '안성시':['안성읍','공도읍','원곡면','보개면'],
    '안양시':['만안구','동안구'],
    '양주시':['회천동','옥정동','광적면','남면'],
    '양평군':['양평읍','지평면','용문면','강상면'],
    '여주시':['여주읍','가남읍','점동면','흥천면'],
    '연천군':['연천읍','전곡읍','청산면','신서면'],
    '오산시':['오산동','세마동','가수동','금암동'],
    '용인시':['수지구','기흥구','처인구'],
    '의왕시':['오전동','청계동','내손동','고천동'],
    '의정부시':['의정부동','가능동','호원동','신곡동','장암동'],
    '이천시':['부발읍','창전동','중리동','진리동'],
    '파주시':['운정동','금촌동','문산읍','법원읍'],
    '평택시':['평택동','서정동','안중읍','팽성읍'],
    '포천시':['포천동','소흘읍','군내면','내촌면'],
    '하남시':['창우동','미사동','덕풍동','풍산동','감일동'],
    '화성시':['동탄동','반월동','우정읍','봉담읍','향남읍'],
  }
};

// ── 지역별 랜딩 페이지 (구/시 단위) ─────────────────────────────────────────
app.get('/area/:region', (req, res) => {
  const regionSlug = req.params.region;
  const region = decodeURIComponent(regionSlug).replace(/-/g, ' ');
  const parts = region.split(' ');
  const sido = parts[0];
  const gu   = parts.slice(1).join(' ');
  const areaName = gu ? `${sido} ${gu}` : sido;
  const posts = loadPosts().filter(p => p.region && p.region.includes(gu || sido)).slice(0, 6);
  const d = loadData();
  const phone = d.phone || '010-6213-0555';
  const phoneDigits = phone.replace(/-/g,'');
  const desc = `${areaName} TV 벽걸이 설치 전문 TV마스터365. 가벽·콘크리트·대형 TV 설치. 무료 견적 ${phone}`;
  const canonUrl = `${SITE_URL}/area/${regionSlug}`;

  const dongs = (AREA_DATA[sido] && AREA_DATA[sido][gu]) ? AREA_DATA[sido][gu] : [];
  const dongCards = dongs.map(dong => {
    return `<a class="dong-card" href="/area/${regionSlug}/${encodeURIComponent(dong)}"><strong>${dong}</strong><span>TV 벽걸이 설치 안내</span></a>`;
  }).join('');

  const postItems = posts.length ? posts.map(p => {
    const thumb = p.thumbnail_url
      ? `<img class="pc-thumb" src="${p.thumbnail_url}" alt="${p.title}" loading="lazy">`
      : `<div class="pc-thumb pc-thumb-placeholder"><span class="pc-pl-area">${p.region||areaName}</span><span class="pc-pl-svc">TV 벽걸이 설치</span><span class="pc-pl-phone">${phone}</span></div>`;
    const dt = p.created_at ? new Date(p.created_at).toLocaleDateString('ko-KR').replace(/\. /g,'.').replace('.','') : '';
    return `<article class="pc"><a href="/blog/${p.slug}" class="pc-link">${thumb}<div class="pc-info"><time class="pc-date">${dt}</time><h3 class="pc-title">${p.title}</h3><span class="pc-more">자세히 보기 ›</span></div></a></article>`;
  }).join('') : `<p class="no-posts">블로그 포스트가 곧 등록됩니다.</p>`;

  const ldWebSite = `{"@context":"https://schema.org","@type":"WebSite","name":"TV마스터365","url":"${SITE_URL}/"}`;
  const ldBreadcrumb = JSON.stringify({"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"TV마스터365","item":SITE_URL+"/"},{"@type":"ListItem","position":2,"name":"서비스 지역","item":SITE_URL+"/#sec-area"},{"@type":"ListItem","position":3,"name":areaName,"item":canonUrl}]});
  const ldLocal = JSON.stringify({"@context":"https://schema.org","@type":"LocalBusiness","name":"TV마스터365","url":SITE_URL+"/","telephone":phone,"areaServed":areaName,"address":{"@type":"PostalAddress","streetAddress":"소사로730번길 58, 5동 지2호","addressLocality":"부천시","addressRegion":"경기도","addressCountry":"KR"}});

  const html = `<!DOCTYPE html><html lang="ko"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${areaName} TV 벽걸이 설치 전문 | TV마스터365</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonUrl}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="TV마스터365">
<meta property="og:title" content="${areaName} TV 벽걸이 설치 전문 | TV마스터365">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonUrl}">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">${ldWebSite}</script>
<script type="application/ld+json">${ldBreadcrumb}</script>
<script type="application/ld+json">${ldLocal}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Noto Sans KR',sans-serif;background:#F7F7F6;color:#111214;line-height:1.75}
a{color:inherit;text-decoration:none}
.hdr{background:#111214;padding:14px 20px;display:flex;align-items:center;position:sticky;top:0;z-index:99}
.hdr-logo{color:#fff;font-weight:900;font-size:17px}
.hdr-logo em{color:#D42B2B;font-style:normal}
.hdr-phone{margin-left:auto;background:#D42B2B;color:#fff;font-size:13px;font-weight:700;padding:7px 14px;border-radius:6px}
.wrap{max-width:880px;margin:0 auto;padding:0 20px 80px}
.bc{font-size:12px;color:#999;padding:14px 0 0;display:flex;gap:6px;align-items:center}
.bc a{color:#D42B2B}
.bc-sep{color:#ccc}
/* HERO */
.hero{padding:36px 0 28px;border-bottom:1px solid #E4E4E4}
.hero-badge{font-size:11px;font-weight:700;letter-spacing:.12em;color:#D42B2B;margin-bottom:10px}
.hero h1{font-size:clamp(20px,4vw,32px);font-weight:900;line-height:1.35;margin-bottom:18px}
.checklist{list-style:none;display:flex;flex-direction:column;gap:8px;margin-bottom:24px}
.checklist li{display:flex;align-items:flex-start;gap:8px;font-size:15px}
.checklist li::before{content:"✓";color:#D42B2B;font-weight:700;flex-shrink:0;margin-top:2px}
.btn-cta{display:inline-flex;align-items:center;gap:8px;background:#D42B2B;color:#fff;font-size:15px;font-weight:700;padding:13px 28px;border-radius:8px;margin-top:4px}
.btn-cta:hover{background:#B01E1E}
/* NEIGHBORHOODS */
.sec{padding:40px 0;border-bottom:1px solid #E4E4E4}
.sec-badge{font-size:11px;font-weight:700;letter-spacing:.12em;color:#888;margin-bottom:8px}
.sec h2{font-size:20px;font-weight:900;margin-bottom:8px}
.sec-sub{font-size:14px;color:#666;margin-bottom:24px}
.dong-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
.dong-card{display:flex;flex-direction:column;gap:4px;background:#fff;border:1px solid #E4E4E4;border-radius:8px;padding:14px 16px;transition:border-color .15s,box-shadow .15s}
.dong-card:hover{border-color:#D42B2B;box-shadow:0 2px 8px rgba(212,43,43,.12)}
.dong-card strong{font-size:15px;font-weight:700;color:#111214}
.dong-card span{font-size:12px;color:#999}
/* BLOG CARD GRID */
.pc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:8px}
@media(max-width:640px){.pc-grid{grid-template-columns:1fr}}
.pc{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);transition:box-shadow .15s}
.pc:hover{box-shadow:0 4px 16px rgba(0,0,0,.14)}
.pc-link{display:block;color:inherit;text-decoration:none}
.pc-thumb{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}
.pc-thumb-placeholder{width:100%;aspect-ratio:16/9;background:#111421;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:16px;text-align:center}
.pc-pl-area{font-size:13px;font-weight:700;color:#4FC3F7;letter-spacing:.04em}
.pc-pl-svc{font-size:16px;font-weight:900;color:#fff}
.pc-pl-phone{font-size:14px;font-weight:700;color:#fff;margin-top:4px}
.pc-info{padding:14px 16px 16px}
.pc-date{font-size:11px;color:#999;display:block;margin-bottom:6px}
.pc-title{font-size:14px;font-weight:700;color:#111214;line-height:1.45;margin-bottom:8px}
.pc-more{font-size:12px;color:#D42B2B;font-weight:600}
.no-posts{font-size:14px;color:#999;padding:16px 0}
/* PROCESS */
.proc-list{display:flex;flex-direction:column;gap:0;counter-reset:proc;margin-top:20px}
.proc-item{display:flex;gap:16px;padding:16px 0;border-bottom:1px solid #F0F0F0;counter-increment:proc}
.proc-item:last-child{border-bottom:none}
.proc-num{width:32px;height:32px;background:#D42B2B;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0}
.proc-body h3{font-size:15px;font-weight:700;margin-bottom:4px}
.proc-body p{font-size:13px;color:#666}
/* FAQ */
.faq-item{padding:16px 0;border-bottom:1px solid #F0F0F0}
.faq-item:last-child{border-bottom:none}
.faq-q{font-size:15px;font-weight:700;margin-bottom:6px}
.faq-a{font-size:14px;color:#555;line-height:1.7}
/* FINAL CTA */
.final-cta{background:#111214;border-radius:12px;padding:36px 28px;text-align:center;margin-top:40px}
.final-cta h2{color:#fff;font-size:20px;font-weight:900;margin-bottom:8px}
.final-cta p{color:rgba(255,255,255,.7);font-size:14px;margin-bottom:20px}
.final-cta .btn-group{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.btn-primary{background:#D42B2B;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:7px}
.btn-ghost{background:transparent;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:7px;border:1px solid rgba(255,255,255,.3)}
.footer{text-align:center;font-size:12px;color:#aaa;padding:30px 20px 0;border-top:1px solid #E4E4E4;margin-top:40px}
@media(max-width:480px){.dong-grid{grid-template-columns:repeat(2,1fr)}.svc-grid{grid-template-columns:1fr}}
</style></head><body>
<header class="hdr">
  <a class="hdr-logo" href="/"><em>TV</em>마스터365</a>
  <a class="hdr-phone" href="tel:${phoneDigits}">☎ ${phone}</a>
</header>
<div class="wrap">
  <nav class="bc"><a href="/">홈</a><span class="bc-sep">›</span><a href="/#sec-area">서비스 지역</a><span class="bc-sep">›</span><span>${areaName}</span></nav>

  <section class="hero">
    <p class="hero-badge">LOCAL SERVICE</p>
    <h1>${areaName} TV 벽걸이 설치<br>전문 안내</h1>
    <ul class="checklist">
      <li>가벽·아트월·콘크리트 벽 구분 없이 시공</li>
      <li>50~100인치 전 사이즈, 당일~익일 방문</li>
      <li>배상책임보험 가입 · 시공 기록 보관 · A/S 보장</li>
      <li>현장 추가 비용 없음 — 사전 견적 후 확정</li>
    </ul>
    <a class="btn-cta" href="tel:${phoneDigits}">☎ ${phone} 전화 상담</a>
  </section>

  ${dongs.length ? `
  <section class="sec">
    <p class="sec-badge">NEIGHBORHOODS</p>
    <h2>${areaName} TV 설치 서비스 지역</h2>
    <p class="sec-sub">${areaName} 내 동·읍·면을 선택하면 상세 설치 안내를 확인할 수 있습니다.</p>
    <div class="dong-grid">${dongCards}</div>
  </section>` : ''}

  ${posts.length ? `
  <section class="sec">
    <p class="sec-badge">BLOG CASE</p>
    <h2>${areaName} TV 벽걸이 설치 사례</h2>
    <p class="sec-sub">TV마스터365가 ${areaName}에서 진행한 실제 시공 사례입니다.</p>
    <div class="pc-grid">${postItems}</div>
  </section>` : ''}

  <section class="sec">
    <p class="sec-badge">PROCESS</p>
    <h2>TV 벽걸이 설치 과정</h2>
    <div class="proc-list">
      <div class="proc-item"><div class="proc-num">1</div><div class="proc-body"><h3>전화 상담 및 견적</h3><p>TV 크기·벽 구조·동 위치 확인 후 견적을 먼저 안내합니다.</p></div></div>
      <div class="proc-item"><div class="proc-num">2</div><div class="proc-body"><h3>방문 일정 확정</h3><p>원하는 날짜·시간에 전문 기사가 방문합니다. 당일 시공도 가능합니다.</p></div></div>
      <div class="proc-item"><div class="proc-num">3</div><div class="proc-body"><h3>현장 구조 확인</h3><p>벽 구조·단자함 위치 확인 후 최적 시공 방법을 결정합니다.</p></div></div>
      <div class="proc-item"><div class="proc-num">4</div><div class="proc-body"><h3>설치 완료 및 마무리</h3><p>선 정리까지 완료 후 수평·고정력 최종 점검합니다.</p></div></div>
    </div>
  </section>

  <section class="sec">
    <p class="sec-badge">FAQ</p>
    <h2>${areaName} 자주 묻는 질문</h2>
    <div class="faq-item"><p class="faq-q">${areaName} TV 벽걸이 설치 비용은 얼마인가요?</p><p class="faq-a">TV 크기와 벽 구조에 따라 다릅니다. 전화 상담 시 크기와 벽 상태를 알려주시면 견적을 먼저 안내드립니다. 현장 추가 비용은 없습니다.</p></div>
    <div class="faq-item"><p class="faq-q">${areaName}에서 당일 시공이 가능한가요?</p><p class="faq-a">예약 일정에 따라 당일~익일 시공이 가능합니다. 연락 시 기사 배치 현황을 바로 확인해 드립니다.</p></div>
    <div class="faq-item"><p class="faq-q">임대 아파트에도 설치할 수 있나요?</p><p class="faq-a">벽 구조에 따라 원상 복구가 가능한 방식으로 시공합니다. 임대 아파트도 상담 후 설치 가능합니다.</p></div>
    <div class="faq-item"><p class="faq-q">가벽에도 TV를 걸 수 있나요?</p><p class="faq-a">보강플레이트를 사용하면 석고보드 가벽에도 50~100인치 TV 설치가 가능합니다. 벽 상태를 사진으로 보내주시면 확인해 드립니다.</p></div>
  </section>

  <div class="final-cta">
    <h2>${areaName} TV 벽걸이 설치<br>지금 무료 견적 받으세요</h2>
    <p>365일 방문 시공 · 현장 추가 비용 없음 · 배상책임보험 가입</p>
    <div class="btn-group">
      <a class="btn-primary" href="tel:${phoneDigits}">☎ ${phone} 전화 문의</a>
      <a class="btn-ghost" href="/#sec-area">← 지역 목록으로</a>
    </div>
  </div>

  <footer class="footer">TV마스터365 · 서울·경기·인천 출장 TV 벽걸이 설치 전문 · ${phone}</footer>
</div></body></html>`;
  res.send(html);
});

// ── 동 단위 랜딩 페이지 (/area/서울-강남구/역삼동) ──────────────────────────
app.get('/area/:regionSlug/:dong', (req, res, next) => {
  const regionSlug = req.params.regionSlug;
  const dong = decodeURIComponent(req.params.dong);
  const regionStr = decodeURIComponent(regionSlug).replace(/-/g, ' ');
  const sidoParts = regionStr.split(' ');
  const sido = sidoParts[0];
  const gu = sidoParts.slice(1).join(' ');
  const dongs = (AREA_DATA[sido] && AREA_DATA[sido][gu]) ? AREA_DATA[sido][gu] : [];
  if (!dongs.includes(dong)) return next();

  const areaName = `${sido} ${gu} ${dong}`;
  const d = loadData();
  const phone = d.phone || '010-6213-0555';
  const phoneDigits = phone.replace(/-/g,'');
  const desc = `${areaName} TV 벽걸이 설치 전문 TV마스터365. 무료 견적 ${phone}`;
  const canonUrl = `${SITE_URL}/area/${regionSlug}/${encodeURIComponent(dong)}`;
  const posts = loadPosts().filter(p => p.region && p.region.includes(dong)).slice(0, 5);

  const ldBreadcrumb = JSON.stringify({"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"TV마스터365","item":SITE_URL+"/"},{"@type":"ListItem","position":2,"name":"서비스 지역","item":SITE_URL+"/#sec-area"},{"@type":"ListItem","position":3,"name":`${sido} ${gu}`,"item":`${SITE_URL}/area/${regionSlug}`},{"@type":"ListItem","position":4,"name":areaName,"item":canonUrl}]});
  const ldLocal = JSON.stringify({"@context":"https://schema.org","@type":"LocalBusiness","name":"TV마스터365","url":SITE_URL+"/","telephone":phone,"areaServed":areaName});

  const postItems = posts.map(p => {
    const thumb = p.thumbnail_url
      ? `<img class="pc-thumb" src="${p.thumbnail_url}" alt="${p.title}" loading="lazy">`
      : `<div class="pc-thumb pc-thumb-placeholder"><span class="pc-pl-area">${p.region||areaName}</span><span class="pc-pl-svc">TV 벽걸이 설치</span><span class="pc-pl-phone">${phone}</span></div>`;
    const dt = p.created_at ? new Date(p.created_at).toLocaleDateString('ko-KR').replace(/\. /g,'.').replace('.','') : '';
    return `<article class="pc"><a href="/blog/${p.slug}" class="pc-link">${thumb}<div class="pc-info"><time class="pc-date">${dt}</time><h3 class="pc-title">${p.title}</h3><span class="pc-more">자세히 보기 ›</span></div></a></article>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="ko"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${areaName} TV 벽걸이 설치 전문 | TV마스터365</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonUrl}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="TV마스터365">
<meta property="og:title" content="${areaName} TV 벽걸이 설치 전문 | TV마스터365">
<meta property="og:url" content="${canonUrl}">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"TV마스터365","url":"${SITE_URL}/"}</script>
<script type="application/ld+json">${ldBreadcrumb}</script>
<script type="application/ld+json">${ldLocal}</script>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Noto Sans KR',sans-serif;background:#F7F7F6;color:#111214;line-height:1.75}
a{color:inherit;text-decoration:none}
.hdr{background:#111214;padding:14px 20px;display:flex;align-items:center;position:sticky;top:0;z-index:99}
.hdr-logo{color:#fff;font-weight:900;font-size:17px}
.hdr-logo em{color:#D42B2B;font-style:normal}
.hdr-phone{margin-left:auto;background:#D42B2B;color:#fff;font-size:13px;font-weight:700;padding:7px 14px;border-radius:6px}
.wrap{max-width:880px;margin:0 auto;padding:0 20px 80px}
.bc{font-size:12px;color:#999;padding:14px 0 0;display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.bc a{color:#D42B2B}
.bc-sep{color:#ccc}
.hero{padding:36px 0 28px;border-bottom:1px solid #E4E4E4}
.hero-badge{font-size:11px;font-weight:700;letter-spacing:.12em;color:#D42B2B;margin-bottom:10px}
.hero h1{font-size:clamp(20px,4vw,32px);font-weight:900;line-height:1.35;margin-bottom:18px}
.checklist{list-style:none;display:flex;flex-direction:column;gap:8px;margin-bottom:24px}
.checklist li{display:flex;align-items:flex-start;gap:8px;font-size:15px}
.checklist li::before{content:"✓";color:#D42B2B;font-weight:700;flex-shrink:0}
.btn-cta{display:inline-flex;align-items:center;gap:8px;background:#D42B2B;color:#fff;font-size:15px;font-weight:700;padding:13px 28px;border-radius:8px}
.sec{padding:36px 0;border-bottom:1px solid #E4E4E4}
.sec-badge{font-size:11px;font-weight:700;letter-spacing:.12em;color:#888;margin-bottom:8px}
.sec h2{font-size:20px;font-weight:900;margin-bottom:16px}
.pc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:4px}
@media(max-width:640px){.pc-grid{grid-template-columns:1fr}}
.pc{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);transition:box-shadow .15s}
.pc:hover{box-shadow:0 4px 16px rgba(0,0,0,.14)}
.pc-link{display:block;color:inherit;text-decoration:none}
.pc-thumb{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}
.pc-thumb-placeholder{width:100%;aspect-ratio:16/9;background:#111421;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:16px;text-align:center}
.pc-pl-area{font-size:12px;font-weight:700;color:#4FC3F7;letter-spacing:.04em}
.pc-pl-svc{font-size:15px;font-weight:900;color:#fff}
.pc-pl-phone{font-size:13px;font-weight:700;color:#fff;margin-top:4px}
.pc-info{padding:12px 14px 14px}
.pc-date{font-size:11px;color:#999;display:block;margin-bottom:5px}
.pc-title{font-size:13px;font-weight:700;color:#111214;line-height:1.45;margin-bottom:7px}
.pc-more{font-size:12px;color:#D42B2B;font-weight:600}
.faq-item{padding:14px 0;border-bottom:1px solid #F0F0F0}
.faq-q{font-size:15px;font-weight:700;margin-bottom:6px}
.faq-a{font-size:14px;color:#555;line-height:1.7}
.final-cta{background:#111214;border-radius:12px;padding:36px 28px;text-align:center;margin-top:40px}
.final-cta h2{color:#fff;font-size:20px;font-weight:900;margin-bottom:8px}
.final-cta p{color:rgba(255,255,255,.7);font-size:14px;margin-bottom:20px}
.btn-group{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.btn-primary{background:#D42B2B;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:7px}
.btn-ghost{background:transparent;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:7px;border:1px solid rgba(255,255,255,.3)}
.footer{text-align:center;font-size:12px;color:#aaa;padding:30px 20px 0;border-top:1px solid #E4E4E4;margin-top:40px}
</style></head><body>
<header class="hdr">
  <a class="hdr-logo" href="/"><em>TV</em>마스터365</a>
  <a class="hdr-phone" href="tel:${phoneDigits}">☎ ${phone}</a>
</header>
<div class="wrap">
  <nav class="bc"><a href="/">홈</a><span class="bc-sep">›</span><a href="/#sec-area">서비스 지역</a><span class="bc-sep">›</span><a href="/area/${encodeURIComponent(regionSlug)}">${sido} ${gu}</a><span class="bc-sep">›</span><span>${dong}</span></nav>
  <section class="hero">
    <p class="hero-badge">LOCAL SERVICE</p>
    <h1>${areaName} TV 벽걸이<br>설치 전문 안내</h1>
    <ul class="checklist">
      <li>가벽·콘크리트·아트월 모두 가능</li>
      <li>50~100인치, 당일~익일 방문</li>
      <li>배상책임보험 · A/S 보장</li>
    </ul>
    <a class="btn-cta" href="tel:${phoneDigits}">☎ ${phone} 전화 상담</a>
  </section>
  ${postItems ? `<section class="sec"><p class="sec-badge">BLOG CASE</p><h2>${areaName} 실제 시공 사례</h2><p style="font-size:14px;color:#666;margin-bottom:16px">TV마스터365가 ${areaName}에서 진행한 실제 시공 사례입니다.</p><div class="pc-grid">${postItems}</div></section>` : ''}
  <section class="sec">
    <p class="sec-badge">FAQ</p>
    <h2>${areaName} 자주 묻는 질문</h2>
    <div class="faq-item"><p class="faq-q">${areaName} TV 설치 비용은 얼마인가요?</p><p class="faq-a">TV 크기와 벽 구조에 따라 다릅니다. 전화 상담 시 먼저 견적을 안내드립니다.</p></div>
    <div class="faq-item"><p class="faq-q">당일 방문이 가능한가요?</p><p class="faq-a">예약 현황에 따라 당일~익일 방문이 가능합니다. 전화로 바로 확인해 드립니다.</p></div>
    <div class="faq-item"><p class="faq-q">임대 아파트에도 설치되나요?</p><p class="faq-a">벽 구조에 따라 원상 복구가 가능한 방식으로 시공합니다. 임대 아파트도 상담 후 설치 가능합니다.</p></div>
  </section>
  <div class="final-cta">
    <h2>${areaName} TV 벽걸이 설치<br>무료 견적 받기</h2>
    <p>365일 방문 · 현장 추가 비용 없음 · 배상책임보험 가입</p>
    <div class="btn-group">
      <a class="btn-primary" href="tel:${phoneDigits}">☎ ${phone} 전화 문의</a>
      <a class="btn-ghost" href="/area/${regionSlug}">← ${sido} ${gu}로</a>
    </div>
  </div>
  <footer class="footer">TV마스터365 · 서울·경기·인천 출장 TV 벽걸이 설치 전문 · ${phone}</footer>
</div></body></html>`;
  res.send(html);
});

// ── SEO: 사이트맵 & 네이버 서치 어드바이저 ────────────────────────────────────

const SITE_URL = process.env.SITE_URL || 'https://tvmaster365-production.up.railway.app';
const NAVER_VERIFY = process.env.NAVER_SITE_VERIFICATION || '';

// 동적 sitemap.xml — 홈 + 블로그 포스트 자동 포함
app.get('/sitemap.xml', (req, res) => {
  const posts = loadPosts();
  const today = new Date().toISOString().split('T')[0];

  const AREA_SLUGS = [
    '서울-강남구','서울-강동구','서울-강북구','서울-강서구','서울-관악구','서울-광진구',
    '서울-구로구','서울-금천구','서울-노원구','서울-도봉구','서울-동대문구','서울-동작구',
    '서울-마포구','서울-서대문구','서울-서초구','서울-성동구','서울-성북구','서울-송파구',
    '서울-양천구','서울-영등포구','서울-용산구','서울-은평구','서울-종로구','서울-중구','서울-중랑구',
    '인천-계양구','인천-남동구','인천-동구','인천-미추홀구','인천-부평구',
    '인천-서구','인천-연수구','인천-중구','인천-강화군','인천-옹진군',
    '경기-가평군','경기-고양시','경기-과천시','경기-광명시','경기-광주시','경기-구리시',
    '경기-군포시','경기-김포시','경기-남양주시','경기-동두천시','경기-부천시','경기-성남시',
    '경기-수원시','경기-시흥시','경기-안산시','경기-안성시','경기-안양시','경기-양주시',
    '경기-양평군','경기-여주시','경기-연천군','경기-오산시','경기-용인시','경기-의왕시',
    '경기-의정부시','경기-이천시','경기-파주시','경기-평택시','경기-포천시','경기-하남시','경기-화성시',
  ];
  const areaUrls = AREA_SLUGS.map(s =>
    `<url><loc>${SITE_URL}/area/${encodeURIComponent(s)}</loc><changefreq>monthly</changefreq><priority>0.7</priority><lastmod>${today}</lastmod></url>`
  );
  const staticUrls = [
    `<url><loc>${SITE_URL}/</loc><changefreq>weekly</changefreq><priority>1.0</priority><lastmod>${today}</lastmod></url>`,
    ...areaUrls,
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

  const postItems = posts.slice(0, 50).map(p => {
    const pubDate = new Date(p.created_at).toUTCString();
    return [
      '  <item>',
      `    <title><![CDATA[${p.title||''}]]></title>`,
      `    <link>${SITE_URL}/blog/${escXml(p.slug)}</link>`,
      `    <guid isPermaLink="true">${SITE_URL}/blog/${escXml(p.slug)}</guid>`,
      `    <pubDate>${pubDate}</pubDate>`,
      `    <description><![CDATA[${p.meta_description || p.title || ''}]]></description>`,
      '  </item>',
    ].join('\n');
  });

  // 포스트가 없을 때 홈페이지를 기본 아이템으로 추가 (빈 피드는 네이버가 오류 처리)
  if (postItems.length === 0) {
    postItems.push([
      '  <item>',
      '    <title><![CDATA[TV마스터365 — 서울 경기 인천 TV 벽걸이 설치 전문]]></title>',
      `    <link>${SITE_URL}/</link>`,
      `    <guid isPermaLink="true">${SITE_URL}/</guid>`,
      `    <pubDate>${new Date().toUTCString()}</pubDate>`,
      '    <description><![CDATA[TV 벽걸이 설치 전문. 서울 경기 인천 전 지역 출장 시공. 010-6213-0555]]></description>',
      '  </item>',
    ].join('\n'));
  }

  const items = postItems.join('\n');

  const buildDate = new Date().toUTCString();
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>TV마스터365 블로그</title>
    <link>${SITE_URL}/</link>
    <description>서울 경기 인천 TV 벽걸이 설치 전문 TV마스터365 블로그</description>
    <language>ko</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <generator>TV마스터365</generator>
${items}
  </channel>
</rss>`;

  res.set('Content-Type', 'text/xml; charset=utf-8');
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
