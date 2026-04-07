# CORS 에러 완전 정복 가이드

> **카테고리:** Trouble Shooting  
> **작성일:** 2026-03-29  
> **태그:** CORS, HTTP, 보안, 트러블슈팅

---

## 서론

프론트엔드 개발을 하다 보면 누구나 한 번쯤은 마주치는 에러가 있다.

```
Access to fetch at 'https://api.example.com/data' from origin 'http://localhost:3000'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
on the requested resource.
```

콘솔에 빨간 글씨로 뜨는 이 메시지를 처음 봤을 때, 대부분의 개발자는 당황한다. 분명 API 서버는 정상 동작하고, Postman에서는 잘 되는데, 브라우저에서만 안 된다. 구글에 "CORS error fix"를 검색하면 수십 가지 해결법이 나오지만, 원리를 모르면 결국 같은 문제를 반복하게 된다.

이 글에서는 CORS가 왜 존재하는지부터, 실제 에러 상황별 해결법, 그리고 개발 환경과 프로덕션 환경에서의 차이점까지 하나씩 짚어보겠다. 이 글을 끝까지 읽으면, 더 이상 CORS 에러 앞에서 막막해하지 않을 수 있을 것이다.

---

## 본론

### 1. Same-Origin Policy란?

CORS를 이해하려면 먼저 **Same-Origin Policy(동일 출처 정책)**를 알아야 한다. 이것은 웹 브라우저의 핵심 보안 메커니즘이다.

**Origin(출처)**은 다음 세 가지 요소의 조합으로 결정된다:

| 구성 요소 | 예시 |
|-----------|------|
| 프로토콜 (Scheme) | `http`, `https` |
| 호스트 (Host) | `example.com`, `localhost` |
| 포트 (Port) | `80`, `443`, `3000` |

아래 표에서 `https://example.com`을 기준으로 동일 출처 여부를 판단해보자:

| URL | 동일 출처? | 이유 |
|-----|-----------|------|
| `https://example.com/page` | O | 경로만 다름 |
| `https://example.com:443/page` | O | HTTPS 기본 포트 |
| `http://example.com` | X | 프로토콜 다름 |
| `https://api.example.com` | X | 호스트 다름 (서브도메인도 다른 출처) |
| `https://example.com:8080` | X | 포트 다름 |

Same-Origin Policy는 **다른 출처의 리소스에 대한 접근을 제한**한다. 이것이 없다면 악의적인 사이트가 사용자의 은행 사이트 API를 호출해서 개인정보를 탈취하는 것이 가능해진다. 쿠키 기반 인증을 사용하는 경우, 브라우저가 자동으로 쿠키를 첨부하기 때문에 이 정책이 없으면 매우 위험하다.

### 2. CORS란 무엇인가?

**CORS(Cross-Origin Resource Sharing)**는 Same-Origin Policy의 제한을 **안전하게 완화**하기 위한 HTTP 헤더 기반의 메커니즘이다.

핵심 개념을 정리하면 다음과 같다:

- CORS는 **브라우저**가 수행하는 검사이다. 서버가 차단하는 것이 아니다.
- 서버는 응답 헤더를 통해 "이 출처에서의 요청을 허용한다"고 **브라우저에게 알려준다**.
- Postman이나 curl에서는 CORS 에러가 발생하지 않는다. 브라우저만의 메커니즘이기 때문이다.

CORS 관련 주요 HTTP 헤더는 다음과 같다:

```
# 응답 헤더 (서버 -> 브라우저)
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400

# 요청 헤더 (브라우저 -> 서버, Preflight 시)
Origin: https://example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type
```

### 3. 요청의 종류: Simple Request vs Preflight Request

브라우저는 요청의 종류에 따라 CORS 처리 방식을 달리한다.

#### Simple Request (단순 요청)

다음 조건을 **모두** 만족하면 단순 요청으로 분류된다:

- 메서드가 `GET`, `HEAD`, `POST` 중 하나
- 헤더가 `Accept`, `Accept-Language`, `Content-Language`, `Content-Type` 중 하나
- `Content-Type`이 `application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain` 중 하나

단순 요청은 Preflight 없이 바로 서버에 요청을 보내고, 응답의 `Access-Control-Allow-Origin` 헤더를 확인한다.

```javascript
// 이것은 Simple Request이다
fetch('https://api.example.com/posts', {
  method: 'GET'
});
```

#### Preflight Request (사전 요청)

단순 요청 조건을 하나라도 만족하지 못하면, 브라우저는 실제 요청 전에 **OPTIONS 메서드로 사전 요청**을 보낸다.

```javascript
// 이것은 Preflight가 발생하는 요청이다
// Content-Type이 application/json이기 때문
fetch('https://api.example.com/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',   // 이 헤더가 Preflight를 유발
    'Authorization': 'Bearer token123'     // 이 헤더도 Preflight를 유발
  },
  body: JSON.stringify({ title: 'Hello' })
});
```

Preflight 요청의 흐름은 다음과 같다:

```
1. 브라우저 → 서버: OPTIONS /posts (Preflight 요청)
   Origin: https://example.com
   Access-Control-Request-Method: POST
   Access-Control-Request-Headers: Content-Type, Authorization

2. 서버 → 브라우저: 200 OK (Preflight 응답)
   Access-Control-Allow-Origin: https://example.com
   Access-Control-Allow-Methods: POST, GET, OPTIONS
   Access-Control-Allow-Headers: Content-Type, Authorization
   Access-Control-Max-Age: 86400

3. 브라우저: Preflight 응답 확인 후, 실제 요청 전송
   브라우저 → 서버: POST /posts
   Origin: https://example.com
   Content-Type: application/json
   Authorization: Bearer token123
```

`Access-Control-Max-Age`를 설정하면 브라우저가 Preflight 결과를 캐시하므로, 같은 요청에 대해 매번 OPTIONS 요청을 보내지 않아도 된다.

### 4. 에러 상황별 해결법

#### 4-1. 프론트엔드에서의 해결

##### 개발 환경: 프록시 설정

개발 환경에서 가장 간단한 해결법은 **개발 서버의 프록시 기능**을 사용하는 것이다. 브라우저는 같은 출처(개발 서버)로 요청을 보내고, 개발 서버가 실제 API 서버로 요청을 전달한다.

**Vite 프록시 설정:**

```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // HTTPS 인증서 검증을 건너뛰려면 (개발 환경에서만!)
        secure: false
      }
    }
  }
});
```

**Webpack Dev Server 프록시 설정:**

```javascript
// webpack.config.js
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true,
        pathRewrite: { '^/api': '' }
      }
    }
  }
};
```

이제 프론트엔드 코드에서는 상대 경로로 요청하면 된다:

```javascript
// Before (CORS 에러 발생)
fetch('https://api.example.com/users');

// After (프록시 경유, CORS 에러 없음)
fetch('/api/users');
```

##### fetch 요청 시 주의사항

```javascript
// credentials 옵션: 쿠키를 포함할지 결정
fetch('https://api.example.com/data', {
  credentials: 'include'  // 쿠키 포함 (서버에서 Allow-Credentials: true 필요)
});

// mode 옵션
fetch('https://api.example.com/data', {
  mode: 'cors'       // 기본값. CORS 요청을 수행
});

fetch('https://api.example.com/data', {
  mode: 'no-cors'    // 주의! 응답 body를 읽을 수 없다 (opaque response)
});
```

> **주의:** `mode: 'no-cors'`는 CORS 에러를 "숨길" 뿐이다. 응답 데이터에 접근할 수 없으므로, 실질적인 해결법이 아니다. 이미지나 스크립트처럼 데이터를 읽을 필요 없는 경우에만 의미가 있다.

#### 4-2. 백엔드에서의 해결

CORS 문제의 근본적인 해결은 **서버에서 적절한 응답 헤더를 설정**하는 것이다.

##### Spring Boot CORS 설정

**방법 1: 글로벌 CORS 설정 (추천)**

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")                        // CORS를 적용할 경로
                .allowedOrigins(
                    "https://example.com",
                    "https://www.example.com"
                )                                              // 허용할 출처
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type", "Authorization", "X-Requested-With")
                .allowCredentials(true)                        // 쿠키 허용
                .maxAge(3600);                                 // Preflight 캐시 1시간
    }
}
```

**방법 2: 컨트롤러별 `@CrossOrigin` 어노테이션**

```java
@RestController
@RequestMapping("/api/users")
@CrossOrigin(
    origins = "https://example.com",
    methods = { RequestMethod.GET, RequestMethod.POST },
    allowCredentials = "true"
)
public class UserController {

    @GetMapping
    public List<User> getUsers() {
        return userService.findAll();
    }

    // 메서드 레벨에서도 설정 가능
    @CrossOrigin(origins = "https://admin.example.com")
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.delete(id);
    }
}
```

**방법 3: Spring Security와 함께 사용 (주의 필요)**

Spring Security를 사용하는 경우, Security 필터 체인에서도 CORS를 설정해야 한다. 그렇지 않으면 Security 필터가 CORS 헤더를 추가하기 전에 요청을 차단할 수 있다.

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "https://example.com",
            "https://www.example.com"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
```

##### Express.js (Node.js) CORS 설정

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// 방법 1: cors 미들웨어 사용
app.use(cors({
  origin: ['https://example.com', 'https://www.example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  maxAge: 3600
}));

// 방법 2: 수동 헤더 설정
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://example.com');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Preflight 요청에 대한 빠른 응답
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
```

#### 4-3. 프록시 서버에서의 해결

프로덕션 환경에서는 Nginx 같은 리버스 프록시에서 CORS를 처리하는 것이 일반적이다.

##### Nginx CORS 설정

```nginx
server {
    listen 80;
    server_name api.example.com;

    location /api/ {
        # CORS 헤더 설정
        # $http_origin을 사용해 동적으로 허용 출처를 설정할 수도 있다
        set $cors_origin "";
        if ($http_origin ~* "^https://(example\.com|www\.example\.com)$") {
            set $cors_origin $http_origin;
        }

        add_header 'Access-Control-Allow-Origin' $cors_origin always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Max-Age' 86400 always;

        # Preflight 요청 처리
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' $cors_origin always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Max-Age' 86400 always;
            add_header 'Content-Length' 0;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            return 204;
        }

        proxy_pass http://backend_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

> **중요:** `always` 키워드를 빠뜨리면, 4xx/5xx 에러 응답에는 CORS 헤더가 포함되지 않는다. 서버 에러가 발생했을 때 브라우저에서 CORS 에러로 보이는 원인이 바로 이것이다.

##### 같은 도메인으로 통합 (가장 깔끔한 방법)

```nginx
server {
    listen 443 ssl;
    server_name example.com;

    # 프론트엔드 정적 파일
    location / {
        root /var/www/frontend;
        try_files $uri $uri/ /index.html;
    }

    # API 요청을 백엔드로 프록시
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

이 구성에서는 프론트엔드와 API가 같은 출처(`https://example.com`)에서 제공되므로, CORS 자체가 발생하지 않는다.

### 5. 자주 발생하는 실수들

#### 실수 1: 와일드카드와 credentials를 함께 사용

```
# 이 조합은 동작하지 않는다!
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
```

`credentials: 'include'`를 사용할 때는 `Access-Control-Allow-Origin`에 와일드카드(`*`)를 쓸 수 없다. 반드시 구체적인 출처를 명시해야 한다.

```java
// 잘못된 예
.allowedOrigins("*")
.allowCredentials(true)   // 에러 발생!

// 올바른 예
.allowedOrigins("https://example.com")
.allowCredentials(true)
```

#### 실수 2: Preflight(OPTIONS) 요청을 처리하지 않음

Spring Security나 인증 필터가 OPTIONS 요청까지 인증을 요구하면, Preflight 자체가 401로 실패한다.

```java
// 잘못된 예: OPTIONS 요청도 인증을 요구
.authorizeHttpRequests(auth -> auth
    .anyRequest().authenticated()
);

// 올바른 예: OPTIONS 요청은 인증 없이 허용
.authorizeHttpRequests(auth -> auth
    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
    .anyRequest().authenticated()
);
```

#### 실수 3: 응답 헤더가 중복 설정됨

Nginx와 백엔드 애플리케이션 양쪽에서 CORS 헤더를 설정하면, 같은 헤더가 두 번 포함되어 브라우저가 거부할 수 있다.

```
# 이런 식으로 중복되면 에러가 발생한다
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Origin: https://example.com
```

CORS 헤더는 **한 곳에서만** 설정하자. Nginx에서 할 것인지, 애플리케이션에서 할 것인지 팀 내에서 명확히 정해야 한다.

#### 실수 4: `http`와 `https`를 혼동

```javascript
// 허용된 출처가 https://example.com인데
// http://example.com에서 요청하면 다른 출처로 판단된다
```

프로토콜도 출처의 일부이므로, `http`와 `https`를 구분해서 설정해야 한다.

#### 실수 5: 포트 번호 누락

```javascript
// 로컬 개발 시 흔한 실수
// React: http://localhost:3000
// Vue:   http://localhost:5173
// 서버에서 허용한 출처: http://localhost  (포트 없음)
// -> CORS 에러 발생!
```

### 6. 디버깅 팁

CORS 에러를 만났을 때 체계적으로 디버깅하는 방법을 알아보자.

#### 6-1. 브라우저 개발자 도구 활용

```
1. Network 탭을 연다
2. 실패한 요청을 클릭한다
3. Headers 탭에서 다음을 확인한다:
   - Request Headers에 Origin이 있는지
   - Response Headers에 Access-Control-Allow-Origin이 있는지
4. Preflight 요청이 있다면 (같은 URL에 OPTIONS 메서드):
   - 상태 코드가 200 또는 204인지
   - 응답 헤더에 Access-Control-Allow-* 헤더들이 있는지
```

#### 6-2. curl로 직접 확인

```bash
# Preflight 요청 시뮬레이션
curl -v -X OPTIONS https://api.example.com/data \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization"

# 응답에서 확인할 것:
# < Access-Control-Allow-Origin: https://example.com
# < Access-Control-Allow-Methods: POST
# < Access-Control-Allow-Headers: Content-Type, Authorization
```

#### 6-3. 에러 메시지별 원인 파악

| 에러 메시지 | 원인 | 해결법 |
|------------|------|--------|
| No 'Access-Control-Allow-Origin' header | 서버가 CORS 헤더를 보내지 않음 | 서버에 CORS 설정 추가 |
| is not an allowed origin | 출처가 허용 목록에 없음 | 정확한 출처를 allowedOrigins에 추가 |
| Method PUT is not allowed | 해당 HTTP 메서드가 허용되지 않음 | allowedMethods에 메서드 추가 |
| Request header field authorization is not allowed | 해당 헤더가 허용되지 않음 | allowedHeaders에 헤더 추가 |
| Credentials flag is true but Allow-Origin is wildcard | credentials와 와일드카드 충돌 | 구체적인 출처를 명시 |

### 7. 개발 환경 vs 프로덕션 환경

개발 환경과 프로덕션 환경에서의 CORS 전략은 달라야 한다.

#### 개발 환경

```javascript
// 프론트엔드 개발 서버의 프록시를 적극 활용
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
});
```

```java
// 백엔드: 개발용 프로필에서만 느슨한 CORS 설정
@Profile("dev")
@Configuration
public class DevCorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("*")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

#### 프로덕션 환경

```java
// 프로덕션: 엄격한 CORS 설정
@Profile("prod")
@Configuration
public class ProdCorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                    "https://example.com",
                    "https://www.example.com"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowedHeaders("Content-Type", "Authorization")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

**개발 vs 프로덕션 비교 요약:**

| 항목 | 개발 환경 | 프로덕션 환경 |
|------|----------|-------------|
| 프록시 | 개발 서버 프록시 사용 | Nginx 리버스 프록시 |
| allowedOrigins | 와일드카드 또는 localhost | 구체적인 도메인만 |
| allowedMethods | 전체 허용 | 필요한 메서드만 |
| HTTPS | 선택사항 | 필수 |
| 에러 노출 | 상세한 에러 메시지 | 최소한의 정보 |

**프로덕션에서 절대 하면 안 되는 것:**

```java
// 절대 금지! 모든 출처를 허용하면 CORS의 보안 의미가 없어진다
.allowedOrigins("*")

// 프로덕션에서 credentials와 함께 사용 시 특히 위험
.allowedOriginPatterns("*")
.allowCredentials(true)
```

---

## 결론

CORS 에러는 처음 만나면 당황스럽지만, 원리를 이해하면 체계적으로 해결할 수 있다. 핵심 내용을 정리하면 다음과 같다.

**기억해야 할 핵심:**

1. **CORS는 브라우저의 보안 메커니즘**이다. 서버가 차단하는 것이 아니라, 브라우저가 서버의 응답 헤더를 확인하고 차단하는 것이다.
2. **근본적인 해결은 서버에서 한다.** 응답에 올바른 `Access-Control-Allow-*` 헤더를 포함시키는 것이 정석이다.
3. **개발 환경에서는 프록시를 활용**하면 편리하다. 하지만 프로덕션에서도 프록시에만 의존하지 말고, 서버 설정을 정확히 이해하고 있어야 한다.
4. **CORS 헤더는 한 곳에서만 설정**하자. Nginx와 애플리케이션에서 중복 설정하면 오히려 에러가 발생한다.
5. **프로덕션에서는 반드시 구체적인 출처만 허용**하자. 와일드카드는 개발 환경에서만 사용해야 한다.

디버깅할 때는 브라우저 개발자 도구의 Network 탭을 열고, 요청과 응답 헤더를 꼼꼼히 확인하자. Preflight 요청이 성공하는지, 올바른 출처가 허용되어 있는지, credentials 설정에 충돌이 없는지를 하나씩 체크하면 대부분의 CORS 문제는 해결할 수 있다.

CORS는 웹 보안의 기초 중 하나이다. 이 글이 더 이상 CORS 에러 앞에서 당황하지 않는 데 도움이 되었으면 좋겠다.
