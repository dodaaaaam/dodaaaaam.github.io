## 프로젝트 소개

CookMate는 냉장고 속 재료를 입력하면 AI가 레시피를 추천해주는 요리 도우미 서비스입니다. 음성 인식(STT)으로 재료를 입력하고, 음성 합성(TTS)으로 조리 과정을 안내받을 수 있습니다.

## 주요 기능

- **재료 기반 레시피 추천**: 보유 재료를 입력하면 가능한 레시피를 AI가 추천
- **음성 입력(STT)**: Microsoft Azure Speech API를 활용한 음성 인식
- **음성 가이드(TTS)**: 조리 단계별 음성 안내
- **즐겨찾기**: 자주 만드는 레시피 저장 및 관리

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React, Zustand, Tailwind CSS |
| External API | Microsoft Azure Speech API |
| State | Zustand (전역), React Query (서버) |
| Deploy | Vercel |

## 내가 맡은 역할

프론트엔드 개발 및 외부 API 연동을 담당했습니다.

- Tailwind CSS로 모바일 퍼스트 반응형 UI 구현
- Azure Speech API의 STT/TTS 기능을 WebSocket 기반으로 연동
- Zustand로 음성 인식 상태와 레시피 흐름 상태를 분리 관리
- 조리 단계를 카드 형태로 시각화하는 Step-by-Step UI 구현

## 배운 점

- 외부 API(Azure Speech)와의 연동에서 인증 토큰 관리, 에러 핸들링, 재시도 로직 등 실전적인 API 통신 패턴을 경험했습니다.
- WebSocket의 연결/해제 라이프사이클과 React 컴포넌트의 마운트/언마운트를 동기화하는 방법을 익혔습니다.
- UMC 9th 데모데이에서 최우수상을 수상하며 사용자 관점의 프로덕트 완성도의 중요성을 느꼈습니다.
