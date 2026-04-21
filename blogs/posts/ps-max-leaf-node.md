### 문제 보러가기 👉 [리프 노드 수 최대화](https://school.programmers.co.kr/learn/courses/30/lessons/468372)


# 1차 시도 : 트리를 직접 구성하려는 접근 

처음 문제를 보고 가장 먼저 떠올린 건 *트리를 직접 구성*하는 방식이었다.

분배 노드를 배치하면서<br>
각 노드에서 2분기 / 3분기를 선택하고<br>
가능한 트리 구조를 만들어보는 방식

즉, *DFS나 백트래킹*으로 각 노드에서 2 또는 3 선택<br>
→ 트리 생성<br>
→ 리프 개수 계산

이런 식으로 접근하려고 했다.

---

## 문제점

하지만 이 방식은 바로 한계에 부딪혔다.

```Python
dist_limit ≤ 1e9
split_limit ≤ 1e9
```

👉 이 크기에서 *트리를 직접 생성하는 것은 시간적으로 불가능*

또한, 같은 깊이에서는 *자식 수가 같아야* 하고<br>
*분배도 조건*까지 고려해야 해서 **경우의 수가 폭발적으로 증가한다.**

---


## 깨달음

여기서 중요한 깨달음이 있었다.

> “이건 트리를 만드는 문제가 아니다” <br>
> 트리 구조를 그대로 다루는 순간 무조건 터진다.

그래서 관점을 바꿨다.

# 2차 시도 : 상태 압축 + 완전 확장 


## 핵심 아이디어 1 ⟪ 상태를 리프로 압축 ⟫

트리를 직접 보지 않고

```Python
현재 리프 개수 = p
```

이 값만 상태로 보기로 했다.

---


## 핵심 아이디어 2 ⟪ 완전 확장 ⟫

문제 조건: *같은 깊이*에 있는 *분배 노드의 자식 수는 모두 같아야* 한다

👉 즉, 한 층을 확장할 때는 **전부 2분기 or 3분기만 가능**  <br>

> 현재 리프가 p개라면:<br>
> ✔︎ 2분기 → 2p<br>
> ✔︎ 3분기 → 3p

즉 상태는 항상 다음의 형태만 가능하다. 

```Python
p = 2^a * 3^b
```

---


## 핵심 아이디어 3: cost 정의

한 층을 완전히 확장하려면 <br>
"현재 리프 **p개를 전부 분배**해야 한다"

그래서 *cost = 사용한 분배 노드 개수*

```Python
cost[2p] = cost[p] + p  # 현재 단계의 모든 리프 노드 추가 
cost[3p] = cost[p] + p
```


# 완전 확장의 문제점

여기까지는 완전 확장을 계속 진행하는 방식이다.

하지만 여기서 문제가 생긴다. <br>
👉 **언제까지 확장해야 하는가?**

---


## 문제점
> *split_limit* 때문에 곱이 커지면 확장 불가 <br>
> *dist_limit* 때문에 더 이상 분배 못할 수도 있음

👉 즉, **중간에서 멈춰야 하는 경우**가 발생

## 깨달음

“완전 확장만으로는 부족하다”

👉 **마지막에는 일부만 확장**해야 한다


# 2차 시도 (확장): 부분 확장

## 핵심 아이디어 4 ⟪ 부분 확장 ⟫

*현재 리프 p개*가 있을 때 **일부 k개만 선택해서 확장** 가능

### 2분기
리프 1개 → +1 증가<br>
리프 = p + k

### 3분기
리프 1개 → +2 증가<br>
리프 = p + 2k

### k의 최대값

```Python
k = min(p, rem)
rem = dist_limit - cost[p]
```

## split_limit 조건

부분 확장에서 중요한 점:

👉 split_limit은 리프 개수 제한이 아니라 **분배도 제한**

분배도 변화<br>
기존 리프 → p<br>
새 리프 → 2p 또는 3p

👉 따라서 조건:

```Python
2p ≤ split_limit
3p ≤ split_limit
```

# 최종 알고리즘
p = 1에서 시작<br>
**완전 확장**으로 *가능한 모든 p 생성*

각 p마다:<br>
*남은 분배 노드* 계산<br>
*부분 확장* 적용<br>
최대 리프 개수 갱신


# 구현 코드

```Python
from collections import deque

def solution(dist_limit, split_limit):
    dq = deque([1])
    cost = {1: 0}

    # 완전 확장
    while dq:
        p = dq.popleft()
        nc = cost[p] + p

        # 2분기
        np = p * 2
        if np <= split_limit and nc <= dist_limit:
            if np not in cost or cost[np] > nc:
                cost[np] = nc
                dq.append(np)

        # 3분기
        np = p * 3
        if np <= split_limit and nc <= dist_limit:
            if np not in cost or cost[np] > nc:
                cost[np] = nc
                dq.append(np)

    # 부분 확장
    answer = 1

    for p, c in cost.items():
        answer = max(answer, p)

        rem = dist_limit - c
        k = min(p, rem)

        if 2 * p <= split_limit:
            answer = max(answer, p + k)

        if 3 * p <= split_limit:
            answer = max(answer, p + 2 * k)

    return answer
```

# 회고

이 문제에서 가장 중요했던 전환은 하나였다.

> “트리를 직접 만들지 않는다”

핵심 포인트<br>
트리 → **상태(p)**로 압축<br>
*완전 확장* → 구조 *단순화*<br>
*부분 확장* → *최적화*

# 한 줄 정리

> 이 문제는 트리 문제가 아니라<br>
> “상태 그래프 탐색 + 마지막 greedy 확장” 문제다