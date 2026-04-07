## 프로젝트 소개

OOPS!는 팀원 간 실시간 일정 공유 및 투표 기능을 제공하는 협업 도구입니다. 모임 시간을 정할 때 각자의 가능 시간을 입력하면 자동으로 최적 시간을 추천해줍니다.

## 주요 기능

- **실시간 일정 공유**: WebSocket 기반 실시간 캘린더 동기화
- **시간 투표**: 팀원별 가능 시간 입력 → 겹치는 시간대 자동 추천
- **그룹 관리**: 팀/모임 생성, 초대 링크, 멤버 관리
- **알림**: 일정 확정 시 참여자 전원에게 알림

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React, React Query, React-Router-Dom |
| Backend | Spring Boot, WebSocket, MySQL |
| Realtime | STOMP over WebSocket |
| Infra | AWS EC2 |

## 내가 맡은 역할

프론트엔드 리드로서 UI 전체와 실시간 통신 연동을 담당했습니다.

- 캘린더 UI를 직접 구현하고 드래그 기반 시간 선택 인터랙션 개발
- STOMP 프로토콜 기반 WebSocket 연결 관리 및 실시간 데이터 동기화
- React Query의 `onSuccess` 콜백과 WebSocket 이벤트를 조합한 낙관적 업데이트 구현
- 공유 링크를 통한 비회원 참여 플로우 설계

## 배운 점

- WebSocket과 REST API를 함께 사용할 때의 상태 관리 전략을 고민하면서, 서버 상태와 실시간 상태를 분리하는 패턴을 정립했습니다.
- 드래그 인터랙션 구현 과정에서 `mousedown → mousemove → mouseup` 이벤트 체인과 `requestAnimationFrame`을 활용한 퍼포먼스 최적화를 경험했습니다.
