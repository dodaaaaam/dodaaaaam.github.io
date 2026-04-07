## 프로젝트 소개

SoulMate는 MBTI 성격 유형을 기반으로 궁합이 맞는 사람을 매칭해주는 소셜 서비스입니다. 간단한 테스트를 통해 자신의 성격 프로필을 완성하고, 호환성이 높은 사용자를 추천받을 수 있습니다.

## 주요 기능

- **MBTI 테스트**: 자체 제작 성격 테스트 및 결과 분석
- **궁합 매칭**: MBTI 유형 간 호환성 알고리즘 기반 추천
- **프로필 카드**: 성격 유형, 관심사, 소개를 담은 카드 형태 프로필
- **좋아요/패스**: Tinder 스타일 스와이프 인터랙션

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React, Tailwind CSS |
| CI/CD | GitHub Actions |
| Deploy | Vercel |
| Animation | Framer Motion |

## 내가 맡은 역할

프론트엔드 개발 전반과 CI/CD 파이프라인 구축을 담당했습니다.

- 스와이프 카드 UI를 Framer Motion으로 구현 (드래그 제스처 + 스프링 애니메이션)
- MBTI 테스트 플로우를 단계별 폼으로 설계하고, 진행률 표시 UX 구현
- GitHub Actions로 PR 생성 시 자동 빌드 검증 + main 병합 시 Vercel 자동 배포 파이프라인 구축
- Tailwind CSS 커스텀 테마를 활용해 MBTI 유형별 고유 색상 시스템 구성

## 배운 점

- GitHub Actions의 워크플로우 문법과 CI/CD 파이프라인 설계를 처음부터 직접 구성해보면서 자동화의 가치를 체감했습니다.
- Framer Motion의 `useMotionValue`, `useTransform`을 활용한 제스처 기반 애니메이션 구현 경험을 쌓았습니다.
- 짧은 기간(약 2개월) 내에 기획부터 배포까지 완료하면서, MVP 관점에서 기능 우선순위를 정하는 판단력을 기를 수 있었습니다.
