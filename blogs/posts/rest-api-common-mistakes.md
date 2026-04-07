## 서론

REST API는 현대 웹 개발에서 가장 보편적인 통신 방식입니다. 프론트엔드와 백엔드를 분리하는 아키텍처가 표준이 된 지금, API 설계 능력은 백엔드 개발자에게 필수 역량이 되었습니다.

하지만 실제 프로젝트를 진행하다 보면, REST의 기본 원칙을 무시하거나 잘못 이해한 채로 API를 설계하는 경우를 자주 목격합니다. 처음에는 별문제 없어 보여도, 프로젝트 규모가 커지고 협업하는 개발자가 늘어나면 일관성 없는 API는 유지보수의 악몽이 됩니다.

이 글에서는 REST API를 설계할 때 흔히 저지르는 5가지 실수를 짚어보고, 각각에 대한 올바른 설계 방법을 실제 코드 예시와 함께 살펴보겠습니다. 주니어 개발자뿐 아니라 경력 개발자도 무심코 범하기 쉬운 실수들이니, 한번 점검해 보시길 바랍니다.

## 실수 1: URL에 동사를 사용하는 것

### 잘못된 예

REST API에서 가장 흔하게 볼 수 있는 실수가 바로 URL에 동사를 포함시키는 것입니다.

```
POST   /api/getUsers
POST   /api/createUser
POST   /api/deleteUser?id=1
GET    /api/fetchOrderList
POST   /api/updateProduct
```

Spring Boot 컨트롤러로 보면 이런 형태입니다.

```java
@RestController
@RequestMapping("/api")
public class UserController {

    // 나쁜 예: URL 자체에 행위(동사)가 포함됨
    @PostMapping("/getUsers")
    public List<User> getUsers() {
        return userService.findAll();
    }

    @PostMapping("/createUser")
    public User createUser(@RequestBody UserDto dto) {
        return userService.create(dto);
    }

    @PostMapping("/deleteUser")
    public void deleteUser(@RequestParam Long id) {
        userService.delete(id);
    }
}
```

이 방식은 RPC(Remote Procedure Call) 스타일에 가깝습니다. 함수 이름을 URL에 그대로 노출하는 셈이죠. REST는 **자원(Resource)** 중심의 설계인데, 동사를 쓰면 자원이 아니라 **행위**가 중심이 됩니다.

### 올바른 예

REST에서 행위는 HTTP 메서드가 표현합니다. URL은 자원(명사)만 나타내야 합니다.

```
GET    /api/users          → 사용자 목록 조회
POST   /api/users          → 사용자 생성
GET    /api/users/1        → 특정 사용자 조회
PUT    /api/users/1        → 특정 사용자 수정
DELETE /api/users/1        → 특정 사용자 삭제
```

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping
    public List<User> getUsers() {
        return userService.findAll();
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody UserDto dto) {
        User created = userService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.findById(id);
    }

    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody UserDto dto) {
        return userService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

URL만 봐도 어떤 자원을 다루는지 명확하고, HTTP 메서드로 어떤 동작을 수행하는지 직관적으로 알 수 있습니다. 복수형 명사(`users`)를 사용하는 것이 관례입니다.

### 예외 상황

모든 행위가 CRUD로 깔끔하게 떨어지지는 않습니다. 예를 들어 "검색"이나 "로그인" 같은 경우는 어떻게 할까요?

```
POST /api/auth/login           → 로그인 (자원이라기보단 행위)
POST /api/users/1/activate     → 사용자 활성화
GET  /api/users/search?q=kim   → 사용자 검색
```

이런 경우에는 동사를 제한적으로 사용하되, 가능하면 자원 기반 구조 안에서 해결하는 것이 좋습니다. 완벽한 REST보다 **실용성과 일관성**이 더 중요합니다.

---

## 실수 2: HTTP 메서드를 잘못 사용하는 것

### 잘못된 예

모든 요청을 `POST`로 처리하는 API를 본 적이 있으신가요? 놀랍도록 흔한 패턴입니다.

```
POST /api/users          → 사용자 조회 (???)
POST /api/users/delete   → 사용자 삭제 (???)
POST /api/users/update   → 사용자 수정 (???)
```

```java
// 나쁜 예: 모든 것을 POST로 처리
@RestController
@RequestMapping("/api/users")
public class UserController {

    @PostMapping
    public List<User> getUsers() {
        // POST인데 조회를 한다?
        return userService.findAll();
    }

    @PostMapping("/delete")
    public void deleteUser(@RequestBody Map<String, Long> body) {
        // POST로 삭제를 한다?
        userService.delete(body.get("id"));
    }

    @PostMapping("/update")
    public User updateUser(@RequestBody UserDto dto) {
        // POST로 수정을 한다?
        return userService.update(dto.getId(), dto);
    }
}
```

이렇게 하면 HTTP 메서드가 가진 의미(시맨틱)가 완전히 사라집니다. 캐싱, 멱등성, 안전성 같은 HTTP의 강력한 특성을 전혀 활용할 수 없게 됩니다.

### HTTP 메서드의 올바른 의미

| 메서드 | 용도 | 안전성 | 멱등성 |
|--------|------|--------|--------|
| GET | 자원 조회 | O | O |
| POST | 자원 생성 | X | X |
| PUT | 자원 전체 수정 | X | O |
| PATCH | 자원 부분 수정 | X | O |
| DELETE | 자원 삭제 | X | O |

**안전성(Safe):** 서버의 상태를 변경하지 않는다는 뜻입니다. GET 요청은 몇 번을 보내든 서버 데이터가 바뀌면 안 됩니다.

**멱등성(Idempotent):** 같은 요청을 여러 번 보내도 결과가 동일하다는 뜻입니다. PUT으로 이름을 "홍길동"으로 바꾸는 요청을 10번 보내도 결과는 같습니다. 반면 POST로 주문을 생성하면 10번 보내면 10개의 주문이 생깁니다.

### 올바른 예

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    // GET: 조회 - 안전하고 멱등
    @GetMapping
    public List<User> getUsers() {
        return userService.findAll();
    }

    // POST: 생성 - 안전하지도 멱등하지도 않음
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody UserDto dto) {
        User user = userService.create(dto);
        URI location = URI.create("/api/users/" + user.getId());
        return ResponseEntity.created(location).body(user);
    }

    // PUT: 전체 수정 - 멱등
    @PutMapping("/{id}")
    public User replaceUser(@PathVariable Long id, @RequestBody UserDto dto) {
        return userService.replace(id, dto);
    }

    // PATCH: 부분 수정 - 멱등
    @PatchMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        return userService.partialUpdate(id, updates);
    }

    // DELETE: 삭제 - 멱등
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

특히 `PUT`과 `PATCH`의 차이를 이해하는 것이 중요합니다. `PUT`은 자원을 통째로 교체하는 것이고, `PATCH`는 일부 필드만 변경하는 것입니다. 사용자의 이메일만 바꾸고 싶다면 `PATCH`가 적절합니다.

```
PUT /api/users/1
{
    "name": "홍길동",
    "email": "new@example.com",
    "phone": "010-1234-5678"
}

PATCH /api/users/1
{
    "email": "new@example.com"
}
```

---

## 실수 3: HTTP 상태 코드를 무시하는 것

### 잘못된 예

어떤 결과든 무조건 `200 OK`를 반환하고, 성공/실패 여부를 응답 본문에 담는 패턴입니다.

```java
// 나쁜 예: 항상 200 OK 반환
@PostMapping("/users")
public Map<String, Object> createUser(@RequestBody UserDto dto) {
    Map<String, Object> response = new HashMap<>();
    try {
        User user = userService.create(dto);
        response.put("success", true);
        response.put("data", user);
        response.put("code", 0);
    } catch (DuplicateEmailException e) {
        response.put("success", false);
        response.put("message", "이미 존재하는 이메일입니다.");
        response.put("code", -1);
    } catch (Exception e) {
        response.put("success", false);
        response.put("message", "서버 에러가 발생했습니다.");
        response.put("code", -999);
    }
    return response;  // 항상 HTTP 200
}
```

클라이언트 입장에서 이런 API는 악몽입니다. HTTP 상태 코드를 보고 분기할 수 없으니, 매번 응답 본문을 파싱해서 `success` 필드를 확인하고, 커스텀 `code` 값의 의미를 문서에서 찾아봐야 합니다.

### 자주 사용하는 HTTP 상태 코드

```
2xx 성공
  200 OK              → 일반적인 성공
  201 Created         → 자원 생성 성공
  204 No Content      → 성공했지만 반환할 내용 없음 (DELETE 등)

4xx 클라이언트 에러
  400 Bad Request     → 잘못된 요청 (유효성 검사 실패 등)
  401 Unauthorized    → 인증 필요
  403 Forbidden       → 권한 없음
  404 Not Found       → 자원을 찾을 수 없음
  409 Conflict        → 충돌 (중복 데이터 등)
  422 Unprocessable Entity → 요청 형식은 맞지만 처리 불가

5xx 서버 에러
  500 Internal Server Error → 서버 내부 에러
  502 Bad Gateway     → 게이트웨이/프록시 에러
  503 Service Unavailable → 서비스 이용 불가
```

### 올바른 예

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody @Valid UserDto dto) {
        User user = userService.create(dto);
        URI location = URI.create("/api/users/" + user.getId());
        // 201 Created + Location 헤더
        return ResponseEntity.created(location).body(user);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return userService.findById(id)
            .map(ResponseEntity::ok)                          // 200 OK
            .orElseThrow(() -> new UserNotFoundException(id)); // 404
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();  // 204 No Content
    }
}
```

Spring Boot에서는 `@ExceptionHandler`나 `@ControllerAdvice`를 활용하면 예외를 상태 코드로 깔끔하게 매핑할 수 있습니다.

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(UserNotFoundException e) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            e.getMessage(),
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ErrorResponse> handleConflict(DuplicateEmailException e) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.CONFLICT.value(),
            e.getMessage(),
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
            .collect(Collectors.joining(", "));

        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            message,
            LocalDateTime.now()
        );
        return ResponseEntity.badRequest().body(error);
    }
}
```

이렇게 하면 클라이언트는 HTTP 상태 코드만으로도 요청의 결과를 즉시 판단할 수 있고, 에러 처리 로직도 훨씬 깔끔해집니다.

---

## 실수 4: 일관성 없는 응답 구조

### 잘못된 예

같은 API 서버에서 엔드포인트마다 응답 형식이 다른 경우입니다.

```json
// GET /api/users
{
    "users": [
        { "id": 1, "name": "홍길동" }
    ],
    "total": 1
}

// GET /api/products
[
    { "product_id": 1, "productName": "노트북" }
]

// GET /api/orders/1
{
    "success": true,
    "result": {
        "order_id": 1,
        "orderDate": "2026-03-22"
    }
}

// POST /api/users (에러)
{
    "error": true,
    "msg": "이메일이 중복됩니다."
}

// POST /api/products (에러)
{
    "status": "fail",
    "error_message": "상품명은 필수입니다.",
    "error_code": 1001
}
```

문제점을 나열해 보겠습니다.

1. **네이밍 컨벤션 불일치:** `product_id`(snake_case)와 `productName`(camelCase)이 한 객체에 혼재합니다.
2. **응답 감싸기(wrapping) 방식이 제각각:** 어떤 곳은 `users` 키로, 어떤 곳은 `result` 키로, 어떤 곳은 배열을 그대로 반환합니다.
3. **에러 응답 구조 불일치:** `msg`, `error_message` 등 에러 메시지 필드명이 다릅니다.
4. **페이지네이션 정보 유무:** 어떤 목록은 `total`이 있고, 어떤 목록은 없습니다.

### 올바른 예

팀 내에서 응답 구조의 표준을 정하고, 모든 엔드포인트에서 동일하게 적용해야 합니다.

**성공 응답 (단건)**

```json
// GET /api/users/1
{
    "status": 200,
    "data": {
        "id": 1,
        "name": "홍길동",
        "email": "hong@example.com",
        "createdAt": "2026-03-22T10:30:00"
    }
}
```

**성공 응답 (목록 + 페이지네이션)**

```json
// GET /api/users?page=0&size=10
{
    "status": 200,
    "data": [
        { "id": 1, "name": "홍길동", "email": "hong@example.com" },
        { "id": 2, "name": "김철수", "email": "kim@example.com" }
    ],
    "pagination": {
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
    }
}
```

**에러 응답**

```json
// POST /api/users (유효성 검사 실패)
{
    "status": 400,
    "error": {
        "code": "VALIDATION_FAILED",
        "message": "요청 데이터가 유효하지 않습니다.",
        "details": [
            { "field": "email", "message": "올바른 이메일 형식이 아닙니다." },
            { "field": "name", "message": "이름은 필수 항목입니다." }
        ]
    },
    "timestamp": "2026-03-22T10:30:00"
}
```

Spring Boot에서 이를 구현하면 다음과 같습니다.

```java
// 공통 응답 래퍼 클래스
@Getter
@Builder
public class ApiResponse<T> {
    private final int status;
    private final T data;
    private final PaginationInfo pagination;
    private final ErrorInfo error;
    private final LocalDateTime timestamp;

    // 성공 응답 (단건)
    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
            .status(HttpStatus.OK.value())
            .data(data)
            .timestamp(LocalDateTime.now())
            .build();
    }

    // 성공 응답 (생성)
    public static <T> ApiResponse<T> created(T data) {
        return ApiResponse.<T>builder()
            .status(HttpStatus.CREATED.value())
            .data(data)
            .timestamp(LocalDateTime.now())
            .build();
    }

    // 성공 응답 (목록 + 페이지네이션)
    public static <T> ApiResponse<List<T>> okList(Page<T> page) {
        PaginationInfo pagination = PaginationInfo.builder()
            .page(page.getNumber())
            .size(page.getSize())
            .totalElements(page.getTotalElements())
            .totalPages(page.getTotalPages())
            .build();

        return ApiResponse.<List<T>>builder()
            .status(HttpStatus.OK.value())
            .data(page.getContent())
            .pagination(pagination)
            .timestamp(LocalDateTime.now())
            .build();
    }
}
```

```java
// 컨트롤러에서 사용
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserDto>>> getUsers(Pageable pageable) {
        Page<UserDto> users = userService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.okList(users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getUser(@PathVariable Long id) {
        UserDto user = userService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserDto>> createUser(@RequestBody @Valid UserDto dto) {
        UserDto created = userService.create(dto);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.created(created));
    }
}
```

핵심은 **모든 응답이 같은 구조를 따르는 것**입니다. 프론트엔드 개발자가 새로운 API를 연동할 때, 응답 구조를 매번 확인하지 않아도 예측할 수 있어야 합니다. 네이밍 컨벤션도 camelCase든 snake_case든 하나로 통일해야 합니다.

---

## 실수 5: API 버전 관리 미흡

### 잘못된 예

버전 관리 없이 API를 운영하다가, 기존 응답 구조를 갑자기 변경하는 경우입니다.

```
// 원래 API 응답
GET /api/users/1
{
    "name": "홍길동",
    "phone": "010-1234-5678"
}

// 어느 날 갑자기 변경된 응답 (필드명 변경 + 구조 변경)
GET /api/users/1
{
    "fullName": "홍길동",
    "contact": {
        "phone": "010-1234-5678",
        "email": "hong@example.com"
    }
}
```

이런 변경이 사전 고지 없이 적용되면, 기존 클라이언트(모바일 앱, 다른 서비스 등)가 일제히 깨져 버립니다. 특히 모바일 앱은 사용자가 업데이트하기 전까지 구버전이 계속 동작하므로, 서버 API를 함부로 변경할 수 없습니다.

### 올바른 예: URI 경로 방식

가장 직관적이고 널리 사용되는 방법입니다.

```
GET /api/v1/users/1
GET /api/v2/users/1
```

```java
// v1 컨트롤러
@RestController
@RequestMapping("/api/v1/users")
public class UserControllerV1 {

    @GetMapping("/{id}")
    public ResponseEntity<UserDtoV1> getUser(@PathVariable Long id) {
        // v1 형식의 응답 반환
        UserDtoV1 user = userService.findByIdAsV1(id);
        return ResponseEntity.ok(user);
    }
}

// v2 컨트롤러
@RestController
@RequestMapping("/api/v2/users")
public class UserControllerV2 {

    @GetMapping("/{id}")
    public ResponseEntity<UserDtoV2> getUser(@PathVariable Long id) {
        // v2 형식의 응답 반환 (구조 변경)
        UserDtoV2 user = userService.findByIdAsV2(id);
        return ResponseEntity.ok(user);
    }
}
```

### 올바른 예: 요청 헤더 방식

URL을 깔끔하게 유지하고 싶다면 커스텀 헤더나 `Accept` 헤더를 활용할 수 있습니다.

```
GET /api/users/1
Accept: application/vnd.myapp.v1+json

GET /api/users/1
Accept: application/vnd.myapp.v2+json
```

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping(value = "/{id}", produces = "application/vnd.myapp.v1+json")
    public ResponseEntity<UserDtoV1> getUserV1(@PathVariable Long id) {
        UserDtoV1 user = userService.findByIdAsV1(id);
        return ResponseEntity.ok(user);
    }

    @GetMapping(value = "/{id}", produces = "application/vnd.myapp.v2+json")
    public ResponseEntity<UserDtoV2> getUserV2(@PathVariable Long id) {
        UserDtoV2 user = userService.findByIdAsV2(id);
        return ResponseEntity.ok(user);
    }
}
```

### 버전 관리 전략 비교

| 방식 | 장점 | 단점 |
|------|------|------|
| URI 경로 (`/v1/`) | 직관적, 구현 간단, 캐싱 용이 | URL이 길어짐 |
| 쿼리 파라미터 (`?version=1`) | 구현 간단 | 캐싱 어려움, 선택적이라 누락 가능 |
| 요청 헤더 | URL 깔끔, RESTful | 테스트/디버깅 불편 |
| 커스텀 헤더 (`X-API-Version`) | 유연함 | 비표준, 발견성 낮음 |

실무에서는 **URI 경로 방식**이 가장 많이 쓰입니다. 브라우저에서 바로 테스트할 수 있고, 문서화하기도 쉽고, 어떤 버전을 호출하는지 한눈에 보이기 때문입니다.

### 버전 관리 시 주의할 점

```
1. 구버전을 즉시 제거하지 마세요.
   → Deprecated 표시 후 충분한 유예 기간(최소 3~6개월)을 두세요.

2. 변경 사항을 문서화하세요.
   → CHANGELOG를 관리하고, Breaking Change가 있을 때 클라이언트에게 알리세요.

3. 사소한 변경에는 새 버전을 만들지 마세요.
   → 필드 추가처럼 하위 호환되는 변경은 버전 업 없이 처리할 수 있습니다.

4. 최대 2~3개 버전만 동시에 유지하세요.
   → 너무 많은 버전을 운영하면 유지보수 비용이 기하급수적으로 늘어납니다.
```

---

## 결론

지금까지 REST API 설계 시 흔히 하는 5가지 실수를 살펴봤습니다. 정리하면 다음과 같습니다.

| 실수 | 해결 원칙 |
|------|-----------|
| URL에 동사 사용 | URL은 자원(명사), 행위는 HTTP 메서드로 |
| HTTP 메서드 잘못 사용 | GET/POST/PUT/PATCH/DELETE의 의미를 지킬 것 |
| 상태 코드 무시 | 상황에 맞는 HTTP 상태 코드를 반환할 것 |
| 일관성 없는 응답 구조 | 공통 응답 래퍼를 만들어 팀 전체가 사용할 것 |
| 버전 관리 미흡 | URI 경로 등으로 버전 관리를 처음부터 도입할 것 |

사실 이 원칙들은 하나하나가 어려운 것이 아닙니다. 문제는 프로젝트 초기에 이런 규칙을 정하지 않고 시작하면, 나중에 수정하기가 점점 어려워진다는 것입니다. API는 한번 공개되면 클라이언트가 의존하게 되므로, 변경 비용이 매우 높습니다.

새 프로젝트를 시작한다면, 코드를 작성하기 전에 API 설계 가이드라인부터 팀원과 합의하세요. Swagger(OpenAPI)나 Spring REST Docs 같은 도구로 API 문서를 자동화하는 것도 강력히 추천합니다. 잘 설계된 API는 프론트엔드 개발자, 모바일 개발자, 그리고 미래의 자기 자신에게 주는 최고의 선물입니다.

---

### 참고 자료

- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines)
- [RESTful API 설계 가이드 - Best Practices](https://restfulapi.net/)
- [HTTP Status Codes - MDN Web Docs](https://developer.mozilla.org/ko/docs/Web/HTTP/Status)
- [Spring Boot REST API Best Practices](https://spring.io/guides)
