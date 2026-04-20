# 서론

2024~2025년을 거치며 "프롬프트 엔지니어링"이라는 용어가 개발자 사이에서 일상어가 되었다. 하지만 실무에서 LLM을 활용한 시스템을 구축하다 보면, 단순히 프롬프트를 잘 쓰는 것만으로는 한계가 분명하다는 걸 느끼게 된다.

최근 주목받고 있는 두 가지 개념이 있다.

- **Context Engineering** — 모델이 올바른 답을 내릴 수 있도록 *맥락 자체를 설계*하는 것
- **Harness Engineering** — 모델을 *시스템의 부품으로 통합*하고, 입출력을 제어하는 것

이 글에서는 프롬프트 엔지니어링과의 차이점을 시작으로, 두 개념이 왜 등장했고, 실제로 어떻게 적용할 수 있는지 정리해본다.

# 프롬프트 엔지니어링의 한계

프롬프트 엔지니어링은 **모델에게 보내는 텍스트를 최적화**하는 데 초점을 둔다.

```
"너는 시니어 개발자야. 다음 코드를 리뷰해줘. 
버그가 있으면 알려주고, 개선점을 제안해."
```

이 방식은 단발성 질문에는 효과적이다. 하지만 실제 프로덕트에서는 이런 상황이 생긴다:

- 사용자마다 다른 코드베이스, 다른 컨벤션
- 이전 대화의 맥락을 유지해야 하는 멀티턴 상호작용
- 외부 API 결과, DB 조회 결과를 실시간으로 모델에 제공해야 하는 상황
- 모델의 출력이 다음 시스템 동작의 입력이 되는 파이프라인

프롬프트 한 줄을 다듬는 것으로는 이 복잡성을 감당할 수 없다. 여기서 Context Engineering이 시작된다.

# Context Engineering이란

> 모델이 올바른 판단을 내릴 수 있도록, **입력으로 들어가는 전체 맥락을 체계적으로 설계**하는 것

프롬프트 엔지니어링이 "무엇을 말할까"에 집중한다면, Context Engineering은 "모델이 판단에 필요한 **모든 정보를 어떻게 구성할까**"에 집중한다.

## 맥락의 구성 요소

모델에게 전달되는 맥락은 단순한 프롬프트가 아니라, 여러 레이어로 구성된다:

| 레이어 | 설명 | 예시 |
| --- | --- | --- |
| System Prompt | 모델의 역할과 행동 규칙 정의 | "너는 코드 리뷰어야. 보안 취약점에 집중해" |
| User Context | 사용자별 개인화 정보 | 사용하는 언어, 프레임워크, 코딩 스타일 |
| Task Context | 현재 작업에 필요한 구체적 정보 | 수정된 코드 diff, 관련 파일, 이슈 설명 |
| Retrieved Context | 외부에서 검색/조회한 정보 | RAG로 가져온 문서, DB 조회 결과 |
| Conversation History | 이전 대화 기록 | 멀티턴 대화에서의 이전 질의/응답 |

## 핵심 원칙

**1. 필요한 정보만, 적절한 시점에**

컨텍스트 윈도우는 무한하지 않다. 관련 없는 정보를 잔뜩 넣으면 오히려 성능이 떨어진다. "이 정보가 지금 이 판단에 정말 필요한가?"를 기준으로 필터링해야 한다.

```javascript
// Bad: 모든 파일을 컨텍스트에 넣기
const allFiles = await getAllProjectFiles();
const response = await llm.chat({
  context: allFiles.join('\n'),  // 토큰 폭발
  question: userQuery
});

// Good: 관련 파일만 검색해서 넣기
const relevantFiles = await searchRelevantFiles(userQuery);
const response = await llm.chat({
  context: relevantFiles.map(f => f.content).join('\n'),
  question: userQuery
});
```

**2. 구조화된 맥락 제공**

같은 정보라도 구조화 방식에 따라 모델의 이해도가 달라진다.

```
<!-- Bad: 비구조화 -->
파일은 src/api.js이고 함수 이름은 fetchUser이고 에러가 나는데 
TypeError라고 뜨고 line 42에서 발생합니다

<!-- Good: 구조화 -->
## 에러 정보
- 파일: src/api.js
- 함수: fetchUser()  
- 에러: TypeError
- 위치: line 42
- 에러 메시지: Cannot read property 'id' of undefined
```

**3. 맥락의 신선도 관리**

오래된 정보는 모델을 오도할 수 있다. 특히 코드베이스처럼 빠르게 변하는 데이터는 실시간 조회가 필요하다.

```javascript
// 캐시된 정보 사용 시 유효 기간 확인
async function getContextForFile(filePath) {
  const cached = cache.get(filePath);
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached.content;
  }
  const fresh = await readFile(filePath);
  cache.set(filePath, { content: fresh, timestamp: Date.now() });
  return fresh;
}
```

# Harness Engineering이란

> AI 모델을 **시스템의 한 컴포넌트로 통합**하고, 입력/출력/오류 처리/워크플로우를 설계하는 것

Context Engineering이 "모델에게 뭘 보여줄까"라면, Harness Engineering은 "모델을 **어떻게 시스템에 끼워넣을까**"다.

## 모델은 함수다

Harness Engineering의 핵심 사고방식은 LLM을 하나의 **함수**로 보는 것이다:

```
f(context) → output
```

이 함수의 입력을 구성하고, 출력을 파싱하고, 오류를 처리하고, 다른 시스템과 연결하는 것이 Harness의 역할이다.

```javascript
// LLM을 시스템의 한 단계로 활용하는 파이프라인
async function reviewPullRequest(prData) {
  // 1. 맥락 구성 (Context Engineering)
  const diff = await fetchPRDiff(prData.id);
  const guidelines = await loadTeamGuidelines();
  const relatedIssues = await searchRelatedIssues(prData.title);
  
  // 2. 모델 호출 (Harness)
  const review = await llm.chat({
    system: guidelines,
    messages: [
      { role: 'user', content: formatReviewRequest(diff, relatedIssues) }
    ],
    response_format: { type: 'json_object' }  // 구조화된 출력 강제
  });
  
  // 3. 출력 검증 및 후처리 (Harness)
  const parsed = JSON.parse(review);
  if (!isValidReviewFormat(parsed)) {
    return await retryWithFeedback(parsed);  // 재시도 로직
  }
  
  // 4. 다운스트림 시스템에 전달
  await postGitHubComment(prData.id, formatComment(parsed));
  return parsed;
}
```

## Harness의 구성 요소

**1. Input Pipeline** — 모델에 보낼 입력을 가공

- 토큰 제한 내에서 맥락 우선순위 결정
- 민감 정보 마스킹
- 입력 포맷 표준화

**2. Output Parser** — 모델 출력을 시스템이 이해할 수 있는 형태로 변환

```javascript
// 모델 출력을 구조화된 데이터로 파싱
function parseReviewOutput(raw) {
  try {
    const parsed = JSON.parse(raw);
    return {
      severity: parsed.severity,     // "critical" | "warning" | "info"
      issues: parsed.issues,         // 발견된 문제 배열
      suggestions: parsed.suggestions // 개선 제안 배열
    };
  } catch (e) {
    // JSON 파싱 실패 시 폴백
    return extractFromPlainText(raw);
  }
}
```

**3. Error Handling & Retry** — 모델은 틀릴 수 있다

- 출력 형식이 기대와 다를 때 재시도
- 할루시네이션 감지 및 검증
- Rate limit, timeout 처리

**4. Orchestration** — 여러 모델 호출을 조합

```javascript
// 여러 단계의 LLM 호출을 오케스트레이션
async function analyzeCodebase(repo) {
  // Step 1: 구조 분석 (빠른 모델)
  const structure = await llm.fast({
    prompt: `이 레포의 폴더 구조를 분석해: ${repo.tree}`
  });
  
  // Step 2: 각 모듈 심층 분석 (강력한 모델, 병렬)
  const analyses = await Promise.all(
    structure.modules.map(mod => 
      llm.powerful({
        prompt: `이 모듈을 심층 분석해: ${mod.code}`,
        context: structure.summary
      })
    )
  );
  
  // Step 3: 종합 보고서 생성
  return await llm.powerful({
    prompt: '개별 분석을 종합해 보고서를 작성해',
    context: analyses.map(a => a.summary).join('\n')
  });
}
```

# Context Engineering vs Harness Engineering

두 개념은 대립하는 것이 아니라, **같은 시스템의 다른 레이어**다.

| 관점 | Context Engineering | Harness Engineering |
| --- | --- | --- |
| 핵심 질문 | "모델에게 뭘 보여줄까?" | "모델을 시스템에 어떻게 끼워넣을까?" |
| 관심사 | 입력의 *질* | 전체 *흐름* |
| 비유 | 시험 문제지 옆에 놓는 참고자료 | 시험 전체를 설계하는 출제위원 |
| 산출물 | 맥락 구성 전략, RAG 파이프라인 | 시스템 아키텍처, 오케스트레이션 로직 |

실제 프로덕트에서는 둘 다 필요하다. Harness가 파이프라인을 설계하고, 그 안에서 Context Engineering이 각 단계의 입력을 최적화한다.

# 프론트엔드 개발자 관점에서의 적용

AI 기능을 프론트엔드에 통합할 때도 이 개념들이 적용된다.

## 사용자 입력을 맥락으로 변환

사용자가 입력한 자연어를 그대로 모델에 보내지 않고, 현재 UI 상태와 함께 구성한다:

```javascript
async function handleUserQuery(query) {
  // 현재 화면 상태를 맥락에 포함
  const context = {
    currentPage: router.currentRoute,
    selectedItems: store.getSelectedItems(),
    recentActions: store.getRecentActions(5),
    userPreferences: store.getUserPrefs()
  };
  
  const response = await fetch('/api/ai/query', {
    method: 'POST',
    body: JSON.stringify({ query, context })
  });
  
  return response.json();
}
```

## 스트리밍 응답 처리

모델의 출력을 실시간으로 UI에 반영하는 것도 Harness의 영역이다:

```javascript
async function streamAIResponse(prompt) {
  const response = await fetch('/api/ai/stream', {
    method: 'POST',
    body: JSON.stringify({ prompt })
  });
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    
    // 실시간으로 UI 업데이트
    updateUI(buffer);
  }
}
```

## 에러 상태의 UX 설계

모델이 실패하거나 부적절한 응답을 반환했을 때의 사용자 경험도 Harness의 일부다:

```javascript
async function safeAICall(prompt) {
  try {
    const result = await callAI(prompt);
    
    // 응답 검증
    if (result.confidence < 0.5) {
      return { 
        type: 'low_confidence',
        message: '정확한 답변을 드리기 어렵습니다. 질문을 더 구체적으로 해주세요.',
        suggestion: result.clarifyingQuestions
      };
    }
    
    return { type: 'success', data: result };
  } catch (error) {
    if (error.status === 429) {
      return { type: 'rate_limit', message: '잠시 후 다시 시도해주세요.' };
    }
    return { type: 'error', message: '일시적인 오류가 발생했습니다.' };
  }
}
```

# 결론

프롬프트 엔지니어링은 여전히 중요하다. 하지만 AI를 실제 프로덕트에 통합할 때는 그것만으로는 부족하다.

- **Context Engineering**은 모델이 올바른 판단을 내릴 수 있는 환경을 설계한다
- **Harness Engineering**은 모델을 안정적인 시스템 컴포넌트로 만든다

이 두 가지를 이해하면, AI 기능을 "그냥 API 호출"이 아닌 **엔지니어링된 시스템**으로 구축할 수 있다. 프론트엔드 개발자로서도 AI와 사용자 사이의 인터페이스를 설계하는 데 이 관점이 큰 도움이 된다.

AI 시대에 개발자의 역할은 "코드를 짜는 사람"에서 "시스템을 설계하는 사람"으로 확장되고 있다. Context Engineering과 Harness Engineering은 그 확장의 구체적인 방향을 보여준다.

# 참고 자료

- [Andrej Karpathy의 Context Engineering 관련 발언](https://x.com/karpathy)
- [LangChain Documentation — Building with LLMs](https://docs.langchain.com)
- [Anthropic — Building effective agents](https://docs.anthropic.com)
- [OpenAI Cookbook — Best practices for prompt engineering](https://cookbook.openai.com)
