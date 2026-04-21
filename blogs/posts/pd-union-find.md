# 들어가면서,
코딩 테스트를 풀다 보면
노드들이 *서로 연결되어 있는지, 혹은 같은 그룹에 속하는지*를 빠르게 판단해야 하는 경우가 있다.

이럴 때 자주 사용하는 자료구조가 바로 **Union-Find** 이다.
다른 이름으로는 Disjoint Set Union(DSU) 라고도 부른다.

처음 보면 단순히 부모 배열 하나로 구현되는 것처럼 보이지만,
실제로는 *집합을 빠르게 합치고, 같은 집합인지 빠르게 확인*하는 데 매우 강력한 구조다.

# 핵심 아이디어

Union-Find의 핵심 아이디어는 아주 단순하다.

> **같은 집합에 속한 원소들은 결국 "같은 대표(parent)"를 가진다.**

처음에는 모든 원소가 자기 자신을 부모로 가지며, 각각이 독립된 집합을 이룬다.<br>
이후 Union과 Find 연산을 반복적으로 수행하며, 집합을 합치거나 특정 원소가 어떤 집합에 속해 있는지를 판단한다.


# 기본 연산

처음에는 모든 원소가 *자기 자신을 부모로* 가지며, 각각이 독립된 집합을 이룬다.
```Python
parent = [i for i in range(n + 1)]
```

## Union 연산 

두 노드가 속한 집합을 **하나로 합치는** 연산<br>
find 연산을 통해 각 노드의 *부모를 찾고*, 부모가 *다르다면 하나로 통일*하여 두 집합을 하나로 합친다. 

```Python
def union(a, b):
    rootA = find(a)
    rootB = find(b)
    
    if rootA != rootB:
        parent[rootB] = rootA
```

> 부모를 찾을 때는 반드시 *find 연산을 통해 대표(root)를 확인*해야 한다. 

↪ parent[a] == parent[b] 이런 식으로 비교하면 안 됨 

> 집합을 합칠 때도 항상 *대표 노드로 연결*해야 한다. 

↪ parent[b] = a 이런 식으로 업데이트하면 안 됨 


## Find 연산

특정 노드가 어떤 집합에 속해 있는지, 즉 **대표(parent)를 찾는** 연산

```Python
def find(x):
    if parent[x] == x:
        return x
    return find(parent[x])
```


# Union-Find 최적화 

Union-Find를 수행할 때 위의 기본 연산만 사용하면 느릴 수 있다.
최악의 경우 트리가 한 쪽으로 길게 늘어질 수 있다. 

그래서 Union-Find는 보통 두 가지 최적화를 같이 사용한다. <br>
✔︎ *경로 압축 (Path Comporession)*<br>
✔︎ *Union by Rank / Size*


## 경로 압축(Path Compression)

경로 압축은 find()를 수행할 때
*중간에 거쳐 간 노드들의 부모를 직접 루트로 바꿔버리는 것이다.*

코드는 이렇게 바뀐다.

```Python
parent = [i for i in range(n + 1)]

def find(x):
    if parent[x] != x:
        parent[x] = find(parent[x])
    return parent[x]

def union(a, b):
    rootA = find(a)
    rootB = find(b)

    if rootA != rootB:
        parent[rootB] = rootA
```

*이 코드에서 핵심은 이 줄이다.*

```Python
parent[x] = find(parent[x])
```

원래는 단순히 대표를 찾기만 했는데,
이제는 **찾는 과정에서 만난 노드들이 바로 대표를 가리키게 만든다.**

```Python
# 예를 들어 원래 구조가 다음과 같았다면, 
1 <- 2 <- 3 <- 4 <- 5

# find(5)를 한 번 수행한 뒤에는 거의 이런 식으로 바뀐다.
1 <- 2
1 <- 3
1 <- 4
1 <- 5
```


## Union by Rank / Size

집합을 합칠 때도 아무렇게나 붙이면 트리가 깊어질 수 있다.<br>
그래서 *보통 더 작은 트리를 큰 트리 아래에 붙이는 방식*을 쓴다.

이걸 size 기준으로 구현하면 이런 식이다.

```Python
parent = [i for i in range(n + 1)]
size = [1] * (n + 1)

def find(x):
    if parent[x] != x:
        parent[x] = find(parent[x])
    return parent[x]

def union(a, b):
    rootA = find(a)
    rootB = find(b)

    if rootA == rootB:
        return

    if size[rootA] < size[rootB]:
        rootA, rootB = rootB, rootA   # rootA에 큰 값 넣기 

    parent[rootB] = rootA
    size[rootA] += size[rootB]
```


# 시간복잡도

경로 압축과 Union by Rank/Size를 함께 사용하면<br>
Union-Find의 **시간복잡도는 거의 $O(1)$에 가깝다**고 보면 된다.

엄밀히는 아커만 함수의 역함수 수준이라는데,<br>
코딩 테스트에서는 그냥 이렇게 이해하면 충분하다.

find, union을 매우 빠르게 처리할 수 있다.

그래서 노드 수가 많고 연산 수가 많을 때도 매우 유리하다.


# 실전 사용 

## 언제 사용하는가?

Union-Find는 보통 이런 신호가 보일 때 떠올리면 된다.

✔︎ 두 원소가 같은 그룹인지 확인해야 할 때<br>
✔︎ 연결 관계가 계속 추가될 때<br>
✔︎ 여러 노드가 몇 개의 집합으로 나뉘는지 관리해야 할 때<br>
✔︎ 그래프에서 연결 요소를 다룰 때

#### 👉 즉, **핵심은 “연결 여부” 와 “그룹 관리” 다.**

문제를 읽을 때 이런 표현이 나오면 Union-Find를 의심해볼 수 있다.

- 같은 그룹인가?
- 연결되어 있는가?
- 합쳐라 / 묶어라
- 집합의 개수
- 사이클 판별
- 네트워크 연결
- *Kruskal 알고리즘*

## 언제 사용하면 안 되는가?

Union-Find는 강력하지만 만능은 아니다.

> 이 구조는 *“연결 여부”* 를 다루는 데 강하다.<br>
> *그룹인지 아닌지*를 빠르게 확인하는 데는 좋지만,<br>
> **“구간 계산”이나 “정렬된 순서 처리”에는 적합하지 않다.**

다음과 같은 문제에는 잘 맞지 않는다.

✔︎ 구간의 합/최대/최소를 구하는 문제<br>
✔︎ 순서가 중요한 문제<br>
✔︎ 경로 자체를 복원해야 하는 문제<br>
✔︎ 거리, 비용, 최단 경로를 구하는 문제

# 정리

Union-Find는 **서로소 집합(Disjoint Set) 을 관리하는 자료구조**로,<br>
집합을 합치고 같은 집합인지 빠르게 판별할 수 있다.

핵심은 두 가지다.<br>
✔︎ find : 대표 찾기<br>
✔︎ union : 집합 합치기

그리고 실전에서는 거의 항상 다음 최적화를 같이 쓴다.<br>
✔︎ 경로 압축(Path Compression)<br>
✔︎ Union by Rank / Size

문제를 풀다가 *같은 그룹인지 빠르게 확인해야 한다*는 느낌이 들면<br>
Union-Find를 먼저 떠올려보면 좋다.

# 전체 코드

마지막으로 실전에서 가장 많이 쓰는 형태를 정리하면 다음과 같다.

```Python
parent = [i for i in range(n + 1)]
size = [1] * (n + 1)

def find(x):
    if parent[x] != x:
        parent[x] = find(parent[x])
    return parent[x]

def union(a, b):
    rootA = find(a)
    rootB = find(b)

    if rootA == rootB:
        return

    if size[rootA] < size[rootB]:
        rootA, rootB = rootB, rootA

    parent[rootB] = rootA
    size[rootA] += size[rootB]
```