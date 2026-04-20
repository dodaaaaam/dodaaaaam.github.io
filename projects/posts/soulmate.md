# 프로젝트 개요

> Soulmate는 사용자에게 깊은 이해와 공감을 제공하는 감성 기반 일기 서비스입니다.
> AI 채팅을 통해 사용자의 하루와 감정을 섬세히 읽어내고, 사용자가 작성한 일기에 댓글을 달아 진심 어린 피드백과 응원을 제공합니다.
> 사용자가 혼자일 때도 곁을 지키며, 말하지 않아도 마음을 알아주는 진정한 동반자가 되고자 합니다.

## 🔵 기능 소개

#### 1️⃣ 주요 기능 (MVP)

- 선택한 **AI 캐릭터와 대화 진행** → 대화를 토대로 **일기 자동 작성**
- 사용자가 **직접 일기 작성** → **AI 코멘트**

#### 2️⃣ 부가 기능

- **카카오 로그인**
- 일기 해시태그 별 조회
- 코멘트 즐겨찾기 및 모아보기

## 🔵 기술 스택

| 분류 | 기술 |
| --- | --- |
| Frontend | React 19, Vite, Zustand, Styled-components, TypeScript |
| Backend | Spring Boot 3.2.5, JPA, MySQL, OAuth (Kakao), EC2/RDS |
| AI | OpenAI GPT API 기반 코멘트 및 일기 생성 |
| 기타 | GitHub Actions, Netlify, Swagger, Notion, Figma |

## 🟡 역할 및 기여도

- 카카오 OAuth 회원가입/로그인 구현
- ERD 다이어그램 설계
- 날짜 및 캐릭터 선택 구현
- DB 엔티티 클래스 구현
- 에러 핸들링 설정
- 해시태그 종류 불러오기
- AI 코멘트 저장

## 🟢 빌드 환경

**Gradle + Spring Boot + Java 21**

| 항목 | 설명 |
| --- | --- |
| Build Tool | Gradle (Groovy DSL) |
| JDK Version | Java 21 |
| Framework | Spring Boot 3.2.5 |
| Database | MySQL (로컬 13306 포트) |
| ORM | Spring Data JPA + Hibernate |
| OAuth | Kakao Login |
| Security | Spring Security + JWT (jjwt 0.11.5) |
| API 연동 | OpenFeign, OpenAI API |
| 테스트 | JUnit + Spring Security Test |

## 🟢 주요 의존성

| 라이브러리 | 설명 |
| --- | --- |
| spring-boot-starter-web | REST API 서버 구축 |
| spring-boot-starter-data-jpa | JPA 기반 ORM 처리 |
| spring-boot-starter-security | 인증 및 보안 설정 |
| spring-boot-starter-validation | @Valid 기반 입력값 검증 |
| lombok | 반복 코드 제거 |
| mysql-connector-j | MySQL DB 연결 |
| spring-cloud-starter-openfeign | 외부 API 호출 (OpenAI, Kakao 등) |
| jjwt (api, impl, jackson) | JWT 인증 토큰 발급/검증 |
| jackson-databind | JSON 직렬화/역직렬화 |

## 🟢 BE 프로젝트 구조

```
📦src
 ┣ 📂main/java/com.openketchupsource.soulmate
 ┃  ┣ 📂apiPayload
 ┃  ┃  ┣ 📂exception/handler — DiaryHandler, LoginHandler, SettingHandler
 ┃  ┃  ┣ 📂form/status — ErrorStatus, SuccessStatus
 ┃  ┃  ┗ ApiResponse.java
 ┃  ┣ 📂auth
 ┃  ┃  ┣ 📂jwt — JwtTokenProvider, JwtValidationType
 ┃  ┃  ┣ JwtAuthenticationFilter, MemberAuthentication, PrincipalHandler
 ┃  ┣ 📂config — SecurityConfig, WebConfig
 ┃  ┣ 📂controller
 ┃  ┃  ┣ 📂chat — ChatController
 ┃  ┃  ┣ 📂diary — CommentController, DiaryController, HashTagController
 ┃  ┃  ┣ 📂login — AuthCheckController, HealthCheckController, KakaoLoginController
 ┃  ┃  ┗ 📂member — SettingController
 ┃  ┣ 📂converter — CommentConverter
 ┃  ┣ 📂domain
 ┃  ┃  ┣ 📂common — BaseTimeEntity
 ┃  ┃  ┣ 📂mapping — DiaryToHashtag
 ┃  ┃  ┗ Character, Chat, ChatMessage, Comment, Diary, HashTag, Member
 ┃  ┣ 📂dto
 ┃  ┃  ┣ 📂chat — ChatInitResponseDto, ChatMessageDto, ChatRequestDto, ChatResponseDto 등
 ┃  ┃  ┣ 📂diary — ClientDiaryCreateRequest, DiaryResponse, CommentRequest 등
 ┃  ┃  ┗ 📂kakao — SocialLoginRequest, SocialLoginResponse, TokenResponse
 ┃  ┣ 📂external.oauth/kakao — KakaoProperties, 요청/응답 DTO
 ┃  ┣ 📂repository — character, chat, diary, member 별 Repository
 ┃  ┣ 📂service — chat, diary, kakao, member 별 Service
 ┃  ┗ SoulmateApplication.java
 ┣ 📂main/resources
 ┃  ┣ application.properties
 ┃  ┗ application.yml
 ┗ 📂test — LoginService.Test, SoulmateApplicationTests
```

## 🔗 관련 링크

- 배포 URL: [withsoulmate.netlify.app](https://withsoulmate.netlify.app/)
- [Frontend Repository](https://github.com/orgs/openketchupsource/repositories)
- [Backend Repository](https://github.com/orgs/openketchupsource/repositories)
