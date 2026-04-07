## 서론

개발자 면접에서 단골로 등장하는 질문이 있다.

> "브라우저 주소창에 `https://www.google.com`을 입력하고 Enter를 누르면 어떤 일이 일어나나요?"

단순해 보이는 이 질문 하나에 네트워크, 보안, 운영체제, 브라우저 엔진까지 컴퓨터 과학의 핵심 개념들이 총동원된다. 우리가 아무렇지 않게 주소를 입력하고 웹 페이지를 보기까지, 그 짧은 순간 안에 수십 개의 프로토콜과 시스템이 정교하게 맞물려 동작한다.

이 글에서는 URL 입력부터 화면에 픽셀이 그려지기까지의 전체 과정을 **8단계**로 나누어 하나씩 살펴본다.

```
[사용자 입력] → [URL 파싱] → [DNS 조회] → [TCP 연결] → [TLS 핸드셰이크]
    → [HTTP 요청/응답] → [HTML 파싱 & DOM] → [CSSOM & Render Tree]
    → [Layout / Paint / Composite] → [화면 출력]
```

각 단계를 깊이 있게 이해하면 웹 성능 최적화의 원리가 자연스럽게 보이고, 네트워크 문제를 디버깅할 때도 어디를 들여다봐야 하는지 감이 잡힌다. 그럼 시작해 보자.

---

## 본론

### 1단계: URL 파싱 (URL Parsing)

사용자가 주소창에 `https://www.example.com:443/path/page?query=value#section`을 입력하면, 브라우저는 가장 먼저 이 문자열을 **파싱(parsing)**하여 각 구성 요소로 분해한다.

#### URL의 구조

```
  https://www.example.com:443/path/page?query=value#section
  -----   --------------- --- --------- ----------- --------
    |           |          |      |          |          |
  scheme      host       port   path      query     fragment
```

각 구성 요소의 역할은 다음과 같다.

| 구성 요소 | 설명 | 예시 |
|-----------|------|------|
| **Scheme** | 사용할 프로토콜 | `https` |
| **Host** | 서버의 도메인 이름 | `www.example.com` |
| **Port** | 서버의 포트 번호 (생략 시 기본값 사용) | `443` (HTTPS 기본) |
| **Path** | 서버 내 리소스 경로 | `/path/page` |
| **Query** | 서버에 전달할 파라미터 | `query=value` |
| **Fragment** | 페이지 내 특정 위치 (서버로 전송되지 않음) | `section` |

브라우저는 이 파싱 결과를 바탕으로 다음 동작을 결정한다.

- Scheme이 `https`이면 TLS 연결이 필요하다.
- Host를 통해 DNS 조회 대상을 확정한다.
- Port가 생략되어 있으면 scheme에 따라 기본 포트를 사용한다 (`http` = 80, `https` = 443).

#### HSTS 확인

브라우저는 URL 파싱 직후, 해당 도메인이 **HSTS(HTTP Strict Transport Security)** 목록에 포함되어 있는지 확인한다. HSTS 목록에 있는 도메인이라면, 사용자가 `http://`로 입력했더라도 브라우저가 자동으로 `https://`로 변환한다. 이는 중간자 공격(MITM)을 방지하기 위한 보안 메커니즘이다.

Chrome에서는 `chrome://net-internals/#hsts`에서 HSTS 상태를 직접 확인할 수 있다.

#### 브라우저 캐시 확인

본격적인 네트워크 요청에 앞서, 브라우저는 로컬 캐시에 해당 리소스가 존재하는지 먼저 확인한다. 캐시가 유효하다면(Cache-Control 헤더의 max-age가 만료되지 않았다면) 네트워크 요청 없이 바로 캐시된 응답을 사용한다. 이후 단계들은 캐시 미스(cache miss)가 발생했을 때 진행된다.

---

### 2단계: DNS 조회 (DNS Lookup)

사람이 읽을 수 있는 도메인 이름 `www.example.com`을 컴퓨터가 이해할 수 있는 IP 주소 `93.184.216.34`로 변환해야 한다. 이 작업을 수행하는 시스템이 바로 **DNS(Domain Name System)**이다.

#### DNS 조회 순서

DNS 조회는 여러 단계의 캐시를 거치며, 가능한 빨리 결과를 반환하려 한다.

```
[브라우저 DNS 캐시]
       |  (miss)
       v
[OS DNS 캐시]
       |  (miss)
       v
[hosts 파일 확인]
       |  (miss)
       v
[DNS Resolver (ISP)]
       |  (miss)
       v
[Root DNS Server]  →  [TLD DNS Server (.com)]  →  [Authoritative DNS Server]
       |                      |                            |
       +----------------------+----------------------------+
                              |
                        IP 주소 반환
```

1. **브라우저 DNS 캐시**: 브라우저가 자체적으로 유지하는 DNS 캐시를 먼저 확인한다. Chrome의 경우 `chrome://net-internals/#dns`에서 확인 가능하다.
2. **OS DNS 캐시**: 운영체제 레벨의 DNS 캐시를 확인한다. Windows에서는 `ipconfig /displaydns` 명령으로 확인할 수 있다.
3. **hosts 파일**: OS는 `/etc/hosts` (Linux/Mac) 또는 `C:\Windows\System32\drivers\etc\hosts` (Windows) 파일을 참조한다.
4. **DNS Resolver (재귀적 DNS 서버)**: 보통 ISP가 제공하는 DNS 서버에 질의한다. 또는 Google(8.8.8.8)이나 Cloudflare(1.1.1.1) 같은 공개 DNS를 사용하기도 한다.

#### 재귀적 DNS 조회 과정

DNS Resolver에도 캐시가 없다면, 다음과 같이 **반복적 질의(iterative query)**가 이루어진다.

1. **Root Name Server**에 질의: "`.com`을 관리하는 TLD 서버의 주소를 알려주세요."
2. **TLD Name Server** (`.com` 담당)에 질의: "`example.com`을 관리하는 권한 있는 네임서버의 주소를 알려주세요."
3. **Authoritative Name Server**에 질의: "`www.example.com`의 IP 주소를 알려주세요."

최종적으로 IP 주소가 반환되면, 각 단계의 캐시에 결과가 저장된다. 이때 **TTL(Time To Live)** 값에 따라 캐시 유효 기간이 결정된다.

#### DNS 레코드 타입

```
;; A 레코드: 도메인 → IPv4 주소
www.example.com.    IN    A    93.184.216.34

;; AAAA 레코드: 도메인 → IPv6 주소
www.example.com.    IN    AAAA    2606:2800:220:1:248:1893:25c8:1946

;; CNAME 레코드: 도메인 → 다른 도메인 (별칭)
blog.example.com.   IN    CNAME    www.example.com.
```

참고로, 최근 브라우저들은 보안을 위해 **DoH(DNS over HTTPS)** 또는 **DoT(DNS over TLS)**를 사용하여 DNS 질의 자체를 암호화하기도 한다. 일반 DNS 질의는 평문으로 전송되기 때문에, 중간자가 사용자의 방문 사이트를 엿볼 수 있는 문제가 있었다.

---

### 3단계: TCP 연결 (3-Way Handshake)

IP 주소를 얻었으면, 이제 해당 서버와 **신뢰할 수 있는 연결**을 맺어야 한다. 웹 통신의 근간이 되는 **TCP(Transmission Control Protocol)**는 데이터를 주고받기 전에 반드시 연결을 수립하는데, 이 과정이 바로 유명한 **3-Way Handshake**이다.

#### 3-Way Handshake 과정

```
클라이언트                                서버
    |                                      |
    |  ---- [1] SYN (seq=x) ---------->    |
    |                                      |
    |  <--- [2] SYN-ACK (seq=y, ack=x+1)  |
    |                                      |
    |  ---- [3] ACK (ack=y+1) ---------->  |
    |                                      |
    |        연결 수립 완료 (ESTABLISHED)     |
    |                                      |
```

1. **SYN (Synchronize)**: 클라이언트가 서버에 연결 요청을 보낸다. 이때 클라이언트의 초기 시퀀스 번호(ISN, Initial Sequence Number)가 포함된다.
2. **SYN-ACK**: 서버가 요청을 수락하며, 자신의 초기 시퀀스 번호와 함께 클라이언트의 SYN에 대한 확인 응답(ACK)을 보낸다.
3. **ACK (Acknowledge)**: 클라이언트가 서버의 SYN에 대한 확인 응답을 보낸다. 이 패킷부터 데이터를 함께 실을 수 있다.

#### 왜 3-Way인가?

2-Way로는 충분하지 않을까? 그렇지 않다. 3-Way Handshake의 핵심 목적은 **양방향 통신이 가능한지 확인**하는 것이다.

- 1단계(SYN): 클라이언트 → 서버 방향이 정상인지 확인
- 2단계(SYN-ACK): 서버 → 클라이언트 방향이 정상인지 확인 + 서버가 클라이언트의 요청을 수신했음을 확인
- 3단계(ACK): 클라이언트가 서버의 응답을 수신했음을 확인

만약 2-Way만 사용한다면, 서버는 클라이언트가 자신의 응답을 제대로 받았는지 알 수 없다.

#### TCP 관련 최적화: TCP Fast Open

일반적인 3-Way Handshake는 최소 **1 RTT(Round Trip Time)**가 소요된다. 이 지연을 줄이기 위해 **TCP Fast Open(TFO)**이라는 기술이 있다. TFO는 최초 연결 시 쿠키를 발급받고, 이후 재연결 시 SYN 패킷에 데이터를 포함하여 0-RTT로 데이터 전송을 시작할 수 있게 해 준다.

---

### 4단계: TLS 핸드셰이크 (TLS Handshake)

HTTPS를 사용하는 경우, TCP 연결이 수립된 직후 **TLS(Transport Layer Security) 핸드셰이크**가 시작된다. TLS는 통신 내용을 암호화하여 도청과 변조를 방지한다.

#### TLS 1.3 핸드셰이크 과정

현재 대부분의 모던 브라우저와 서버는 TLS 1.3을 사용한다. TLS 1.3은 이전 버전(1.2)에 비해 핸드셰이크 단계가 간소화되어 **1 RTT**만에 완료된다.

```
클라이언트                                           서버
    |                                                 |
    |  ---- ClientHello --------------------------->  |
    |        - 지원하는 암호화 스위트 목록                  |
    |        - 클라이언트 랜덤값                          |
    |        - 키 공유(Key Share) 파라미터               |
    |                                                 |
    |  <--- ServerHello ----------------------------  |
    |        - 선택된 암호화 스위트                        |
    |        - 서버 랜덤값                               |
    |        - 키 공유(Key Share) 파라미터               |
    |        - 서버 인증서                               |
    |        - 인증서 검증 데이터                          |
    |        - Finished                               |
    |                                                 |
    |  ---- Finished ------------------------------>  |
    |                                                 |
    |     암호화된 통신 시작 (Application Data)           |
    |                                                 |
```

#### 핵심 과정 설명

1. **ClientHello**: 클라이언트가 지원 가능한 TLS 버전, 암호화 스위트(Cipher Suite) 목록, 랜덤값, 그리고 **키 공유 파라미터**를 전송한다. TLS 1.3에서는 클라이언트가 미리 키 교환에 필요한 값을 보내기 때문에 왕복 횟수가 줄어든다.

2. **ServerHello + 인증서**: 서버가 사용할 암호화 스위트를 선택하고, 자신의 인증서와 키 공유 파라미터를 응답한다.

3. **인증서 검증**: 클라이언트는 서버가 보낸 인증서를 검증한다.
   - 인증서가 신뢰할 수 있는 CA(Certificate Authority)에 의해 발급되었는지 확인
   - 인증서의 도메인이 현재 접속하려는 도메인과 일치하는지 확인
   - 인증서의 유효 기간이 만료되지 않았는지 확인
   - OCSP(Online Certificate Status Protocol)를 통해 인증서 폐지 여부 확인

4. **세션 키 생성**: 양측이 교환한 키 공유 파라미터를 바탕으로, 동일한 **세션 키(대칭 키)**를 각각 독립적으로 계산한다. 이후 모든 통신은 이 대칭 키로 암호화된다.

#### 왜 대칭 키를 쓸까?

비대칭 암호화(RSA, ECDSA 등)는 안전하지만 연산 비용이 매우 크다. 그래서 TLS는 비대칭 암호화를 **키 교환**에만 사용하고, 실제 데이터 전송에는 비대칭 키로 합의한 **대칭 키(AES 등)**를 사용한다. 이렇게 하면 보안성과 성능을 동시에 확보할 수 있다.

#### TLS 1.3의 0-RTT 재연결

이전에 연결한 적 있는 서버에 재연결할 때, TLS 1.3은 **0-RTT(Zero Round Trip Time Resumption)**를 지원한다. PSK(Pre-Shared Key)를 사용하여 핸드셰이크 완료 전에 데이터를 전송할 수 있다. 다만 0-RTT 데이터는 리플레이 공격에 취약할 수 있어, 서버 측에서 별도의 방어 로직이 필요하다.

---

### 5단계: HTTP 요청과 응답

TLS 연결까지 수립되었으면, 드디어 **HTTP 요청**을 보낼 차례다.

#### HTTP 요청 메시지

```http
GET /path/page?query=value HTTP/2
Host: www.example.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Cookie: session_id=abc123; theme=dark
```

요청 메시지의 주요 구성 요소는 다음과 같다.

- **요청 라인**: 메서드(GET), 경로(/path/page), HTTP 버전(HTTP/2)
- **Host 헤더**: 하나의 IP에 여러 도메인이 호스팅될 수 있으므로(가상 호스팅), 어떤 도메인에 대한 요청인지 명시한다.
- **User-Agent**: 브라우저 종류와 버전 정보
- **Accept 헤더들**: 클라이언트가 처리할 수 있는 콘텐츠 유형, 언어, 인코딩을 서버에 알린다.
- **Cookie**: 이전에 서버가 설정한 쿠키 값을 함께 전송한다.

#### HTTP 응답 메시지

```http
HTTP/2 200 OK
Content-Type: text/html; charset=UTF-8
Content-Encoding: br
Cache-Control: max-age=3600
ETag: "abc123"
Set-Cookie: tracking=xyz789; Secure; HttpOnly; SameSite=Strict
Content-Length: 48576

<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>Example Page</title>
    ...
</head>
<body>
    ...
</body>
</html>
```

응답 메시지의 주요 구성 요소는 다음과 같다.

- **상태 라인**: HTTP 버전, 상태 코드(200), 상태 메시지(OK)
- **Content-Type**: 응답 본문의 미디어 타입. 브라우저는 이 값을 보고 HTML인지, JSON인지, 이미지인지 판단한다.
- **Content-Encoding**: 응답 본문의 압축 방식. `br`은 Brotli 압축을 의미한다.
- **Cache-Control**: 이 응답을 얼마나 오래 캐시할 수 있는지 지정한다.
- **응답 본문**: 실제 HTML 문서 내용

#### HTTP/2와 HTTP/3

현대 웹에서는 대부분 **HTTP/2** 이상을 사용한다.

**HTTP/2의 주요 특징:**
- **멀티플렉싱(Multiplexing)**: 하나의 TCP 연결에서 여러 요청/응답을 동시에 처리. HTTP/1.1의 Head-of-Line Blocking 문제를 해결한다.
- **헤더 압축(HPACK)**: 반복되는 헤더를 효율적으로 압축한다.
- **서버 푸시(Server Push)**: 클라이언트가 요청하기 전에 서버가 필요한 리소스를 미리 전송할 수 있다.

**HTTP/3의 주요 특징:**
- TCP 대신 **QUIC(UDP 기반)** 프로토콜을 사용한다.
- TCP 레벨의 Head-of-Line Blocking을 완전히 제거한다.
- 연결 수립과 TLS 핸드셰이크를 통합하여 지연 시간을 더욱 줄인다.

---

### 6단계: HTML 파싱 및 DOM 생성

서버로부터 HTML 문서를 수신하면, 브라우저의 **렌더링 엔진**이 본격적으로 작동한다. Chrome은 Blink, Firefox는 Gecko, Safari는 WebKit 엔진을 사용한다.

#### HTML 파싱 과정

HTML 파서는 바이트 스트림을 다음 단계를 거쳐 **DOM(Document Object Model)** 트리로 변환한다.

```
바이트(Bytes) → 문자(Characters) → 토큰(Tokens) → 노드(Nodes) → DOM 트리
```

구체적으로 살펴보면:

1. **바이트 → 문자 변환**: 서버가 지정한 인코딩(UTF-8 등)에 따라 바이트를 문자로 디코딩한다.
2. **토큰화(Tokenization)**: HTML 문자열을 의미 있는 토큰으로 분리한다. `<html>`, `<head>`, `<body>`, `</div>` 같은 시작/종료 태그, 속성, 텍스트 등이 각각 하나의 토큰이 된다.
3. **노드 생성**: 각 토큰을 DOM 노드 객체로 변환한다.
4. **DOM 트리 구성**: 태그의 중첩 관계에 따라 부모-자식 트리 구조를 만든다.

#### DOM 트리 예시

다음 HTML 코드가 있다고 하자.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>페이지 제목</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>안녕하세요</h1>
    </header>
    <main>
        <p>본문 내용입니다.</p>
        <img src="photo.jpg" alt="사진">
    </main>
    <script src="app.js"></script>
</body>
</html>
```

이 HTML은 다음과 같은 DOM 트리로 변환된다.

```
Document
 └── html (lang="ko")
      ├── head
      │    ├── meta (charset="UTF-8")
      │    ├── title
      │    │    └── "페이지 제목"
      │    └── link (rel="stylesheet", href="style.css")
      └── body
           ├── header
           │    └── h1
           │         └── "안녕하세요"
           ├── main
           │    ├── p
           │    │    └── "본문 내용입니다."
           │    └── img (src="photo.jpg", alt="사진")
           └── script (src="app.js")
```

#### 파싱 중 외부 리소스 처리

HTML을 파싱하다가 외부 리소스를 만나면 브라우저의 동작이 달라진다.

- **`<link rel="stylesheet">`**: CSS 파일 다운로드를 시작한다. CSS는 **렌더링 차단(render-blocking)** 리소스다. CSSOM이 완성되어야 렌더 트리를 구성할 수 있기 때문이다. 하지만 HTML 파싱 자체는 계속 진행된다.

- **`<script src="...">`**: 기본적으로 **파서 차단(parser-blocking)** 리소스다. HTML 파싱을 중단하고, 스크립트를 다운로드하여 실행한 뒤에야 파싱을 재개한다. 이는 스크립트가 DOM을 수정할 수 있기 때문이다.

- **`<script async>`**: 스크립트 다운로드가 HTML 파싱과 병렬로 진행된다. 다운로드가 완료되면 파싱을 멈추고 즉시 실행한다.

- **`<script defer>`**: 스크립트 다운로드가 HTML 파싱과 병렬로 진행된다. 하지만 실행은 HTML 파싱이 모두 완료된 후에 이루어진다. 문서 순서대로 실행이 보장된다.

```
일반 <script>:
HTML 파싱 ====>  (중단)           (재개) ====>
                  다운로드 → 실행

<script async>:
HTML 파싱 ====>  ====>  (중단)  (재개) ====>
                  다운로드  →  실행

<script defer>:
HTML 파싱 ====> ====> ====> ====> (완료)
                다운로드              →  실행
```

#### Preload Scanner

모던 브라우저에는 **Preload Scanner(사전 로드 스캐너)**라는 최적화 메커니즘이 있다. 메인 파서가 스크립트 실행 등으로 멈춰 있을 때에도, 별도의 스캐너가 HTML을 미리 훑어 이후에 필요한 리소스(이미지, CSS, 스크립트 등)의 다운로드를 선제적으로 시작한다. 이 최적화 덕분에 실제 페이지 로딩 속도가 크게 향상된다.

---

### 7단계: CSSOM 생성 및 Render Tree 구축

#### CSSOM (CSS Object Model)

HTML에서 참조하는 CSS 파일이 다운로드되면, 브라우저는 CSS도 HTML과 유사한 과정으로 파싱한다.

```
바이트(Bytes) → 문자(Characters) → 토큰(Tokens) → 노드(Nodes) → CSSOM 트리
```

다음과 같은 CSS가 있다면:

```css
body {
    font-size: 16px;
    color: #333;
}

header {
    background-color: #f0f0f0;
    padding: 20px;
}

h1 {
    font-size: 2em;
    color: #1a1a1a;
}

p {
    line-height: 1.6;
}

.hidden {
    display: none;
}
```

이 CSS는 다음과 같은 CSSOM 트리로 변환된다.

```
CSSOM
 └── body (font-size: 16px, color: #333)
      ├── header (background-color: #f0f0f0, padding: 20px)
      │    └── h1 (font-size: 2em → 32px, color: #1a1a1a)
      ├── p (line-height: 1.6)
      └── .hidden (display: none)
```

CSSOM에서 중요한 점은 CSS의 **캐스케이드(Cascade)** 규칙이 적용된다는 것이다. 부모 요소의 스타일이 자식에게 상속되며, 선택자의 명시도(specificity)에 따라 우선순위가 결정된다.

#### 스타일 계산 (Style Computation)

브라우저는 각 DOM 노드에 어떤 CSS 규칙이 적용되는지 계산한다. 이 과정을 **스타일 계산(Computed Style)**이라 한다.

```
/* 예: h1 요소의 최종 계산된 스타일 */
h1 {
    /* body에서 상속 */
    font-size: 16px → 2em으로 오버라이드 → 최종 32px
    color: #333 → #1a1a1a로 오버라이드 → 최종 #1a1a1a
    
    /* 브라우저 기본 스타일 */
    display: block;
    font-weight: bold;
    margin-top: 0.67em;
    margin-bottom: 0.67em;
}
```

상대적 단위(`em`, `%`, `vh` 등)는 이 단계에서 절대적 단위(`px`)로 변환된다.

#### Render Tree 구축

DOM 트리와 CSSOM 트리가 모두 완성되면, 이 둘을 결합하여 **Render Tree(렌더 트리)**를 만든다.

```
DOM 트리  +  CSSOM 트리  =  Render Tree
```

렌더 트리 구축 시 주의할 점:

- **화면에 보이는 노드만 포함된다.** `<head>`, `<meta>`, `<script>` 같은 비시각적 요소는 제외된다.
- **`display: none`인 요소는 제외된다.** 렌더 트리에 포함되지 않으므로 레이아웃 공간을 차지하지 않는다.
- **`visibility: hidden`인 요소는 포함된다.** 화면에 보이지는 않지만 레이아웃 공간은 차지한다.
- **`::before`, `::after` 같은 가상 요소(pseudo-element)는 포함된다.** DOM에는 없지만 렌더 트리에는 존재한다.

```
Render Tree
 └── body (font-size: 16px, color: #333)
      ├── header (background: #f0f0f0, padding: 20px)
      │    └── h1 (font-size: 32px, color: #1a1a1a)
      │         └── "안녕하세요"
      └── main
           ├── p (line-height: 1.6)
           │    └── "본문 내용입니다."
           └── img (src="photo.jpg")
```

`display: none`이 적용된 `.hidden` 클래스의 요소가 있었다면, 이 단계에서 렌더 트리에 포함되지 않는다.

---

### 8단계: Layout, Paint, Composite

렌더 트리가 완성되었으니, 이제 실제로 화면에 픽셀을 그릴 차례다. 이 과정은 크게 세 단계로 나뉜다.

#### Layout (Reflow)

레이아웃 단계에서는 렌더 트리의 각 노드가 화면에서 **어디에, 어떤 크기로** 배치될지를 계산한다. 뷰포트의 크기를 기준으로 각 요소의 정확한 위치(x, y)와 크기(width, height)가 결정된다.

```
뷰포트: 1920 x 1080

body (x: 0, y: 0, width: 1920, height: auto)
 ├── header (x: 0, y: 0, width: 1920, height: 72)
 │    └── h1 (x: 20, y: 20, width: 1880, height: 32)
 └── main (x: 0, y: 72, width: 1920, height: auto)
      ├── p (x: 0, y: 72, width: 1920, height: 26)
      └── img (x: 0, y: 98, width: 800, height: 600)
```

레이아웃 계산은 비용이 큰 작업이다. 특히 다음과 같은 경우 레이아웃이 다시 발생(**리플로우, Reflow**)한다.

- DOM 요소의 추가/삭제
- 요소의 크기나 위치 변경
- 윈도우 리사이즈
- 폰트 변경
- `offsetHeight`, `scrollTop` 같은 레이아웃 속성 읽기 (강제 리플로우 유발)

```javascript
// 나쁜 예: 강제 리플로우가 반복 발생
for (let i = 0; i < 100; i++) {
    element.style.width = element.offsetWidth + 10 + 'px';
    // offsetWidth 읽기 → 강제 리플로우
    // style.width 쓰기 → 리플로우 예약
    // 루프를 돌 때마다 리플로우가 발생!
}

// 좋은 예: 읽기와 쓰기를 분리
const width = element.offsetWidth; // 한 번만 읽기
for (let i = 0; i < 100; i++) {
    element.style.width = width + (i * 10) + 'px';
}
```

#### Paint (Repaint)

레이아웃이 확정되면, 각 노드를 실제 화면의 픽셀로 변환하는 **페인트** 단계가 진행된다. 이 단계에서는 텍스트, 색상, 그림자, 테두리, 이미지 등 시각적 요소들이 렌더링된다.

브라우저는 페인트를 효율적으로 하기 위해 여러 **레이어(Layer)**로 나누어 각각 독립적으로 그린다.

레이어가 생성되는 조건:
- `position: fixed` 또는 `position: sticky`
- `opacity`가 1 미만
- `transform` 속성 사용
- `will-change` 속성 사용
- `<video>`, `<canvas>` 요소
- CSS 필터 적용

```css
/* 이 요소는 별도의 레이어로 분리된다 */
.animated-box {
    transform: translateZ(0); /* GPU 레이어 생성 트리거 */
    will-change: transform;   /* 브라우저에 변경 예고 */
}
```

페인트 순서도 중요하다. 브라우저는 다음 순서로 그린다.

1. 배경색 (background-color)
2. 배경 이미지 (background-image)
3. 테두리 (border)
4. 자식 요소
5. 아웃라인 (outline)

#### Composite (합성)

여러 레이어가 독립적으로 페인트된 후, 마지막으로 이 레이어들을 올바른 순서대로 합쳐 최종 화면을 완성한다. 이것이 **합성(Compositing)** 단계다.

합성은 주로 **GPU(그래픽 처리 장치)**에서 수행된다. 이것이 중요한 이유는, `transform`이나 `opacity` 같은 속성 변경은 레이아웃이나 페인트를 다시 할 필요 없이 **합성 단계만 다시 수행**하면 되기 때문이다. 그래서 CSS 애니메이션에서 `transform`과 `opacity`를 사용하면 성능이 좋은 것이다.

```
전체 렌더링 파이프라인:

JavaScript → Style → Layout → Paint → Composite
                                          ↑
                    transform/opacity 변경은 여기만 다시 실행
```

```css
/* 성능이 좋은 애니메이션 (Composite만 트리거) */
.good-animation {
    transition: transform 0.3s ease;
}
.good-animation:hover {
    transform: scale(1.1);
}

/* 성능이 나쁜 애니메이션 (Layout부터 다시 트리거) */
.bad-animation {
    transition: width 0.3s ease;
}
.bad-animation:hover {
    width: 200px; /* 레이아웃 재계산 필요! */
}
```

#### 최종 화면 출력

합성이 완료되면, GPU가 최종 결과물을 프레임 버퍼에 기록하고, 모니터의 다음 리프레시 주기에 맞춰 화면에 표시된다. 일반적인 60Hz 모니터의 경우, 매 16.67ms마다 새 프레임이 필요하다. 이 시간 안에 위의 모든 과정이 완료되어야 사용자가 부드러운 화면을 경험할 수 있다.

---

## 결론

브라우저 주소창에 URL 하나를 입력하는 단순한 행위 뒤에는, 놀라울 정도로 정교한 과정들이 숨어 있다. 지금까지 살펴본 전체 과정을 다시 한번 정리해 보자.

```
1. URL 파싱        → 주소를 구성 요소로 분해, HSTS/캐시 확인
2. DNS 조회        → 도메인을 IP 주소로 변환 (계층적 캐시)
3. TCP 연결        → 3-Way Handshake로 신뢰할 수 있는 연결 수립
4. TLS 핸드셰이크   → 암호화 채널 설정 (인증서 검증 + 키 교환)
5. HTTP 요청/응답   → 리소스 요청 및 수신
6. HTML 파싱 & DOM → 바이트를 DOM 트리로 변환
7. CSSOM & 렌더 트리 → 스타일 계산, 보이는 요소만으로 렌더 트리 구축
8. Layout/Paint/Composite → 위치 계산, 픽셀 변환, 레이어 합성
```

이 과정을 이해하면 다음과 같은 실무적 이점을 얻을 수 있다.

- **성능 최적화**: 어느 단계에서 병목이 발생하는지 파악하고, DNS 프리페치(`dns-prefetch`), 프리커넥트(`preconnect`), 리소스 프리로드(`preload`) 등을 적절히 활용할 수 있다.
- **네트워크 디버깅**: 브라우저 개발자 도구의 Network 탭에서 각 단계의 소요 시간을 확인하고, 어디서 지연이 발생하는지 진단할 수 있다.
- **렌더링 최적화**: 불필요한 리플로우를 줄이고, GPU 합성을 활용한 부드러운 애니메이션을 구현할 수 있다.
- **보안 이해**: HTTPS, HSTS, 인증서 검증 등 보안 메커니즘의 동작 원리를 알고 올바르게 적용할 수 있다.

마지막으로, 브라우저 개발자 도구에서 실제로 확인해 볼 것을 권한다. Chrome DevTools의 **Performance** 탭에서는 파싱, 레이아웃, 페인트, 합성 과정을 시각적으로 볼 수 있고, **Network** 탭에서는 DNS, TCP, TLS, TTFB(Time to First Byte) 등의 타이밍 정보를 상세히 확인할 수 있다.

이 한 줄의 URL 입력이 불러오는 연쇄 반응을 이해하는 것, 그것이 웹 개발자로서의 깊이를 한 단계 끌어올리는 출발점이다.

---

**참고 자료**
- [How Browsers Work - Tali Garsiel](https://web.dev/articles/howbrowserswork)
- [Inside look at modern web browser (Chrome) - Mariko Kosaka](https://developer.chrome.com/blog/inside-browser-part1)
- [High Performance Browser Networking - Ilya Grigorik](https://hpbn.co/)
- [MDN Web Docs - How the web works](https://developer.mozilla.org/ko/docs/Learn/Getting_started_with_the_web/How_the_Web_works)
