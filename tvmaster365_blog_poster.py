"""
TV마스터365 블로그 포스트 등록 프로그램
탭 1: 개별 생성 — 지역+주제 입력 → HTML 자동생성 → 업로드
탭 2: 발행 목록 — 등록된 포스트 조회·삭제
"""
import io, os, sys, threading, tkinter as tk, time, random
from tkinter import filedialog, ttk, scrolledtext, messagebox
from datetime import datetime, date

RAILWAY_URL_DEFAULT = "https://tvmaster365-production.up.railway.app"
PHONE         = "010-6213-0555"
PHONE_DIGITS  = "01062130555"
EMAIL         = "roqkq8202@naver.com"
BRAND         = "TV마스터365"
CEO           = "이천용"
ADDRESS       = "경기도 부천시 소사로730번길 58, 5동 지2호"
AREA_SERVICE  = "서울·경기·인천 전 지역"

# ── 주제 템플릿 ──────────────────────────────────────────────────────────────
TOPIC_TEMPLATES = {
    "타공 벽걸이 설치": {
        "url_kw": "타공-TV-벽걸이-설치",
        "title_variants": [
            "TV 벽걸이 타공 설치 방법과 안전 기준 완벽 가이드",
            "콘크리트 벽 TV 타공 설치 — 앵커·볼트 고정 시공 과정 공개",
            "아파트 TV 벽걸이 타공 설치, 가장 확실한 고정 방법",
            "TV 타공 벽걸이 설치, 일반인이 알아야 할 주의사항",
        ],
        "intro_variants": [
            f"타공 TV 벽걸이 설치는 콘크리트 벽에 드릴로 구멍을 내고 앵커볼트로 브라켓을 고정하는 방식입니다. 가장 강한 하중 지지력을 제공합니다.",
            f"콘크리트 벽에 직접 앵커를 박아 TV를 고정하는 타공 방식은 설치 강도가 가장 뛰어납니다. 대형 TV나 진동이 있는 환경에 특히 적합합니다.",
            f"타공 설치는 벽에 구멍을 내는 방식으로, 한번 시공하면 장기적으로 가장 안정적인 고정력을 유지합니다. {BRAND}는 타공과 무타공 모두 전문 시공합니다.",
            f"50인치부터 100인치까지 모든 크기의 TV를 타공 방식으로 안전하게 벽에 설치합니다. 전용 앵커볼트와 고강도 브라켓으로 흔들림 없이 고정됩니다.",
        ],
        "cta_variants": [
            f"타공 TV 벽걸이 설치, {BRAND}에 무료 견적을 문의하세요.",
            f"타공 시공 가능 여부, 전화 한 통으로 바로 확인해 드립니다.",
            f"내 집 벽에 맞는 설치 방법, 지금 바로 확인해 보세요.",
            f"타공 전문 {BRAND}, 무료 견적 30초 만에 받아보세요.",
        ],
        "sections": [
            ("타공 설치 원리", [
                "콘크리트 벽에 드릴로 앵커 홀 가공",
                "전용 콘크리트 앵커볼트 삽입 후 고정",
                "앵커에 TV 브라켓 장착 → TV 거치",
                "수평 레벨 확인 후 최종 조임 마무리",
            ]),
            ("타공 설치가 적합한 상황", [
                "자가 소유 아파트·주택 — 원상 복구 부담 없음",
                "85인치 이상 초대형 TV — 최고 하중 지지력 필요 시",
                "진동·충격이 자주 발생하는 환경 (운동기구 주변 등)",
                "무타공 설치가 어려운 단자함 미설치 구조 벽면",
            ]),
            ("타공 설치 과정 4단계", [
                "1단계: 벽면 콘크리트 여부 및 구조물 위치 확인",
                "2단계: 브라켓 위치 먹선 작업 + 수평 측정",
                "3단계: 드릴 타공 → 앵커볼트 삽입 고정",
                "4단계: 브라켓 장착 → TV 거치 → 선 정리",
            ]),
        ],
        "table": [
            ("TV 크기", "설치 방식", "지원 여부"),
            ("50~65인치", "타공 기본형", "가능"),
            ("70~80인치", "타공 표준형", "가능"),
            ("85~100인치", "타공 대형 전용", "가능"),
            ("가벽 환경", "타공 불가 (무타공 권장)", "상담 후 결정"),
        ],
        "faq": [
            ("타공 설치 후 벽에 구멍이 남나요?",
             "네, 앵커볼트 홀이 남습니다. 이사 시 실리콘·퍼티로 메워 원상 복구 가능합니다. 임대 아파트의 경우 타공 전에 임대인과 협의하시기 바랍니다."),
            ("타공과 무타공 중 어떤 방식이 더 좋은가요?",
             "타공은 고정력이 더 강하고, 무타공은 벽 구멍이 없어 이사 후 재사용이 편리합니다. TV 크기·소유 형태·벽 구조에 따라 전문가 상담 후 결정하시면 됩니다."),
            ("타공 설치 후 TV 위치를 바꾸려면 어떻게 하나요?",
             "위치 변경 시 기존 앵커 홀을 메우고 새 위치에 재시공합니다. 위치를 자주 바꿀 가능성이 있다면 무타공 방식을 권장드립니다."),
        ],
        "cta": f"타공 설치 가능 여부와 견적, 지금 바로 {BRAND}에 문의하세요.",
    },
    "가벽 TV 설치": {
        "url_kw": "가벽-TV-벽걸이-설치",
        "title_variants": [
            "아파트 가벽에 TV 벽걸이 설치 — 보강 없이는 위험한 이유",
            "석고보드 가벽 TV 설치 방법 — 보강플레이트 필수 안내",
            "가벽에 TV 거는 법, 무조건 보강이 필요한 이유",
            "가벽 TV 벽걸이 설치 — 100인치까지 가능한 보강 방법",
        ],
        "intro_variants": [
            "석고보드 가벽은 콘크리트 벽과 달리 단독으로 TV 하중을 지탱하기 어렵습니다. 전용 보강플레이트를 적용해야 안전한 시공이 가능합니다.",
            "아파트 내벽 대부분은 얇은 석고보드 가벽입니다. 보강 없이 TV를 걸면 시간이 지날수록 브라켓이 기울거나 빠질 위험이 있습니다.",
            "가벽이라는 이유로 시공을 포기할 필요 없습니다. 전용 가벽 키트와 보강플레이트로 최대 100인치 TV까지 안전하게 설치합니다.",
            "많은 분들이 가벽에 TV를 걸지 못한다고 알고 있습니다. 하지만 올바른 보강 처리를 하면 콘크리트 벽과 동등한 안전도를 확보할 수 있습니다.",
        ],
        "cta_variants": [
            f"가벽에도 100인치 TV까지 설치 가능합니다. {BRAND}에 문의하세요.",
            "가벽 시공 가능 여부, 벽면 사진 한 장으로 확인해 드립니다.",
            f"가벽 TV 설치 전문 {BRAND}, 무료 견적 받아보세요.",
            "가벽이라도 포기하지 마세요. 지금 바로 상담하세요.",
        ],
        "sections": [
            ("가벽의 특성과 주의점", [
                "석고보드 1~2장으로 이루어진 내벽 — 하중 지지력이 낮음",
                "일반 나사나 앵커 방식으로는 TV 하중을 장기 지탱하기 어려움",
                "시간이 지나면 브라켓이 기울거나 석고보드가 찢겨 떨어질 위험",
                "전용 보강재 없이 가벽에 TV를 거는 것은 위험함",
            ]),
            ("가벽 보강 시공 방법", [
                "단자함 뒤 공간에 철판(보강플레이트) 삽입 → 면적 분산",
                "보강플레이트 위에 전용 가벽 함체 고정",
                "함체 → 프레임 → TV 브라켓 순서로 조립",
                "50~100인치 TV 하중 지탱 가능한 구조로 완성",
            ]),
            ("콘크리트 벽 vs 가벽 시공 비교", [
                "콘크리트 벽: 표준 함체만으로 시공, 추가 자재 불필요",
                "석고보드 가벽: 보강플레이트 필수, 작업 시간 추가",
                "아트월: 단자함 일체형 특수 시공 필요",
                "가벽 보강 완료 후 하중 지지력은 콘크리트 벽과 동일 수준",
            ]),
        ],
        "table": [
            ("벽 종류", "보강 필요 여부", "최대 지원 크기"),
            ("콘크리트 벽", "불필요", "100인치"),
            ("석고보드 가벽", "보강플레이트 필수", "100인치"),
            ("아트월", "특수 시공 필요", "85인치 이상 상담"),
            ("경량철골 가벽", "구조 확인 필요", "상담 후 결정"),
        ],
        "faq": [
            ("가벽이라고 했더니 다른 업체가 시공 불가라고 했어요.",
             "보강플레이트 없이 일반 방식으로 시공하면 불가한 경우가 있습니다. 전용 가벽 보강 키트를 사용하면 대부분 가능합니다. 벽면 사진을 보내주시면 확인해 드립니다."),
            ("가벽 보강 시공 시 추가 비용이 있나요?",
             "보강플레이트 자재비가 추가됩니다. 정확한 견적은 TV 크기와 가벽 두께를 확인 후 안내드립니다."),
            ("보강 처리 후 나중에 이사할 때 자국이 남나요?",
             "단자함 안에 시공하는 방식이라 벽면에 별도 구멍이 생기지 않습니다. 이사 후 철거 시 원상 복구가 가능합니다."),
        ],
        "cta": f"가벽 TV 설치 전문 {BRAND}에 무료 견적을 문의하세요.",
    },
    "대형 TV 설치 (85인치)": {
        "url_kw": "대형TV-벽걸이-설치-85인치",
        "title_variants": [
            "85인치 대형 TV 벽걸이 설치 — 하중 지지 구조와 안전 기준",
            "85인치 TV 설치 — 일반 브라켓으로 거는 건 위험합니다",
            "85인치 대형 TV 벽걸이 전문 설치 완벽 가이드",
            "85인치 TV 벽에 거는 방법 — 전문 업체가 필요한 이유",
        ],
        "intro_variants": [
            "85인치 TV는 무게가 약 40~55kg에 달합니다. 일반 브라켓으로는 장기 안전을 보장하기 어려우며, 전용 고하중 브라켓과 전문 시공이 필요합니다.",
            "85인치 TV 벽걸이는 무게와 크기 때문에 일반 가정에서 직접 설치하기 어렵습니다. 전문 기사 2인 1조 방문으로 안전하게 시공합니다.",
            f"대형 TV일수록 하중 지지 구조가 더 중요합니다. {BRAND}는 85인치 이상 대형 TV 시공 실적을 보유한 전문 업체입니다.",
            "85인치 TV는 시공 전 벽면 구조 진단이 필수입니다. 사전 확인 없이 설치하면 브라켓이 기울거나 TV가 낙하할 수 있습니다.",
        ],
        "cta_variants": [
            f"85인치 대형 TV 설치는 전문 업체가 필요합니다. {BRAND}에 무료 견적 받아보세요.",
            "85인치 시공 실적 보유. 대형 TV 설치 전 반드시 전문가와 상담하세요.",
            "85인치도 안전하게 시공합니다. 지금 바로 문의하세요.",
            f"85인치 TV 하중 계산과 적합 브라켓 선정, {BRAND}가 현장에서 확인합니다.",
        ],
        "sections": [
            ("85인치 TV 시공 전 확인 사항", [
                "TV 모델별 무게 확인 (85인치 약 40~55kg)",
                "벽면 구조 확인 — 콘크리트 vs 가벽 vs 아트월",
                "설치 높이와 시청 거리 계산 (85인치 기준 최소 2.5m 이상 권장)",
                "배선 경로와 주변 콘센트 위치 확인",
            ]),
            ("85인치 TV 전용 시공 방법", [
                "85인치 전용 고하중 브라켓 사용 (일반 브라켓 사용 불가)",
                "무타공 함체 + 보강 프레임으로 하중 분산 구조 구성",
                "가벽 환경 시 보강플레이트 필수 적용",
                "2인 전문 기사 방문으로 안전 시공",
            ]),
            ("85인치 TV 설치 비용 기준", [
                "85인치 기본 시공비 (벽 구조에 따라 변동)",
                "가벽 환경: 보강 자재 추가",
                "무타공·타공 방식 선택에 따라 자재비 차이",
                "선 매립·기기 추가(셋톱·공유기) 포함 여부에 따라 변동",
            ]),
        ],
        "table": [
            ("TV 크기", "예상 무게", "필요 자재"),
            ("75인치대", "약 30~40kg", "표준 대형 브라켓"),
            ("85인치대", "약 40~55kg", "고하중 브라켓"),
            ("85인치 가벽", "약 40~55kg", "보강플레이트 필수"),
            ("85인치 아트월", "약 40~55kg", "특수 시공 필요"),
        ],
        "faq": [
            ("85인치 TV도 무타공으로 설치 가능한가요?",
             "네, 가능합니다. 전용 고하중 브라켓과 보강 구조를 사용하면 85인치도 무타공 시공이 됩니다. 다만 벽면 상태 사전 확인이 필수입니다."),
            ("85인치 TV 설치 시 보조 인력이 필요한가요?",
             "대형 TV 시공은 2인 1조로 진행합니다. 운반과 거치 모두 2인 이상이 안전하며 TV마스터365는 이를 기본으로 운영합니다."),
            ("85인치 TV 설치 후 수평 조절이 가능한가요?",
             "설치 후 수평 레벨 확인은 기본 포함입니다. 틸트형 브라켓 선택 시 상하 각도 조절도 가능합니다."),
        ],
        "cta": f"85인치 대형 TV 전문 시공. {BRAND}에 견적 문의하세요.",
    },
    "이사 후 TV 재설치": {
        "url_kw": "이사-TV-재설치-벽걸이",
        "title_variants": [
            "이사 후 TV 벽걸이 재설치 — 기존 자재 재사용이 가능한 경우",
            "이사할 때 TV 벽걸이 어떻게 처리하나요? 철거·재설치 안내",
            "이사 TV 재설치 비용과 과정 — 무타공 브라켓 재활용 가이드",
            "새 집 이사 후 TV 벽걸이 설치 — 기존 브라켓 쓸 수 있는지 확인법",
        ],
        "intro_variants": [
            "이사할 때 TV 벽걸이는 철거 후 새 집에 재설치하는 경우가 많습니다. 무타공 브라켓은 재사용이 가능해 이사 후 설치비를 줄일 수 있습니다.",
            f"이사할 때 기존 TV 벽걸이를 그냥 두고 가면 추후 분쟁이 생길 수 있습니다. {BRAND}는 이사 철거부터 새 집 재설치까지 한 번에 서비스합니다.",
            "무타공 브라켓은 분리·조립이 가능한 2단계 구조라 이사 후 재사용이 쉽습니다. 새 집 벽 구조가 동일하다면 함체를 재활용할 수 있습니다.",
            f"이사 후 TV 설치를 새로 맡기려면 시간이 걸립니다. {BRAND}의 이사 재설치 서비스는 기존 시공 기록을 확인해 빠르게 진행합니다.",
        ],
        "cta_variants": [
            f"이사 TV 재설치, {BRAND}가 기존 기록 확인 후 빠르게 진행합니다.",
            "이사 전 철거 + 새 집 설치, 하나로 묶어서 문의하세요.",
            "기존 브라켓 재사용 여부 확인, 지금 바로 문의하세요.",
            f"이사 후 TV 재설치 전문 {BRAND}, 무료 견적 받아보세요.",
        ],
        "sections": [
            ("이사 TV 벽걸이 처리 순서", [
                "1단계: 이사 전 철거 — 브라켓·함체 분리 후 포장",
                "2단계: 이사 완료 후 새 집 벽면 구조 확인",
                "3단계: 재사용 가능 자재 확인 후 설치",
                "4단계: 새 환경에 맞는 추가 자재 선택 (가벽 등)",
            ]),
            ("재사용 가능한 경우와 불가한 경우", [
                "재사용 가능: 콘크리트 벽 → 콘크리트 벽 이사",
                "부분 재사용: 가벽 환경 변경 시 보강플레이트 추가 필요",
                "재사용 불가: TV 크기·모델 변경 시 브라켓 교체 필요",
                "재사용 불가: 손상·변형된 자재는 안전을 위해 교체 권장",
            ]),
            ("이사 재설치 비용 절감 팁", [
                "기존 업체에 이사 재설치 요청 시 기록 활용으로 빠른 진행",
                "새 집 사전 방문 없이 벽면 사진 공유로 견적 가능",
                "철거·재설치 동시 예약 시 효율적",
                "이전 시공 기록 보관 업체 이용 시 사후 A/S도 유리",
            ]),
        ],
        "table": [
            ("상황", "재사용 여부", "비고"),
            ("동일 벽 구조 이사", "대부분 가능", "함체 재활용"),
            ("콘크리트 → 가벽 이사", "부분 가능", "보강플레이트 추가"),
            ("TV 크기 변경", "브라켓만 교체", "함체 재사용 가능"),
            ("자재 손상", "불가", "안전을 위해 교체"),
        ],
        "faq": [
            ("이사 전에 TV 벽걸이를 직접 뜯어도 되나요?",
             "일반적인 벽걸이는 직접 뜯기 어렵지 않지만, 무타공 함체는 단자함과 결합된 구조라 잘못 철거하면 함체가 손상될 수 있습니다. 전문 기사에게 맡기는 것을 권장합니다."),
            ("이전에 설치한 업체가 아닌 다른 업체에 재설치를 맡겨도 되나요?",
             "물론 가능합니다. 다만 기존 자재 재사용 여부는 현장 확인 후 판단합니다. 기존 시공 사진이나 브라켓 모델 정보가 있으면 더 정확히 안내드릴 수 있습니다."),
            ("새 집 단자함 위치가 원하는 TV 위치와 다르면 어떻게 하나요?",
             "단자함 위치와 TV 설치 위치가 다를 경우 대안 방법을 현장에서 확인합니다. 일부 경우 배선 연장이나 다른 고정 방식이 필요할 수 있습니다."),
        ],
        "cta": f"이사 TV 재설치 전문 {BRAND}, 기존 기록 확인 후 빠르게 진행합니다.",
    },
    "선 정리·매립 시공": {
        "url_kw": "TV-선정리-케이블-매립",
        "title_variants": [
            "TV 벽걸이 설치 후 선 정리 방법 — 케이블 매립까지 한 번에",
            "TV 케이블 선 정리, 이렇게 하면 깔끔합니다",
            "TV 설치 후 HDMI·전원선 정리 완전 가이드",
            "벽걸이 TV 선 노출 없이 깔끔하게 정리하는 방법",
        ],
        "intro_variants": [
            "TV를 벽에 걸어도 전원선·HDMI·셋톱박스 선이 늘어지면 인테리어가 망가집니다. 케이블 매립 또는 정리 시공으로 깔끔한 완성도를 높일 수 있습니다.",
            "TV 벽걸이 설치에서 가장 많이 요청되는 추가 서비스가 선 정리입니다. 선이 노출되면 인테리어 효과가 반감됩니다.",
            "벽걸이 설치 후 선 정리를 함께 진행하면 추가 방문 없이 한 번에 깔끔하게 마무리됩니다.",
            "TV 설치와 선 정리를 동시에 진행하면 벽지 손상도 최소화되고 작업 시간도 단축됩니다.",
        ],
        "cta_variants": [
            f"TV 설치 + 선 정리 한 번에. {BRAND}에 문의하세요.",
            "깔끔한 TV 벽걸이 완성을 원한다면 선 정리까지 함께 맡기세요.",
            "선 노출 없는 TV 설치, 지금 바로 견적 받아보세요.",
            f"{BRAND}는 선 정리까지 기본 포함입니다. 추가 비용 없이 깔끔하게.",
        ],
        "sections": [
            ("선 정리 방법 3가지", [
                "몰딩 방식: 케이블 덕트(몰딩)로 선을 감싸 정리 — 간편하고 저렴",
                "벽 매립 방식: 벽 속에 선을 숨기는 방식 — 완전히 보이지 않음",
                "가구 뒤 배선: 선을 가구나 벽면 뒤로 숨기는 방식 — 추가 공사 없음",
            ]),
            ("TV마스터365 기본 포함 항목", [
                "셋톱박스·공유기 선 정리 기본 포함",
                "HDMI·광케이블 연결 및 정리 포함",
                "전원선 처리(콘센트 거리에 따라 방법 상이)",
                "기기 거치대(사운드바·셋톱박스 브라켓) 추가 설치 가능",
            ]),
            ("선 매립 추가 시공 안내", [
                "벽 내부 배관이 있는 경우 — 배관 활용 선 매립 가능",
                "배관 없는 경우 — 몰딩 정리 또는 부분 매립 공사",
                "사전 견적 확인 후 방법 결정 권장",
                "완성 후 콘센트 추가·이동이 필요한 경우 별도 전기 공사 필요",
            ]),
        ],
        "table": [
            ("선 종류", "정리 방법", "기본 포함"),
            ("셋톱박스 선", "몰딩 또는 정리", "포함"),
            ("공유기 LAN 선", "정리·정돈", "포함"),
            ("HDMI 케이블", "연결·정리", "포함"),
            ("전원선 매립", "벽 공사 필요", "별도 견적"),
        ],
        "faq": [
            ("선 정리 비용이 따로 드나요?",
             f"셋톱박스·공유기·HDMI 선 정리는 기본 시공에 포함됩니다. 전원선 벽 매립은 추가 공사가 필요하며 별도 견적을 안내드립니다."),
            ("사운드바도 함께 설치할 수 있나요?",
             "사운드바 브라켓 거치는 추가 서비스로 진행 가능합니다. TV 설치와 동시에 요청하면 효율적으로 진행됩니다."),
            ("선 매립 후 나중에 TV를 바꾸면 선도 다시 해야 하나요?",
             "HDMI 등 기본 배선은 대부분 재사용 가능합니다. TV 교체 시 브라켓과 연결 방식 변경이 필요할 수 있으나 선 매립은 유지됩니다."),
        ],
        "cta": f"TV 설치 + 선 정리 한 번에. {BRAND}에 무료 견적 문의하세요.",
    },
    "아파트 TV 벽걸이 설치": {
        "url_kw": "아파트-TV-벽걸이-설치",
        "title_variants": [
            "아파트 TV 벽걸이 설치 — 임대·자가 모두 가능한 무타공 방법",
            "아파트 TV 거치 완벽 가이드 — 구멍 없이 안전하게 설치하기",
            "신축 아파트 TV 벽걸이 설치 체크리스트",
            "아파트 TV 설치 전 알아야 할 5가지 — 벽 구조별 시공 방법",
        ],
        "intro_variants": [
            "아파트에서 TV 벽걸이 설치 시 가장 중요한 건 벽 구조 파악입니다. 콘크리트 벽과 가벽은 시공 방식이 다르며, 무타공 방식은 두 환경 모두 적용 가능합니다.",
            "아파트마다 단자함 위치와 벽 구조가 다릅니다. 전문 기사가 방문 전에 벽면 사진을 확인하면 더 정확한 시공 계획을 세울 수 있습니다.",
            f"임대 아파트라면 벽에 구멍을 내면 원상 복구 의무가 생깁니다. 무타공 시공은 이런 걱정 없이 TV를 벽에 걸 수 있는 최선의 방법입니다.",
            "신축 아파트는 단자함이 표준화되어 있어 무타공 시공에 유리합니다. 기존 아파트도 단자함 위치만 확인하면 대부분 가능합니다.",
        ],
        "cta_variants": [
            f"아파트 TV 벽걸이 설치 전 {BRAND}에 무료 견적 먼저 받아보세요.",
            "임대·자가 상관없이 무타공으로 안전하게 설치합니다.",
            "아파트 벽면 사진 한 장으로 견적 받아보세요.",
            f"신축·구축 아파트 모두 가능. {BRAND}에 문의하세요.",
        ],
        "sections": [
            ("아파트 벽 구조별 시공 방법", [
                "콘크리트 벽: 표준 무타공 시공 — 가장 일반적",
                "석고보드 가벽: 보강플레이트 추가 후 시공",
                "아트월: 단자함 일체형 특수 시공 가능",
                "타일 마감 벽: 단자함 위치 확인 후 방법 결정",
            ]),
            ("아파트 시공 전 준비 사항", [
                "TV가 설치될 벽의 단자함 위치 확인",
                "TV 크기와 모델 파악 (인치, 무게)",
                "설치 높이와 시청 거리 사전 결정",
                "셋톱박스·공유기 위치와 배선 경로 확인",
            ]),
            ("임대 아파트 주의사항", [
                "무타공 시공은 원상 복구 없이 가능 — 퇴실 시 함체만 제거",
                "콘크리트에 드릴 타공하는 일반 시공은 추후 원상 복구 필요",
                "임대 계약 조건 확인 후 무타공 여부 결정 권장",
                "이사 시 함체 분리 → 새 집 재설치 가능",
            ]),
        ],
        "table": [
            ("아파트 유형", "권장 시공 방식", "특이사항"),
            ("신축 아파트", "무타공 표준형", "단자함 표준화"),
            ("구축 아파트", "현장 확인 필요", "단자함 위치 상이"),
            ("임대 아파트", "무타공 필수", "원상복구 불필요"),
            ("아트월 인테리어", "특수 시공", "사전 확인 필수"),
        ],
        "faq": [
            ("아파트 관리사무소 허가가 필요한가요?",
             "무타공 시공은 벽에 구멍을 내지 않아 별도 허가가 필요없는 경우가 대부분입니다. 다만 공동주택 관리 규정에 따라 확인이 필요할 수 있으니 먼저 확인하시기 바랍니다."),
            ("이사 전 집에 이미 벽걸이 자국이 있는데 어떻게 하나요?",
             "기존 타공 자국은 실리콘이나 퍼티로 메울 수 있습니다. 무타공 시공으로 전환하면 이후 이사 시 추가 자국이 생기지 않습니다."),
            ("아파트 단지에 따라 시공이 불가한 경우도 있나요?",
             "단자함 구조가 특이하거나 접근이 어려운 경우 현장 확인이 필요합니다. 사전에 벽면과 단자함 사진을 보내주시면 가능 여부를 미리 확인해 드립니다."),
        ],
        "cta": f"아파트 TV 벽걸이 무타공 설치 전문 {BRAND}. 무료 견적 문의하세요.",
    },
    "TV 벽걸이 설치 비용": {
        "url_kw": "TV-벽걸이-설치-비용-견적",
        "title_variants": [
            "TV 벽걸이 설치 비용 — 인치별·벽 종류별 견적 안내",
            "TV 설치 가격 비교 — 업체별 차이와 추가 비용 주의사항",
            "벽걸이 TV 설치 비용이 천차만별인 이유",
            "TV 벽걸이 설치 견적 전에 꼭 확인해야 할 5가지",
        ],
        "intro_variants": [
            "TV 벽걸이 설치 비용은 TV 크기, 벽 종류, 추가 서비스(선 정리·기기 거치)에 따라 달라집니다. 가격만 보고 결정하면 추가 비용이 발생할 수 있습니다.",
            "온라인에 올라온 저렴한 TV 설치 가격에는 자재비·출장비가 빠진 경우가 많습니다. 최종 견적은 반드시 사전에 확인하세요.",
            f"TV 설치 가격은 업체마다 다릅니다. {BRAND}는 견적 후 작업하며 현장 추가 비용이 없습니다.",
            "TV 크기와 벽 구조가 결정되면 정확한 설치 비용을 미리 알 수 있습니다. 사전 견적을 받은 후 결정하는 것이 현명합니다.",
        ],
        "cta_variants": [
            f"사전 견적 후 작업, 현장 추가 비용 없는 {BRAND}에 문의하세요.",
            "TV 크기와 벽 구조 알려주시면 바로 견적 드립니다.",
            f"가격 먼저 확인하고 결정하세요. {BRAND} 무료 견적.",
            "영업 전화 없이 정확한 견적만 드립니다. 지금 문의하세요.",
        ],
        "sections": [
            ("TV 설치 비용 결정 요인", [
                "TV 크기: 65인치 이하 / 70~80인치 / 90인치 이상으로 구분",
                "벽 종류: 콘크리트(표준) vs 가벽(보강 추가) vs 아트월",
                "추가 서비스: 선 정리, 기기 거치, 사운드바 설치",
                "출장 지역: 서울·경기·인천 전 지역 동일 가격 기준",
            ]),
            ("포함·불포함 확인 항목", [
                "포함: 전용 자재, 방문 시공, 셋톱·공유기 선 정리, 배상책임보험",
                "포함: A/S 보증, 전문 설치기사 파견",
                "불포함: 가벽 보강플레이트 자재 추가 시 별도",
                "불포함: 전원선 벽 매립 공사(별도 전기 공사 필요)",
            ]),
            ("저렴한 업체 주의사항", [
                "자재비 별도, 출장비 별도인 경우 최종 가격 급상승",
                "보험 미가입 업체는 사고 시 보상 불가",
                "A/S 연락처 없는 경우 사후 관리 불가",
                "완성 사진만 보고 선택 시 실제 시공 품질 확인 불가",
            ]),
        ],
        "table": [
            ("TV 크기", "기준 가격", "비고"),
            ("65인치 이하", "문의", "벽 구조 확인 후"),
            ("70인치대", "문의", "브라켓 종류에 따라"),
            ("80인치대", "문의", "TV 무게 확인 필요"),
            ("90인치 이상", "문의", "대형 전용 자재 포함"),
        ],
        "faq": [
            ("TV 설치 비용을 미리 알 수 있나요?",
             f"TV 크기와 벽 구조 정보를 알려주시면 전화 상담으로 예상 견적을 바로 안내드립니다. {BRAND}는 현장 추가 비용 없이 사전 견적대로 진행합니다."),
            ("온라인에서 본 저렴한 가격이랑 왜 다른가요?",
             "일부 업체는 자재비·출장비를 별도로 청구합니다. 최종 가격은 이를 포함한 전체 견적으로 비교해야 합니다."),
            ("배상책임보험은 왜 중요한가요?",
             "설치 중 TV가 손상되거나 벽이 파손될 경우 보험으로 보상받을 수 있습니다. 미가입 업체 이용 시 사고 보상이 어렵습니다."),
        ],
        "cta": f"가격 먼저 확인하고 결정하세요. {BRAND} 무료 견적 문의.",
    },
}


def _region_color(region):
    COLORS = [(80,180,255),(255,160,60),(100,220,140),(220,100,200),
              (255,100,100),(60,200,220),(180,140,255),(255,200,60)]
    return COLORS[sum(ord(c) for c in region) % len(COLORS)]


def make_thumbnail(region, bg_image_path=None):
    """지역·주제 SVG 썸네일을 JPEG 바이트로 반환"""
    from PIL import Image, ImageDraw, ImageFont
    import textwrap
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), (17, 18, 20))
    draw = ImageDraw.Draw(img)
    r, g, b = _region_color(region)
    draw.rectangle([(0, 0), (W, H//3)], fill=(r//4, g//4, b//4))
    draw.rectangle([(0, 0), (8, H)], fill=(r, g, b))
    if bg_image_path and os.path.exists(bg_image_path):
        try:
            bg = Image.open(bg_image_path).convert("RGB")
            bg = bg.resize((W, H), Image.LANCZOS)
            bg_dark = Image.new("RGB", (W, H), (0, 0, 0))
            blended = Image.blend(bg, bg_dark, 0.45)
            img.paste(blended, (0, 0))
            draw = ImageDraw.Draw(img)
        except Exception:
            pass
    try:
        font_lg = ImageFont.truetype("C:/Windows/Fonts/malgunbd.ttf", 56)
        font_md = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 32)
        font_sm = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 26)
    except Exception:
        font_lg = ImageFont.load_default()
        font_md = font_sm = font_lg
    draw.text((52, 60), BRAND, font=font_md, fill=(r, g, b))
    lines = textwrap.wrap(region, width=18)
    y = 140
    for line in lines[:2]:
        draw.text((52, y), line, font=font_lg, fill=(255, 255, 255))
        y += 70
    draw.text((52, H - 80), f"TV 벽걸이 설치 전문 · {PHONE}", font=font_sm, fill=(180, 180, 180))
    draw.text((52, H - 44), f"서울·경기·인천 전 지역 출장 시공", font=font_sm, fill=(130, 130, 130))
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=85)
    buf.seek(0)
    return buf.read()


def generate_html(region: str, topic_key: str, extra_note: str = "") -> tuple:
    """(title, html_body, meta_description, url_kw) 반환"""
    import json as _json
    from urllib.parse import quote as _uq
    tpl = TOPIC_TEMPLATES.get(topic_key, list(TOPIC_TEMPLATES.values())[0])
    vi = random.randrange(len(tpl["title_variants"]))
    title = f"{region} {tpl['title_variants'][vi]}"
    url_kw = tpl.get("url_kw", "TV-벽걸이-설치")
    today_str = date.today().strftime("%Y년 %m월 %d일")

    intro_list = tpl.get("intro_variants", [tpl.get("intro", "")])
    intro_text = intro_list[vi % len(intro_list)]
    if extra_note:
        intro_text += f" {extra_note}"

    cta_list = tpl.get("cta_variants", [tpl.get("cta", "")])
    cta_text = cta_list[vi % len(cta_list)]

    meta_raw = f"{region} TV 벽걸이 설치 전문 {BRAND}. {intro_text[:80]}"
    meta_description = meta_raw[:155]

    # JSON-LD
    all_faq = list(tpl.get("faq", []))
    generic_faq = [
        (f"{region} TV 벽걸이 설치 비용은 얼마인가요?",
         f"TV 크기와 벽 구조에 따라 다릅니다. 전화 상담으로 정확한 견적을 먼저 안내드립니다."),
        (f"{region}에서 당일 시공이 가능한가요?",
         "예약 일정에 따라 당일~2일 내 시공이 가능합니다. 연락 시 일정 확인해 드립니다."),
        ("무타공 설치 후 A/S는 어떻게 되나요?",
         f"시공 완료 후 {BRAND}에서 A/S를 책임집니다. 시공 기록을 보관하여 사후 관리가 가능합니다."),
    ]
    while len(all_faq) < 5:
        if generic_faq:
            all_faq.append(generic_faq.pop(0))
        else:
            break

    faq_entities = [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}}
                    for q, a in all_faq]
    ld_article = {
        "@context": "https://schema.org", "@type": "Article",
        "headline": title, "description": meta_description,
        "datePublished": date.today().strftime("%Y-%m-%d"),
        "publisher": {"@type": "LocalBusiness", "name": BRAND, "telephone": PHONE, "areaServed": region}
    }
    ld_faq = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faq_entities}

    parts = []
    parts.append(f'<script type="application/ld+json">{_json.dumps(ld_article, ensure_ascii=False)}</script>')
    parts.append(f'<script type="application/ld+json">{_json.dumps(ld_faq, ensure_ascii=False)}</script>')

    # H1
    parts.append(f'<h1>{title}</h1>')
    parts.append(f'<p class="post-date">작성일: {today_str} | 출처: {BRAND} 시공 데이터</p>')

    # TOC
    sections = tpl.get("sections", [])
    parts.append('<div class="post-toc"><strong>목차</strong><ol class="toc-list">')
    parts.append(f'<li><a href="#sec1">1. {region} TV 벽걸이 설치 개요</a></li>')
    for i, (sec_title, _) in enumerate(sections, 2):
        parts.append(f'<li><a href="#sec{i}">{i}. {sec_title}</a></li>')
    parts.append(f'<li><a href="#sec-table">{len(sections)+2}. 비교 정보</a></li>')
    parts.append(f'<li><a href="#sec-faq">{len(sections)+3}. 자주 묻는 질문</a></li>')
    parts.append('</ol></div>')

    # 섹션 1: 개요
    parts.append(f'<h2 id="sec1">1. {region} TV 벽걸이 설치 개요</h2>')
    parts.append(f'<p>{intro_text}</p>')
    parts.append(f'<p><strong>{region} TV 벽걸이 설치</strong>는 벽 구조 확인부터 시작합니다. 콘크리트 벽과 석고보드 가벽에 따라 시공 방법이 달라지며, 어떤 환경에서도 무타공 시공이 가능합니다.</p>')
    parts.append(f'<p>{BRAND}는 {AREA_SERVICE}에서 출장 시공을 진행합니다. 50~100인치 TV 설치 경력 8년 이상, 누적 시공 1만 건 이상의 전문 업체입니다.</p>')
    parts.append(f'<p>아래 글은 <strong>{region} TV 벽걸이 설치</strong>에 필요한 과정과 주의사항을 안내합니다.</p>')

    # 내용 섹션
    for i, (sec_title, items) in enumerate(sections, 2):
        parts.append(f'<h2 id="sec{i}">{i}. {sec_title}</h2>')
        parts.append('<ul>')
        for item in items:
            parts.append(f'<li>{item}</li>')
        parts.append('</ul>')
        if i == 2:
            parts.append(f'<p>{region} 지역의 아파트·오피스텔은 대부분 무타공 시공이 가능합니다. 단자함 위치와 벽 구조를 사전에 확인하면 더 빠른 시공이 가능합니다.</p>')

    # 비교 표
    table = tpl.get("table", [])
    if table:
        parts.append(f'<h2 id="sec-table">{len(sections)+2}. 비교 정보</h2>')
        parts.append('<table><thead><tr>')
        for h in table[0]:
            parts.append(f'<th>{h}</th>')
        parts.append('</tr></thead><tbody>')
        for row in table[1:]:
            parts.append('<tr>')
            for cell in row:
                parts.append(f'<td>{cell}</td>')
            parts.append('</tr>')
        parts.append('</tbody></table>')

    # FAQ
    parts.append(f'<h2 id="sec-faq">{len(sections)+3}. 자주 묻는 질문</h2>')
    for q, a in all_faq:
        parts.append(f'<h3>{q}</h3><p>{a}</p>')

    # CTA 박스
    parts.append(f'''<div class="cta-box">
<h3>무료 견적 받기</h3>
<p>{cta_text}</p>
<a href="tel:{PHONE_DIGITS}">{PHONE} 전화 문의</a>
</div>''')

    body = '\n'.join(parts)
    return title, body, meta_description, url_kw


def upload_post(url_base, region, title, body, slug, meta_description="", bg_path=None):
    import requests
    try:
        thumb = make_thumbnail(region, bg_path)
        has_pil = True
    except Exception:
        thumb = None
        has_pil = False
    region_slug = region.replace(" ", "-")
    slug_safe = slug.strip() if slug.strip() else f"{region_slug}-{title[:30].replace(' ', '-')}"
    data = {"region": region, "title": title, "body": body,
            "slug": slug_safe, "meta_description": meta_description}
    files = {"thumbnail": ("thumb.jpg", thumb, "image/jpeg")} if (thumb and has_pil) else None
    resp = requests.post(url_base.rstrip("/") + "/api/posts",
                         data=data, files=files, timeout=30)
    resp.raise_for_status()
    return resp.json()


# ── GUI ──────────────────────────────────────────────────────────────────────

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title(f"{BRAND} 블로그 포스트 등록")
        self.geometry("920x720")
        self.configure(bg="#F5F5F5")
        self._build_ui()

    def _build_ui(self):
        style = ttk.Style(self)
        style.theme_use("clam")
        style.configure("Accent.TButton", background="#D42B2B", foreground="white",
                         font=("맑은 고딕", 11, "bold"), padding=8)
        style.map("Accent.TButton", background=[("active", "#B01E1E")])

        nb = ttk.Notebook(self)
        nb.pack(fill="both", expand=True, padx=10, pady=10)

        tab1 = ttk.Frame(nb)
        tab2 = ttk.Frame(nb)
        nb.add(tab1, text=" 📝 개별 등록 ")
        nb.add(tab2, text=" 📋 발행 목록 ")

        self._build_tab1(tab1)
        self._build_tab2(tab2)

    def _build_tab1(self, parent):
        lf = ttk.LabelFrame(parent, text=" 설정 ", padding=12)
        lf.pack(fill="x", padx=12, pady=(12, 6))

        # 서버 URL
        r = 0
        ttk.Label(lf, text="서버 URL:").grid(row=r, column=0, sticky="w", padx=4, pady=4)
        self.url_var = tk.StringVar(value=RAILWAY_URL_DEFAULT)
        ttk.Entry(lf, textvariable=self.url_var, width=55).grid(row=r, column=1, columnspan=3, sticky="ew", padx=4, pady=4)

        # 지역
        r += 1
        ttk.Label(lf, text="지역:").grid(row=r, column=0, sticky="w", padx=4, pady=4)
        self.region_var = tk.StringVar(value="서울 강남구 역삼동")
        region_entry = ttk.Entry(lf, textvariable=self.region_var, width=30)
        region_entry.grid(row=r, column=1, sticky="ew", padx=4, pady=4)
        ttk.Label(lf, text="예: 서울 강남구 역삼동", foreground="#888").grid(row=r, column=2, sticky="w")

        # 주제
        r += 1
        ttk.Label(lf, text="주제:").grid(row=r, column=0, sticky="w", padx=4, pady=4)
        self.topic_var = tk.StringVar(value=list(TOPIC_TEMPLATES.keys())[0])
        cb = ttk.Combobox(lf, textvariable=self.topic_var, values=list(TOPIC_TEMPLATES.keys()),
                           state="readonly", width=40)
        cb.grid(row=r, column=1, columnspan=2, sticky="ew", padx=4, pady=4)

        # 추가 메모
        r += 1
        ttk.Label(lf, text="추가 메모:").grid(row=r, column=0, sticky="w", padx=4, pady=4)
        self.note_var = tk.StringVar()
        ttk.Entry(lf, textvariable=self.note_var, width=55).grid(row=r, column=1, columnspan=3, sticky="ew", padx=4, pady=4)

        # Slug
        r += 1
        ttk.Label(lf, text="Slug (선택):").grid(row=r, column=0, sticky="w", padx=4, pady=4)
        self.slug_var = tk.StringVar()
        ttk.Entry(lf, textvariable=self.slug_var, width=55).grid(row=r, column=1, columnspan=3, sticky="ew", padx=4, pady=4)
        ttk.Label(lf, text="비우면 자동 생성", foreground="#888").grid(row=r, column=4, sticky="w")

        # 썸네일 이미지
        r += 1
        ttk.Label(lf, text="썸네일 이미지:").grid(row=r, column=0, sticky="w", padx=4, pady=4)
        self.bg_path_var = tk.StringVar()
        ttk.Entry(lf, textvariable=self.bg_path_var, width=40).grid(row=r, column=1, columnspan=2, sticky="ew", padx=4, pady=4)
        ttk.Button(lf, text="찾기...", command=self._pick_image).grid(row=r, column=3, padx=4)
        ttk.Label(lf, text="(없으면 자동 생성)", foreground="#888").grid(row=r, column=4, sticky="w")

        lf.columnconfigure(1, weight=1)

        # 버튼
        btn_frame = ttk.Frame(parent)
        btn_frame.pack(fill="x", padx=12, pady=6)
        ttk.Button(btn_frame, text="🔍 미리보기 생성", command=self._preview).pack(side="left", padx=4)
        ttk.Button(btn_frame, text="🚀 업로드", style="Accent.TButton", command=self._upload).pack(side="left", padx=4)
        self.status_lbl = ttk.Label(btn_frame, text="", foreground="#555")
        self.status_lbl.pack(side="left", padx=8)

        # 미리보기 영역
        pf = ttk.LabelFrame(parent, text=" HTML 미리보기 ", padding=6)
        pf.pack(fill="both", expand=True, padx=12, pady=6)
        self.preview_txt = scrolledtext.ScrolledText(pf, font=("Consolas", 10), wrap="word", height=16)
        self.preview_txt.pack(fill="both", expand=True)

    def _build_tab2(self, parent):
        top = ttk.Frame(parent)
        top.pack(fill="x", padx=12, pady=8)
        ttk.Label(top, text="서버 URL:").pack(side="left")
        self.list_url_var = tk.StringVar(value=RAILWAY_URL_DEFAULT)
        ttk.Entry(top, textvariable=self.list_url_var, width=50).pack(side="left", padx=6)
        ttk.Button(top, text="새로고침", command=self._load_list).pack(side="left")
        ttk.Button(top, text="선택 삭제", command=self._delete_selected).pack(side="left", padx=4)

        cols = ("region", "title", "created_at")
        self.tree = ttk.Treeview(parent, columns=cols, show="headings", selectmode="extended")
        self.tree.heading("region", text="지역")
        self.tree.heading("title", text="제목")
        self.tree.heading("created_at", text="등록일시")
        self.tree.column("region", width=140)
        self.tree.column("title", width=500)
        self.tree.column("created_at", width=140)
        sb = ttk.Scrollbar(parent, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=sb.set)
        self.tree.pack(fill="both", expand=True, padx=12, pady=(0, 12))
        sb.pack(side="right", fill="y")
        self._post_ids = {}

    def _pick_image(self):
        p = filedialog.askopenfilename(filetypes=[("이미지", "*.jpg *.jpeg *.png *.webp"), ("전체", "*.*")])
        if p:
            self.bg_path_var.set(p)

    def _preview(self):
        region = self.region_var.get().strip()
        topic  = self.topic_var.get()
        note   = self.note_var.get().strip()
        if not region:
            messagebox.showwarning("입력 오류", "지역을 입력해주세요.")
            return
        try:
            title, body, meta, url_kw = generate_html(region, topic, note)
            self.preview_txt.delete("1.0", "end")
            self.preview_txt.insert("end", f"[제목] {title}\n[META] {meta}\n\n{body}")
            self._gen_result = (title, body, meta, url_kw)
            self.status_lbl.config(text="✓ 미리보기 생성 완료", foreground="green")
        except Exception as e:
            messagebox.showerror("오류", str(e))

    def _upload(self):
        region = self.region_var.get().strip()
        topic  = self.topic_var.get()
        note   = self.note_var.get().strip()
        slug   = self.slug_var.get().strip()
        bg     = self.bg_path_var.get().strip() or None
        url    = self.url_var.get().strip()
        if not region:
            messagebox.showwarning("입력 오류", "지역을 입력해주세요.")
            return
        self.status_lbl.config(text="업로드 중...", foreground="orange")
        self.update_idletasks()
        def run():
            try:
                title, body, meta, url_kw = generate_html(region, topic, note)
                region_slug = region.replace(" ", "-")
                slug_safe = slug or f"{region_slug}-{url_kw}"
                res = upload_post(url, region, title, body, slug_safe, meta, bg)
                post_url = url.rstrip("/") + res.get("url", "")
                self.after(0, lambda: (
                    self.status_lbl.config(text=f"✓ 업로드 완료: {post_url}", foreground="green"),
                    messagebox.showinfo("완료", f"포스트가 등록됐습니다!\n\n{post_url}")
                ))
            except Exception as e:
                self.after(0, lambda: (
                    self.status_lbl.config(text=f"✗ 실패: {e}", foreground="red"),
                    messagebox.showerror("업로드 실패", str(e))
                ))
        threading.Thread(target=run, daemon=True).start()

    def _load_list(self):
        import requests
        url = self.list_url_var.get().strip()
        try:
            resp = requests.get(url.rstrip("/") + "/api/posts?limit=200", timeout=10)
            resp.raise_for_status()
            posts = resp.json()
            self.tree.delete(*self.tree.get_children())
            self._post_ids.clear()
            for p in posts:
                dt = datetime.fromtimestamp(p["created_at"]/1000).strftime("%Y-%m-%d %H:%M") if p.get("created_at") else ""
                iid = self.tree.insert("", "end", values=(p.get("region",""), p.get("title",""), dt))
                self._post_ids[iid] = p["id"]
        except Exception as e:
            messagebox.showerror("오류", str(e))

    def _delete_selected(self):
        import requests
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("선택 없음", "삭제할 항목을 선택하세요.")
            return
        if not messagebox.askyesno("확인", f"{len(selected)}개 항목을 삭제할까요?"):
            return
        url = self.list_url_var.get().strip()
        for iid in selected:
            pid = self._post_ids.get(iid)
            if pid:
                try:
                    requests.delete(url.rstrip("/") + f"/api/posts/{pid}", timeout=10)
                except Exception:
                    pass
            self.tree.delete(iid)


if __name__ == "__main__":
    app = App()
    app.mainloop()
