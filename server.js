const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'content.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin365';

app.use(express.json({ limit: '2mb' }));
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
  cases: [
    { loc: '래미안 위례신도시', det: '75인치 · 콘크리트 벽 · 무타공 기본형', badge: '무타공' },
    { loc: '힐스테이트 동탄', det: '85인치 · 석고보드 가벽 · 보강판 적용', badge: '가벽 보강' },
    { loc: '자이 마곡', det: '65인치 · 선 매립 마감 · 기기 거치대 포함', badge: '선 매립' },
    { loc: '푸르지오 판교', det: '98인치 · 콘크리트 · 대형 TV 전용 브라켓', badge: '무타공' },
    { loc: 'e편한세상 용인', det: '75인치 · 아트월 단자함 일체형', badge: '아트월' },
    { loc: '롯데캐슬 송파', det: '55인치 · 콘크리트 · 사운드바 추가 설치', badge: '무타공' }
  ],
  reviews: [
    { text: '"벽에 구멍 하나 없이 75인치가 이렇게 안정적으로 걸릴 줄 몰랐어요. 시공 과정도 깔끔하고 선 정리까지 해주셔서 완전 만족입니다."', name: '이○○ 고객', apt: '성남 판교 자이' },
    { text: '"가벽이라 걱정했는데 보강 처리 후 85인치도 문제없이 시공됐어요. 기사님이 설명을 너무 잘 해주셔서 믿음이 갔습니다."', name: '박○○ 고객', apt: '수원 힐스테이트' },
    { text: '"이사하면서 재설치 요청드렸는데, 이전 설치 기록 보고 바로 확인해 주셨어요. 사후관리가 확실한 업체라 두고두고 믿을 수 있겠더라고요."', name: '김○○ 고객', apt: '인천 송도 더샵' },
    { text: '"98인치 대형 TV라 걱정이 많았는데, 사전에 벽면 사진 보내드렸더니 시공 가능 여부를 미리 확인해 주셨어요."', name: '정○○ 고객', apt: '용인 푸르지오' },
    { text: '"아트월 단자함 일체형 특수 시공인데, 기사님은 익숙하시다고 바로 진행하셨어요. 결과가 정말 깔끔했습니다."', name: '윤○○ 고객', apt: '동탄 e편한세상' },
    { text: '"견적 받을 때 영업 전화 없이 진행돼서 부담이 없었어요. 셋톱박스·공유기 선 정리까지 기본 포함이라 주변에도 추천했습니다."', name: '최○○ 고객', apt: '서울 마포' }
  ],
  faq: [
    { q: '철골+석고보드로 만든 가벽에도 시공되나요?', a: '가벽에도 시공됩니다. 단자함 뒤를 철판(보강플레이트)으로 받쳐 보강한 가벽이라면 전용 가벽 키트로 최대 100인치까지 시공합니다. 콘크리트 벽에 석고보드를 마감한 벽도 그대로 시공됩니다.' },
    { q: '무타공인데 대형 TV가 떨어지지는 않나요?', a: '콘센트 안쪽 단자함에 본체(함체)를 고정하고 그 위에 프레임을 연결하는 2단계 구조입니다. 함체가 단자함을 상·하로 눌러 고정하고, 프레임과 패드가 벽면에 4면으로 밀착해 하중을 나눕니다.' },
    { q: '이사할 때 떼었다가 다시 쓸 수 있나요?', a: '함체와 프레임이 분리되는 2단계 구조라 이사할 때 재사용이 쉽습니다. 새 집 벽이 같은 환경이면 함체를 재사용해 시공합니다.' },
    { q: '견적은 무료인가요? 영업 전화가 오나요?', a: '상담과 1차 견적 안내는 무료입니다. 통화 1회로 설치 방식·자재·일정을 확인하고 예상 금액을 안내합니다. 확인 통화 외 별도 영업 전화는 없습니다.' },
    { q: '98인치·100인치 대형 TV도 시공되나요?', a: '됩니다. 지원 범위는 50~100인치이고 98인치 시공 사례가 실제로 있습니다. 콘크리트 벽은 표준 시공으로 진행하고, 가벽은 보강플레이트를 댄 뒤 전용 가벽 키트로 시공합니다.' }
  ],
  prices: [
    { size: '65인치 이하', range: '문의', note: '벽 구조와 추가 기기 여부에 따라 변동됩니다.' },
    { size: '70인치대', range: '문의', note: '브라켓 종류와 단자함 조건에 따라 변동됩니다.' },
    { size: '80인치대', range: '문의', note: 'TV 무게와 보강 상태 확인 후 확정합니다.' },
    { size: '90인치 이상', range: '문의', note: '대형 TV, 보조 인력, 특수 장비는 별도 검토합니다.' }
  ]
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

// Public: get content
app.get('/api/content', (req, res) => {
  res.json(loadData());
});

// Admin: check password
app.post('/api/auth', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false, error: '비밀번호가 올바르지 않습니다.' });
  }
});

// Admin: save content
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

// Admin: change password
app.post('/api/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (currentPassword !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: '현재 비밀번호가 올바르지 않습니다.' });
  }
  // Railway에서는 env var로 관리 권장 — 여기서는 런타임 메모리 업데이트
  // 실제 영구 변경은 Railway 환경변수 ADMIN_PASSWORD 수정 필요
  res.json({ ok: true, note: 'Railway 환경변수 ADMIN_PASSWORD를 변경해주세요.' });
});

app.listen(PORT, () => {
  console.log(`TV마스터365 서버 실행 중: http://localhost:${PORT}`);
});
