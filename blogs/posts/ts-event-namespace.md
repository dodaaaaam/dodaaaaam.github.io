# jQuery 이벤트 네임스페이스(.gnbHover) 완전 이해하기 — 실무에서 왜 쓰는가

프론트엔드 코드를 보다 보면 이런 코드 한 번쯤 보게 된다.

```js
$gnbItems.on('mouseenter.gnbHover', function () {
    ...
});
```

처음 보면
👉 “`.gnbHover` 이건 뭐지?”
👉 “왜 그냥 `mouseenter`만 안 쓰지?”

라는 생각이 든다.

이 글에서는
✔️ 이벤트 네임스페이스가 뭔지
✔️ 왜 실무에서 필수인지
✔️ 실제 코드에서 어떤 문제를 해결하는지

까지 한 번에 정리해보자.

---

# 1. 이벤트 네임스페이스란?

jQuery 이벤트는 이렇게 쓸 수 있다.

```js
mouseenter.gnbHover
```

구조는 간단하다.

```
이벤트타입 . 네임스페이스
mouseenter   gnbHover
```

👉 `.gnbHover`는 **개발자가 임의로 붙이는 이름표**다.
(.myEvent, .menu, .foo 뭐든 가능)

---

# 2. 왜 굳이 이름표를 붙일까?

이걸 이해하려면 먼저 문제 상황부터 보자.

---

## ❌ 네임스페이스 없이 이벤트를 쓰면

```js
$el.on('mouseenter', handlerA);
$el.on('mouseenter', handlerB);

$el.off('mouseenter');
```

👉 결과

* handlerA 삭제됨
* handlerB도 같이 삭제됨 😱

👉 즉,
**"누가 등록한 이벤트인지 구분이 안 된다"**

---

## ✅ 네임스페이스를 쓰면

```js
$el.on('mouseenter.gnbHover', handlerA);
$el.on('mouseenter', handlerB);

$el.off('mouseenter.gnbHover');
```

👉 결과

* handlerA만 삭제됨 ✅
* handlerB는 그대로 유지됨

---

## 🔥 핵심 개념

👉 `.gnbHover` =
**"이 이벤트는 내가 붙인 거다" 라는 표시**

---

# 3. 더 강력한 기능: 전체 제거

네임스페이스의 진짜 장점은 여기서 나온다.

```js
$el.off('.gnbHover');
```

👉 의미

* mouseenter
* mouseleave
* click

👉 `.gnbHover` 붙은 모든 이벤트를 한 번에 제거

---

## ✔️ 실무에서 이게 중요한 이유

👉 이벤트를 깔끔하게 “초기화” 가능

---

# 4. 이 코드가 해결하는 실무 문제

이 코드가 쓰인 상황을 보면 힌트가 있다.

👉 “웹 ↔ 모바일 반응형 전환”

---

## 🔥 문제 상황

* 화면 크기 변경
* 이벤트 다시 바인딩
* 코드 여러 번 실행됨

---

### ❌ 네임스페이스 없으면

```js
on('mouseenter')
on('mouseenter')
on('mouseenter')
```

👉 이벤트가 계속 쌓임

👉 마우스 올리면 여러 번 실행됨 💥

---

### ✅ 네임스페이스 있으면

```js
off('.gnbHover');
on('mouseenter.gnbHover');
```

👉 항상 깨끗하게 초기화

👉 중복 실행 없음

---

# 5. 실제 코드 흐름 분석

이제 본 코드가 뭘 하는지 보자.

---

## 1) 이벤트 등록

```js
$gnbItems.on('mouseenter.gnbHover', function () {
```

👉 메뉴에 마우스를 올리면 실행

---

## 2) 모바일이면 실행 안 함

```js
if (!isResponsiveMode()) return;
```

👉 반응형 대응

---

## 3) 현재 메뉴 index 찾기

```js
var index = $(this).index();
```

👉 몇 번째 메뉴인지

---

## 4) 서브메뉴 없으면 종료

```js
if (!hasSubMenu(index)) {
    closeMenu();
    return;
}
```

---

## 5) 기존 메뉴 초기화

```js
hideAllSubMenus();
```

👉 기존 열려있던 메뉴 닫기

---

## 6) 현재 메뉴 활성화

```js
$hoverGnbItems.eq(index).addClass('active');
```

---

## 7) 서브메뉴 위치 계산

```js
var gnbLeft = $(this).offset().left;
var hoverGnbLeft = $hoverGnbWrap.offset().left;
var leftPosition = Math.max(20, gnbLeft - hoverGnbLeft);
```

👉 왜 필요할까?

👉 메뉴 위치에 맞게
**서브메뉴 정렬하려고**

---

## 8) padding으로 위치 조정

```js
$depth2Ul.css({
  'padding-left': leftPosition + 'px'
});
```

---

## 9) 강제 reflow (중요)

```js
void $depth2Ul[0].offsetHeight;
```

👉 브라우저에게

👉 “레이아웃 다시 계산해!”

---

## 왜 필요함?

👉 CSS 적용 → 높이 계산 → 애니메이션
순서 맞추려고

---

## 10) 높이 계산

```js
var menuHeight = $depth2Ul.outerHeight(true);
```

---

## 11) wrapper 높이 맞춤

```js
$hoverMenuWrap.css('height', menuHeight + 'px');
```

👉 자연스러운 애니메이션

---

## 12) 메뉴 표시

```js
$hoverMenuWrap.addClass('show');
```

---

## 13) dim 처리

```js
$hoverMenuDim.show();
```

👉 뒤 배경 어둡게

---

# 6. 이 코드의 핵심 기술 3가지

---

## 💡 1. 이벤트 네임스페이스

👉 이벤트 충돌 방지 + 안전한 제거

---

## 💡 2. 위치 계산 UI

👉 동적으로 메뉴 위치 맞춤

---

## 💡 3. 강제 reflow

👉 애니메이션 타이밍 제어

---

# 7. 실무에서 꼭 기억해야 할 포인트

---

### ✔️ 이벤트는 “관리”해야 한다

```js
off('.myNamespace')
```

👉 내가 등록한 것만 제거

---

### ✔️ 반응형에서는 이벤트 재등록 필수

👉 그래서 네임스페이스 거의 필수

---

### ✔️ jQuery든 React든 동일한 개념

👉 “이벤트 lifecycle 관리”

---

# 🔥 한 줄 정리

👉
**`.gnbHover`는 이벤트를 안전하게 관리하기 위한 이름표이고,
이 코드는 hover 시 드롭다운 메뉴를 위치 계산 + 애니메이션으로 보여주는 로직이다.`**

---

참고용 이벤트 객체가 담고 있는 정보 


속성/메서드	뜻
e.type	이벤트 종류 ("mouseleave", "click" 등)
e.target	이벤트가 실제로 터진 그 요소 (가장 안쪽 요소)
e.currentTarget	핸들러가 걸린 요소 (= this)
e.relatedTarget	마우스가 어디에서/어디로 갔는지 상대편 요소 ← 이게 지금 쓰임
e.clientX, e.clientY	마우스 좌표
e.which, e.keyCode	눌린 키 (keyboard 이벤트)
e.preventDefault()	기본 동작 막기 (링크 이동, form 제출 등)
e.stopPropagation()	부모로 이벤트 버블링 막기