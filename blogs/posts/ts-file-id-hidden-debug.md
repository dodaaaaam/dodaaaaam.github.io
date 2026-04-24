# 수정하면 다른 파일이 사라진다 — 사라진 `hidden input` 한 줄

## 😵 이상한 증상

신청 폼에 첨부파일을 두 개 받도록 만들어뒀다. 사업자등록증 하나, IR 자료 하나. 각각 `<input type="file">`로 분리돼 있고, Weven의 `bm_file_master` 테이블에서 `file_id` 마스터 ID + `file_key`로 묶이는 구조다.

**insert(신규)**로 작성할 땐 둘 다 잘 저장됐다. 문제는 **update(수정)** 모드였다.

> 사업자등록증만 새 파일로 교체하고 반영 버튼을 누르면, **IR 자료가 사라진다**.  
> IR 자료만 교체하면 반대로 **사업자등록증이 사라진다**.

수정한 쪽은 문제없이 업데이트됐는데, **손대지 않은 다른 파일**이 조용히 날아가는 것. 테이블에서도 기존 레코드를 찾을 수 없었다.

---

## 🤔 처음 떠올린 가설들

### 가설 1: 프레임워크가 `file_delete_key[]`를 몰래 추가하나?

Weven의 `CrudMerge.js`를 뒤져보니, 파일삭제 버튼 클릭 시 `file_delete_key[]` hidden input을 동적으로 추가하는 로직이 있었다. 혹시 내가 **클릭도 안 했는데** 이게 생성되고 있는 건 아닐까?

### 가설 2: `autoFilterByColumn`이 컬럼을 null로 덮어쓰나?

PHP 단에서 `$dataList = DBUtil::autoFilterByColumn($_REQUEST, $TB, ...)`가 파일 관련 컬럼을 null로 덮어쓰는 건 아닐까?

### 가설 3: `uploadFile` 내부에서 뭔가 삭제하나?

서버 쪽 `FileMasterService::uploadFile`이 의도치 않게 다른 파일 레코드를 지우는 건 아닐까?

가설은 많았지만 **추측만으로는 답이 안 나온다**. 실제로 서버에 **무엇이** 도착하는지 봐야 했다.

---

## 🔬 디버깅 1차 시도 — `error_log`

PHP에서 가장 흔한 디버깅 방법. `mergeData()` 함수 안에 잔뜩 찍었다.

```php
error_log('=== mergeData debug ===');
error_log('file_id from request: ' . ($_REQUEST['file_id'] ?? 'NULL'));
error_log('$_FILES keys: ' . implode(',', array_keys($_FILES)));
error_log('business_file error: ' . ($_FILES['business_file']['error'] ?? 'MISSING'));
error_log('ir_file error: ' . ($_FILES['ir_file']['error'] ?? 'MISSING'));
```

그리고 submit. 브라우저 콘솔을 열었다. **아무것도 안 뜬다**. 당연했다. `console.log()`는 브라우저 JS용, `error_log()`는 서버 로그 파일용. 둘은 출력 위치가 완전히 다르다.

서버 로그 파일을 찾아가 `tail -f` 하는 것도 번거로웠다. 더 빠른 방법이 필요했다.

---

## 🎯 디버깅 2차 — 응답 JSON에 debug 필드 넣기

`mergeData`의 반환값에 debug 정보를 함께 담아 응답에 실어보냈다.

```php
$debug = [
    'request_file_id' => $_REQUEST['file_id'] ?? 'NULL',
    'files_keys' => array_keys($_FILES),
    'business_file_error' => $_FILES['business_file']['error'] ?? 'MISSING',
    'ir_file_error' => $_FILES['ir_file']['error'] ?? 'MISSING',
    'file_delete_key' => $_REQUEST['file_delete_key'] ?? 'NONE',
];

return [
    'result' => $queryStr->insert(),
    'debug' => $debug,
];
```

submit하고 F12 → Network → 응답 확인. 나온 데이터:

```json
{
    "debug": {
        "request_file_id": "NULL",
        "files_keys": ["business_file"],
        "business_file_error": 0,
        "ir_file_error": "MISSING",
        "file_delete_key": "NONE"
    }
}
```

순간 머리가 멍해졌다.

- `request_file_id: "NULL"` → **서버에 `file_id` hidden input이 안 왔다**
- `files_keys: ["business_file"]` → `ir_file`이 `$_FILES`에 **아예 없다**
- `file_delete_key: "NONE"` → 삭제 요청은 없다 (프레임워크 버그 가설 ❌)

모든 가설이 빗나갔다. **진짜 문제는 훨씬 더 바닥에 있었다**.

---

## 🕵️ 진짜 원인 추적

### 1차 확인: HTML에 `<input name="file_id">`가 있나?

webadm의 `merge.php`를 grep했다.

```bash
grep 'name="file_id"' webadm/content/program/application/merge.php
```

**검색 결과 0건.** hidden `file_id` input이 HTML에 **아예 존재하지 않았다**.

user-facing(`web/`) 쪽 `merge.php`엔 있었는데 ([L45](../sharedresources/weven_data_real/aimpq5fo1nm4/web/content/program/application/merge.php#L45)):

```html
<input type="hidden" name="file_id" value="{{file_id}}">
```

**webadm 쪽에만 빠져 있었다**. 언젠가 누군가 리팩토링하면서 지웠거나 처음부터 안 넣었거나.

### 서버가 어떻게 반응하는지 재구성

`file_id` hidden이 없으니 submit 시 `$_REQUEST['file_id']`는 없음 → `null`. 서버 `ApplicationService::mergeData`의 파일 처리 로직:

```php
$fileMasterId = null;
if (isset($_REQUEST['file_id'])) $fileMasterId = $_REQUEST['file_id'];
// ↑ file_id가 없으니 $fileMasterId 는 null 유지

$fileMasterId = $this->getFileMasterService()->uploadFile("crud/$TB", $fileMasterId);
$dataList['file_id'] = $fileMasterId;
```

`FileMasterService::uploadFile`의 내부:

```php
if( $fileId == null ){
    $fileId = $this->makeMasterId();   // 💥 완전 새 마스터 ID 생성!
    foreach( $_FILES as $key => $f ){
        // ...
    }
}
```

**`null`이 전달되면 "신규 파일 묶음"이라고 해석해서 완전히 새로운 마스터 ID를 만들어버린다**.

### DB가 어떻게 망가졌는지

수정 전:
```
pgm_application.file_id = 'abc-xyz'

bm_file_master:
  file_seq=100, file_id='abc-xyz', file_key='business_file'   ← 기존 사업자
  file_seq=101, file_id='abc-xyz', file_key='ir_file'         ← 기존 IR
```

사업자만 수정 후 (`file_id` hidden 없이):
```
pgm_application.file_id = 'NEW-ID-zzz'   ← 새 ID로 덮어씀!

bm_file_master:
  file_seq=100, file_id='abc-xyz',    file_key='business_file'  ← 🪦 orphan
  file_seq=101, file_id='abc-xyz',    file_key='ir_file'         ← 🪦 orphan
  file_seq=NEW, file_id='NEW-ID-zzz', file_key='business_file'   ← 새로 insert
```

`pgm_application`이 참조하는 `file_id`가 `NEW-ID-zzz`로 바뀌었으니, 조회할 땐 `NEW-ID-zzz` 아래 파일만 보인다. 거기엔 **내가 방금 올린 사업자만** 있다. **IR은 orphan 레코드로 DB 한구석에 버려진 채 보이지 않는다**.

사용자 입장에서: "내가 건드린 것 말고 다른 파일이 사라졌다."

---

## ✅ 해결 — 한 줄 추가

webadm의 `merge.php`에서 form 시작부 근처, 다른 hidden input들 사이에 한 줄 추가:

```html
<form action="..." method="post" enctype="multipart/form-data">
    <input type="hidden" name="seq" value="{{seq}}">
    <input type="hidden" name="mode" value="<?= $mode ?>" />
    <input type="hidden" name="file_id" value="{{file_id}}">   ← 이 줄 ⭐
    ...
</form>
```

### 수정 후 흐름

수정 모드에서 Weven이 `{{file_id}}`를 실제 값(`'abc-xyz'`)으로 치환 → submit 시 `$_REQUEST['file_id'] = 'abc-xyz'` → 서버 `uploadFile('abc-xyz')`는 **MERGE 분기**로:

```php
} else {
    // 마스터아이디가 있는 경우 MERGE
    foreach( $_FILES as $key => $f ){
        if( $f['error'] == 4 ) continue;   // ← ir_file SKIP
        // business_file만 UPDATE
    }
}
```

`pgm_application.file_id`는 `'abc-xyz'` 그대로 유지, IR 레코드도 건드리지 않는다. **정상 복구.**

---

## 🎓 깨달은 것들

### 1. HTML에 있는 것만 서버에 간다

form submit으로 서버에 전송되는 값은 **HTML form 안에 실제로 존재하는 input의 name/value**. CSS나 JS 변수에만 담긴 값, 서버 세션, URL 파라미터와는 별개다.

hidden input이 **HTML에 박혀 있어야만** 서버가 받을 수 있다. "아 이 값은 서버가 당연히 알고 있겠지"는 금물. 서버는 **요청에 담겨 온 것만** 안다.

### 2. hidden input의 역할은 "보이지 않지만 반드시 전달해야 할 값"

- **레코드 식별자** (`seq`)
- **모드 플래그** (`mode`)
- **묶음 마스터 ID** (`file_id`) ← 이번 주인공
- **CSRF 토큰**
- **JS가 동적으로 추가하는 플래그** (`file_delete_key[]`)

사용자에게 보여줄 필요도, 수정하게 할 필요도 없지만 **서버 로직이 꼭 필요한** 값. 이게 없으면 서버는 맥락(context)을 잃는다.

### 3. `error_log`는 브라우저 콘솔에 안 뜬다

이거 헷갈리기 쉽다. PHP와 JS는 **실행 위치가 다르다**:

| 함수 | 어디서 실행? | 출력은? |
|---|---|---|
| `console.log` (JS) | 브라우저 | F12 Console 탭 |
| `error_log` (PHP) | 서버 | 서버의 로그 파일 |

PHP 디버깅할 때 브라우저 콘솔만 쳐다보면 영원히 안 뜬다. 로그 파일을 찾거나, **응답에 debug 필드를 끼워서** Network 탭으로 보는 게 훨씬 빠르다.

### 4. "응답에 debug 담기" 패턴의 효용

```php
return [
    'result' => $actualResult,
    'debug' => $debugInfo,
];
```

이 방법의 장점:
- ◦ 서버 로그 파일 위치 찾을 필요 없음
- ◦ Network 탭 Response에서 즉시 확인
- ◦ 값이 문자열로 가공돼 보기 좋음
- ◦ 한 요청 = 한 응답 = 정확한 1:1 매칭

작업 끝나고 빼면 되는 임시 디버깅 장치로 훌륭하다. **`error_log`보다 훨씬 인터랙티브하다**.

### 5. 증거가 나오기 전엔 가설일 뿐

처음에 의심했던 세 가설 — `file_delete_key` 자동 추가, `autoFilterByColumn` 덮어쓰기, `uploadFile` 내부 버그 — **전부 빗나갔다**. 실제 원인은 상상 밖이었다. **"HTML에 한 줄이 없었다"**.

응답 JSON을 봤을 때 `request_file_id: "NULL"`이 찍힌 순간 가설들이 한꺼번에 무너지고 진짜 방향이 보였다. **코드를 붙잡고 추측하기 전에 로그 한 줄 찍는 게 10분을 아낀다**.

### 6. 같은 기능의 두 곳이 있으면, 한쪽만 고쳐져 있을 수 있다

이 프로젝트는 user-facing(`web/`)과 admin(`webadm/`) 양쪽에 폼이 있다. 기본적으로 같은 HTML 구조여야 하지만, 이번처럼 **한쪽만 hidden input이 있는** 경우가 있었다.

비슷한 목적의 파일이 여러 군데 있을 땐, 한 쪽을 수정할 때 **"다른 쪽도 같은 구조인가?"** 확인하는 습관이 중요하다. 특히 form 구조처럼 서버 계약(contract)에 영향 주는 부분은 더더욱.

---

## 🔚 마무리

"왜 내가 건드리지도 않은 파일이 사라지지?"로 시작한 디버깅이 **한 줄의 hidden input 누락** 문제로 귀결됐다.

표면적으론 버그지만, 깊이 파보면:

◦ HTML form의 근본 원리 — 담겨 있는 것만 전달됨
◦ hidden input이라는 "보이지 않는 계약"
◦ 파일 묶음을 마스터 ID로 관리하는 프레임워크 설계
◦ 어떤 디버깅 방법이 어떤 상황에 어울리는지

이 모든 게 한꺼번에 부각된 사건이었다. 한 줄 추가로 끝나는 수정이지만, 그 한 줄이 왜 필요한지 **설계의 레이어들을 이해하지 못하면 영영 놓친다**.

프레임워크 위에서 작업할 땐 "이 값이 서버에 어떻게 전달되지?"를 매번 자문해봐야 한다. hidden input이 바로 그 질문의 답이다.
