# 처음 시도에서는, 

## 마주친 문제

신청 폼 페이지에서 라디오 버튼을 **재클릭하면 해제**되는 기능을 만들 일이 있었다. <br>
HTML *라디오는 기본적으로 한 번 선택되면 해제되지 않는 게 스펙*이라, JS로 직접 구현해야 한다.

> "라디오를 누르면 선택되고, 같은 걸 다시 누르면 해제되게"

이 정도 요구사항이면 간단할 줄 알았다.

---

## 처음 작성한 코드

각 라디오 그룹에서 **마지막으로 선택된 element**를 기억해두고, 같은 걸 또 누르면 해제하는 방식으로 접근했다.

```js
initRadioToggle: function () {
    var lastChecked = {};  // { "name": 마지막 클릭한 element }

    // 초기 렌더 시 이미 체크된 라디오를 lastChecked에 기록
    $('form[name="crud_merge"] input[type="radio"]:checked').each(function () {
        if (this.name) lastChecked[this.name] = this;
    });

    $(document).on('click', 'form[name="crud_merge"] input[type="radio"]', function () {
        var name = this.name;
        if (!name) return;

        if (lastChecked[name] === this) {
            // 같은 라디오 재클릭 → 해제
            this.checked = false;
            lastChecked[name] = null;
            $(this).trigger('change');
        } else {
            // 다른 라디오 클릭 → 마지막 선택 갱신
            lastChecked[name] = this;
        }
    });
}
```

로직 자체는 깔끔했다. **빈 페이지에서 테스트**해보니 잘 동작했다.

✔︎ Y 클릭 → 선택됨  
✔︎ Y 다시 클릭 → 해제됨 ✅  
✔︎ Y → N → N → 전환되고 해제되고 ✅

만족하고 넘어갔다. 그런데...

# 수정 페이지에서 이상하게 동작

신청 내역을 **조회/수정하는 페이지**에서 테스트하니 미묘한 버그가 생겼다.

> 이미 선택된 라디오를 *한 번 누르면 아무 반응 없고*, **두 번 눌러야** 해제됨

뭐가 달랐을까? <br>
조회 페이지는 *서버에서 이미 저장된 값을 불러와서* 라디오에 **`checked` 속성이 미리 붙어있는 상태**다. 

처음엔 내 코드의 **초기 스캔 루프**가 동작한다고 생각했다.

```js
$('...input[type="radio"]:checked').each(function () {
    if (this.name) lastChecked[this.name] = this;
});
```

> 이게 서버가 렌더한 체크 상태를 잡아내서 `lastChecked`에 미리 넣어주니까, <br>첫 클릭에 바로 해제돼야 맞는데 왜 안 되지?

---

## 범인은 "비동기 렌더 타이밍"

콘솔에 로그 찍어가며 추적해보니 진실이 드러났다.

Weven 프레임워크는 라디오에 `data-wv-check-value="{{...}}"` 라는 **조건부 치환 템플릿**을 쓴다.

```html
<input type="radio" name="is_intellectual_property" value="1"
       data-wv-check-value="{{is_intellectual_property::1|0 ? checked|}}">
```

이 템플릿은 서버에서 즉시 치환되는 게 아니라 *프레임워크 JS가 **나중에 비동기**로 `checked` 상태를 설정*하는 경우가 많았다.

### 즉 내 `init()` 함수가 실행되는 시점엔...

```
1. HTML 렌더: <input data-wv-check-value="{{...}}">   ← 아직 checked 없음

2. appliMerge.init() 실행
   └─ initRadioToggle()
      └─ $(':checked').each(...)  ← 0개 매칭! lastChecked 텅 빔

3. 프레임워크 JS가 data-wv-check-value 처리 → 체크 설정

4. 사용자 화면: 이미 체크된 라디오 표시됨

5. 사용자가 클릭 →
   - lastChecked[name] undefined
   - else 분기 → "첫 클릭은 그냥 등록"

6. 사용자 재클릭 →
   - lastChecked[name] === this → 해제
```

*내 초기 스캔은 허공에 대고 스캔*하고 있었던 거다. <br>
라디오가 체크되기 **전**에 돌아서, **`lastChecked`가 빈 채로 이벤트 핸들러가 실행**됐다. <br>
사용자 입장에선 첫 클릭이 그냥 날아간 셈.


# 발상 전환 « 클릭 순간에 실제 상태를 보자 »

초기 스캔에 의존하는 한, *프레임워크 타이밍과 경쟁(race condition)에서 이길 수 없었다.*<br>
아예 스캔을 없애고, **클릭 순간에 현재 상태를 보는 방법**으로 바꾸기로 했다.

핵심 통찰은 이거다.

> *`click` 이벤트*는 브라우저가 상태를 **바꾼 후**에 발동한다.  
> *`mousedown` 이벤트*는 상태를 **바꾸기 전**에 발동한다.


## 두 이벤트의 순서를 그림으로 보면:

```
사용자가 라디오를 클릭
    ↓
[mousedown]    ← 이때 this.checked는 아직 "클릭 전 상태"
    ↓
브라우저가 체크 상태 변경
    ↓
[click]        ← 이때 this.checked는 "변경 후 상태"
```

그러니까 *mousedown 시점에 `this.checked`를 기록해두면*, click이 터졌을 때 **"사용자가 클릭하기 직전의 진짜 상태"**를 알 수 있다.


# 수정된 코드

```js
initRadioToggle: function () {
    // mousedown: 클릭 직전 상태를 요소에 저장
    $(document).on('mousedown', 'form[name="crud_merge"] input[type="radio"]', function () {
        $(this).data('wasChecked', this.checked);
    });

    // click: 저장한 "직전 상태"로 판단
    $(document).on('click', 'form[name="crud_merge"] input[type="radio"]', function () {
        if ($(this).data('wasChecked')) {
            // 직전에 이미 체크였다 = 재클릭 = 해제해야 함
            this.checked = false;
            $(this).trigger('change');
        }
        // 다음 클릭을 위해 초기화
        $(this).data('wasChecked', false);
    });
}
```

# 시나리오 추적

## 조회 모드 : 이미 체크된 라디오 첫 클릭

```
1. [mousedown on Y]
   this.checked = true (이미 체크돼있으니)
   → data('wasChecked', true) 저장

2. 브라우저: 이미 체크라 상태 변화 없음

3. [click on Y]
   data('wasChecked') === true ← 조건 통과!
   → this.checked = false 해제
   ✅ 첫 클릭에 바로 해제 성공!
```

## 체크된 Y 상태에서 N 클릭 (라디오 전환)

```
1. [mousedown on N]
   this.checked = false (N은 아직 체크 안 됐으니)
   → N의 data('wasChecked', false) 저장

2. 브라우저: Y 해제, N 체크

3. [click on N]
   data('wasChecked') === false ← 조건 불통과
   → 해제 안 함
   ✅ 정상 라디오 동작 유지
```

## 방금 체크한 N을 재클릭 (해제)

```
1. [mousedown on N]
   this.checked = true (방금 체크했으니)
   → data('wasChecked', true) 저장

3. [click on N]
   data('wasChecked') === true ← 조건 통과
   → 해제
   ✅
```

모든 시나리오에서 기대대로 동작. 초기 스캔이 필요 없으니 **타이밍 문제 자체가 사라졌다**.


# 깨달은 것들

## "초기화 시점에 상태 스캔"은 프레임워크와 경쟁한다.

내 JS가 깔끔하게 init해도, 프레임워크가 *나중에 DOM을 만지면 스캔 결과는 무의미*해진다. <br>
특히 Weven 같은 템플릿 치환 프레임워크, React/Vue 같은 선언적 라이브러리, 모두 **"초기 렌더 직후 상태"를 믿으면 위험**하다.

### 대안
✔︎ 상태를 *"지금 이 순간" 읽기* (event-driven)<br>
✔︎ *MutationObserver*로 변화 감지<br>
✔︎ `setTimeout(0)` 같은 지연 (불확실한 방법이라 비추)

---

## 이벤트의 "전/후 타이밍"은 강력한 힌트다.

`click`은 사용자 관점에선 한 번의 동작이지만, *브라우저 내부에선 여러 이벤트가 순서대로 발동*된다.

```
mousedown → [state change] → mouseup → change → click
```

상태가 바뀌기 **전**의 값이 필요하면 *`mousedown`이나 `keydown`을*, <br>
**후**의 값이 필요하면 *`click`이나 `change`를 쓰면 된다.* <br>

이 순서를 알면 *"같은 동작인데 시점별로 다른 값을 봐야 할 때"* 답이 나온다.

---

## 전역 상태 맵보다 요소별 `.data()`가 깔끔하다.

처음엔 `lastChecked = {}`라는 전역 맵에 그룹별 상태를 저장했다. 

동작은 되지만:

✔︎ 라디오 *그룹 이름을 키로 관리*해야 함<br>
✔︎ 디버깅할 때 *맵 전체*를 봐야 함<br>
✔︎ *DOM과 JS 상태가 따로 놀아서* 일관성 깨지기 쉬움

mousedown 방식은 **각 요소에 `.data('wasChecked', ...)`로 상태를 붙임**. <br>
DOM 요소와 상태가 한 덩어리라 추적이 쉽고, 라디오 그룹이 몇 개든 자동 대응된다.

---

## 엣지케이스도 생각하면 더 견고해진다.

마우스뿐 아니라 **키보드로 Space**를 눌러 라디오를 조작할 수도 있다. <br>
이 경우 `mousedown`은 안 뜬다. 완벽하게 하려면 `keydown`도 함께 다뤄야 한다.

```js
$(document).on('mousedown keydown', '...input[type="radio"]', function (e) {
    if (e.type === 'keydown' && e.which !== 32) return;  // Space만
    $(this).data('wasChecked', this.checked);
});
```

일단은 마우스 사용이 대부분이라 mousedown만으로 두었지만, 접근성까지 챙기려면 이런 것도 고려해야 한다.



# 마무리

처음엔 "코드는 잘 짠 것 같은데 왜 안 되지?"였다. <br>
디버깅하면서 알게 된 건 **내 코드가 틀린 게 아니라, 내가 가정한 실행 순서가 틀렸다**는 사실이었다.

프레임워크 위에서 뭔가를 만들 땐:

> "내 코드가 돌아가는 시점에, *DOM이 내가 기대한 상태*인가?"

이 질문을 항상 던져야 한다. 

*초기화 시점에 DOM 상태를 캡처*해서 쓰는 코드는 **거의 언제나 잠재적인 타이밍 버그**를 품고 있다. <br>
가능하면 **"지금 이 순간" 상태를 보는 방식**으로 설계하면 좀 더 견고한 코드가 된다.

작은 기능 하나 붙이면서 얻은 교훈치곤 꽤 쓸 만했다.
