# Puma Browser Web

## 1. Project Description
Puma Browser의 React 웹 버전. AI + Web3 + 프라이버시 중심의 모바일 브라우저를 웹사이트로 구현.
- **Product positioning**: AI 기반 프라이버시 웹브라우저의 웹 데모/대체 버전
- **Target users**: AI와 Web3에 관심 있는 사용자, 프라이버시 중시 사용자
- **Core value**: 로컬 AI + 서버 AI 지원, Web3 지갑 통합, IPFS 접근, 광고 없는 프라이버시 브라우징

## 2. Page Structure
- `/` - Home (브라우저 메인 화면, 주소창 + 기능 메뉴)
- `/ai-assistant` - AI Assistant (챗봇 인터페이스)
- `/prompts` - Prompts (AI 명령어 저장/관리)
- `/ai-tools` - Puma AI Tools (전체 AI 기능 대시보드)
- `/wallet` - Wallet (Web3 지갑, Solana, ENS, HNS)
- `/ipfs` - IPFS Gateways (탈중앙 웹 접근)
- `/mcp` - MCP Server (외부 AI/서버 연결)
- `/settings` - Settings (브라우저 설정)
- `/tabs` - Tab Manager (탭 관리)
- `/bookmarks` - Bookmarks (북마크)
- `/history` - Browsing History (방문 기록)

## 3. Core Features
- [ ] 브라우저 메인 UI (주소창, 탭, 북마크, 검색엔진 선택)
- [ ] AI Assistant 챗봇 인터페이스 (로컬 AI + 서버 AI)
- [ ] Prompts 관리 (AI 명령어 저장/불러오기)
- [ ] AI Tools 대시보드 (요약, 질문, 분석 등)
- [ ] Web3 Wallet (지갑 연결, NFT, 마이크로결제)
- [ ] IPFS Gateways (탈중앙 웹사이트 접근)
- [ ] MCP Server 연결 설정
- [ ] 프라이버시 설정 및 데이터 보호 UI
- [ ] 탭/북마크/히스토리 관리

## 4. Data Model Design
현재 단계에서는 로컬 스토리지 사용:
- bookmarks: id, title, url, favicon, createdAt
- history: id, url, title, visitTime
- prompts: id, name, content, category, createdAt
- tabs: id, url, title, isActive
- settings: searchEngine, aiProvider, privacyMode, theme

## 5. Backend / Third-party Integration Plan
- **Supabase**: 현재 미연결. 향후 사용자 계정/동기화 필요 시 연결
- **Shopify**: 불필요
- **Stripe**: 불필요 (마이크로결제는 Web3/Interledger 기반)
- **Others**: 
  - OpenAI/Anthropic/Gemini API (서버 AI 기능 - Edge Function으로 처리)
  - Solana Web3 (지갑 연결)
  - IPFS Gateways

## 6. Development Phase Plan

### Phase 1: 브라우저 메인 UI + 홈페이지
- Goal: Puma Browser의 핵심 브라우저 인터페이스 구현
- Deliverable: 주소창, 탭, 북마크, 검색, AI 메뉴 접근이 가능한 메인 화면

### Phase 2: AI Assistant + Prompts
- Goal: AI 챗봇 인터페이스와 프롬프트 관리 기능
- Deliverable: 채팅 UI, 프롬프트 저장/불러오기, AI 설정

### Phase 3: AI Tools 대시보드
- Goal: 웹페이지 요약, 질문답변, 분석 등 AI 기능 UI
- Deliverable: AI Tools 메뉴, 각 기능별 인터페이스

### Phase 4: Web3 Wallet + IPFS
- Goal: 지갑 연결 UI와 IPFS 게이트웨이 인터페이스
- Deliverable: Wallet 페이지, IPFS 접근 UI

### Phase 5: MCP Server + Settings
- Goal: 외부 AI 연결 설정과 브라우저 설정
- Deliverable: MCP 설정 페이지, 전체 설정 UI

### Phase 6: 탭/북마크/히스토리 관리
- Goal: 브라우저 데이터 관리 기능
- Deliverable: 탭 매니저, 북마크 페이지, 방문 기록 페이지