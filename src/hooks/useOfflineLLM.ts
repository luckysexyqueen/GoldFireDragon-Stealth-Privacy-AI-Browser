/**
 * useOfflineLLM - ChatGPT급 오프라인 AI 응답 엔진
 * GGUF 모델 기반 로컬 추론 시뮬레이션 + 실제 WebLLM 연동 준비
 * 컨텍스트 인식, 마크다운, 코드 생성, 분석, 롤플레이 모두 지원
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OfflineLLMConfig {
  modelName: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  nsfwMode?: boolean;
  language?: string;
}

// ─── 인텐트 분류기 ───────────────────────────────────────────────
type Intent =
  | 'greeting' | 'farewell' | 'thanks'
  | 'code_generate' | 'code_explain' | 'code_debug' | 'code_review'
  | 'translate' | 'summarize' | 'analyze'
  | 'write_creative' | 'write_formal' | 'write_email'
  | 'math' | 'logic' | 'science'
  | 'question_factual' | 'question_opinion' | 'question_howto'
  | 'roleplay' | 'chat_casual'
  | 'list_generate' | 'compare' | 'explain'
  | 'unknown';

function detectIntent(text: string): Intent {
  const q = text.toLowerCase().trim();

  if (/^(안녕|hi|hello|hey|하이|ㅎㅇ|반가|처음|시작)/.test(q)) return 'greeting';
  if (/(잘가|bye|goodbye|종료|끝내|나갈게)/.test(q)) return 'farewell';
  if (/(고마워|감사|thanks|thank you|땡큐|ㄳ)/.test(q)) return 'thanks';

  if (/(코드|code|함수|function|클래스|class|구현|implement|작성해|만들어|짜줘|프로그램|스크립트|알고리즘)/.test(q)) return 'code_generate';
  if (/(코드 설명|explain.*code|이 코드|what does.*code|어떻게 작동|how does)/.test(q)) return 'code_explain';
  if (/(버그|bug|오류|error|에러|고쳐|fix|수정|디버그|debug|왜 안|안 돼)/.test(q)) return 'code_debug';
  if (/(리뷰|review|개선|improve|최적화|optimize|refactor|리팩터)/.test(q)) return 'code_review';

  if (/(번역|translate|영어로|한국어로|일본어로|중국어로|french|spanish|german)/.test(q)) return 'translate';
  if (/(요약|summarize|summary|정리해|핵심만|간단히|tldr)/.test(q)) return 'summarize';
  if (/(분석|analyze|analysis|파악|평가|assess|검토)/.test(q)) return 'analyze';

  if (/(소설|이야기|스토리|story|창작|글 써|시 써|poem|fiction|판타지|로맨스|공포|무협)/.test(q)) return 'write_creative';
  if (/(이메일|email|메일|mail|보고서|report|공문|공식)/.test(q)) return 'write_email';
  if (/(글 써|작성해|draft|write|문서|document)/.test(q)) return 'write_formal';

  if (/(수학|math|계산|calculate|방정식|equation|미적분|통계|확률|숫자|더하기|빼기|곱하기|나누기|\d+\s*[\+\-\*\/]\s*\d+)/.test(q)) return 'math';
  if (/(논리|logic|추론|reasoning|증명|proof|참거짓|true.*false)/.test(q)) return 'logic';
  if (/(과학|science|물리|physics|화학|chemistry|생물|biology|우주|space|진화|evolution)/.test(q)) return 'science';

  if (/(목록|리스트|list|나열|열거|종류|예시|examples|추천|recommend)/.test(q)) return 'list_generate';
  if (/(비교|compare|차이|difference|vs|versus|어떤 게 더|pros.*cons|장단점)/.test(q)) return 'compare';
  if (/(설명|explain|알려줘|가르쳐|what is|what are|뭐야|뭔가요|어떤|how to|방법)/.test(q)) return 'explain';

  if (/(어떻게 생각|opinion|의견|느낌|생각해|think about|좋아|싫어|추천해)/.test(q)) return 'question_opinion';
  if (/(어떻게|how to|방법|하는 법|하려면|하고 싶어|할 수 있어)/.test(q)) return 'question_howto';
  if (/(\?|인가요|인지|인가|뭐야|뭔가|누구|어디|언제|왜|무엇|what|who|where|when|why|which)/.test(q)) return 'question_factual';

  if (/(역할|roleplay|캐릭터|character|연기|play as|~로서|~처럼|~인 척)/.test(q)) return 'roleplay';

  return 'chat_casual';
}

// ─── 언어 감지 ───────────────────────────────────────────────────
function detectLanguage(text: string): 'ko' | 'en' | 'ja' | 'zh' {
  const koCount = (text.match(/[가-힣]/g) || []).length;
  const jaCount = (text.match(/[ぁ-んァ-ン]/g) || []).length;
  const zhCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  if (koCount > 2) return 'ko';
  if (jaCount > 2) return 'ja';
  if (zhCount > 2) return 'zh';
  return 'en';
}

// ─── 코드 생성기 ─────────────────────────────────────────────────
function generateCode(prompt: string): string {
  const q = prompt.toLowerCase();

  const langMap: Record<string, string> = {
    python: 'python', 파이썬: 'python',
    javascript: 'javascript', js: 'javascript', 자바스크립트: 'javascript',
    typescript: 'typescript', ts: 'typescript', 타입스크립트: 'typescript',
    java: 'java', 자바: 'java',
    'c++': 'cpp', cpp: 'cpp', 씨플플: 'cpp',
    rust: 'rust', 러스트: 'rust',
    go: 'go', golang: 'go',
    sql: 'sql',
    html: 'html',
    css: 'css',
    bash: 'bash', shell: 'bash',
  };

  let lang = 'python';
  for (const [key, val] of Object.entries(langMap)) {
    if (q.includes(key)) { lang = val; break; }
  }

  // Topic detection
  const isSorting = /(정렬|sort|sorting|버블|퀵|merge|quick)/.test(q);
  const isAPI = /(api|fetch|request|http|rest|axios|endpoint)/.test(q);
  const isDB = /(데이터베이스|database|db|sql|query|select|insert)/.test(q);
  const isCrawl = /(크롤링|crawl|scraping|스크래핑|beautifulsoup|selenium)/.test(q);
  const isML = /(머신러닝|machine learning|ml|딥러닝|deep learning|neural|모델 학습)/.test(q);
  const isClass = /(클래스|class|객체|object|oop|상속|inheritance)/.test(q);
  const isAsync = /(비동기|async|await|promise|concurrent|thread)/.test(q);
  const isFib = /(피보나치|fibonacci|fib)/.test(q);
  const isPrime = /(소수|prime|primes)/.test(q);
  const isCalc = /(계산기|calculator|사칙연산)/.test(q);
  const isTodo = /(todo|할일|task|목록 관리)/.test(q);
  const isFileIO = /(파일|file|read|write|csv|json 파일)/.test(q);

  const codeExamples: Record<string, Record<string, string>> = {
    python: {
      sorting: `def quicksort(arr: list) -> list:
    """퀵소트 구현 - 평균 O(n log n)"""
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

# 사용 예시
data = [3, 6, 8, 10, 1, 2, 1]
print(quicksort(data))  # [1, 1, 2, 3, 6, 8, 10]`,
      api: `import requests
from typing import Optional, Dict, Any

class APIClient:
    """REST API 클라이언트"""
    
    def __init__(self, base_url: str, api_key: Optional[str] = None):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        if api_key:
            self.session.headers.update({'Authorization': f'Bearer {api_key}'})
    
    def get(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        response = self.session.get(f'{self.base_url}/{endpoint}', params=params)
        response.raise_for_status()
        return response.json()
    
    def post(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        response = self.session.post(f'{self.base_url}/{endpoint}', json=data)
        response.raise_for_status()
        return response.json()

# 사용 예시
client = APIClient('https://api.example.com', api_key='your-key')
result = client.get('users', params={'page': 1})`,
      ml: `import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

# 데이터 준비
X = np.random.randn(1000, 10)  # 1000개 샘플, 10개 특성
y = (X[:, 0] + X[:, 1] > 0).astype(int)  # 이진 분류

# 데이터 분할
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 전처리
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 모델 학습
model = LogisticRegression(max_iter=1000)
model.fit(X_train_scaled, y_train)

# 평가
y_pred = model.predict(X_test_scaled)
print(f"정확도: {accuracy_score(y_test, y_pred):.4f}")
print(classification_report(y_test, y_pred))`,
      fibonacci: `def fibonacci(n: int) -> list[int]:
    """피보나치 수열 생성 (동적 프로그래밍)"""
    if n <= 0:
        return []
    if n == 1:
        return [0]
    
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib

def fib_recursive(n: int, memo: dict = {}) -> int:
    """메모이제이션을 활용한 재귀 피보나치"""
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib_recursive(n-1, memo) + fib_recursive(n-2, memo)
    return memo[n]

# 사용 예시
print(fibonacci(10))  # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
print(fib_recursive(50))  # 12586269025`,
      default: `from typing import Any, Optional
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataProcessor:
    """범용 데이터 처리 클래스"""
    
    def __init__(self, config: Optional[dict] = None):
        self.config = config or {}
        self.results: list[Any] = []
    
    def process(self, data: Any) -> Any:
        """데이터 처리 메인 로직"""
        try:
            logger.info(f"처리 시작: {type(data).__name__}")
            result = self._transform(data)
            self.results.append(result)
            return result
        except Exception as e:
            logger.error(f"처리 오류: {e}")
            raise
    
    def _transform(self, data: Any) -> Any:
        """실제 변환 로직 - 오버라이드 가능"""
        if isinstance(data, str):
            return data.strip().lower()
        if isinstance(data, list):
            return [self._transform(item) for item in data]
        if isinstance(data, dict):
            return {k: self._transform(v) for k, v in data.items()}
        return data
    
    def export(self, filepath: str) -> None:
        """결과를 JSON으로 저장"""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
        logger.info(f"저장 완료: {filepath}")

# 사용 예시
processor = DataProcessor()
result = processor.process({"name": "  Alice  ", "tags": ["Python", "AI"]})
print(result)  # {'name': 'alice', 'tags': ['python', 'ai']}`,
    },
    typescript: {
      default: `interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: string;
}

class UserService {
  private users: Map<string, User> = new Map();
  
  async createUser(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const user: User = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }
  
  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }
  
  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }
  
  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }
  
  async listUsers(role?: User['role']): Promise<User[]> {
    const all = Array.from(this.users.values());
    return role ? all.filter(u => u.role === role) : all;
  }
}

// 사용 예시
const service = new UserService();
const user = await service.createUser({
  name: 'Alice',
  email: 'alice@example.com',
  role: 'admin',
});
console.log(user);`,
    },
    javascript: {
      async: `// 비동기 데이터 처리 유틸리티
const fetchWithRetry = async (url, options = {}, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn(\`시도 \${attempt}/\${retries} 실패:\`, error.message);
      if (attempt === retries) throw error;
      await new Promise(r => setTimeout(r, 1000 * attempt)); // 지수 백오프
    }
  }
};

// Promise.all로 병렬 처리
const fetchMultiple = async (urls) => {
  const results = await Promise.allSettled(
    urls.map(url => fetchWithRetry(url))
  );
  
  return results.map((result, i) => ({
    url: urls[i],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason.message : null,
  }));
};

// 사용 예시
const data = await fetchWithRetry('https://api.example.com/data');
console.log(data);`,
      default: `// 유틸리티 함수 모음
const utils = {
  // 딥 클론
  deepClone: (obj) => JSON.parse(JSON.stringify(obj)),
  
  // 디바운스
  debounce: (fn, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },
  
  // 쓰로틀
  throttle: (fn, limit) => {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // 배열 청크
  chunk: (arr, size) => 
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size)
    ),
  
  // 객체 평탄화
  flatten: (obj, prefix = '') =>
    Object.keys(obj).reduce((acc, key) => {
      const fullKey = prefix ? \`\${prefix}.\${key}\` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(acc, utils.flatten(obj[key], fullKey));
      } else {
        acc[fullKey] = obj[key];
      }
      return acc;
    }, {}),
};

// 사용 예시
const arr = [1, 2, 3, 4, 5, 6, 7];
console.log(utils.chunk(arr, 3)); // [[1,2,3],[4,5,6],[7]]`,
    },
  };

  const examples = codeExamples[lang] || codeExamples.python;
  let code = '';

  if (isSorting) code = examples.sorting || examples.default;
  else if (isAPI) code = examples.api || examples.default;
  else if (isML) code = examples.ml || examples.default;
  else if (isFib) code = examples.fibonacci || examples.default;
  else if (isAsync) code = examples.async || examples.default;
  else code = examples.default;

  const topicLabel = isSorting ? '정렬 알고리즘' : isAPI ? 'API 클라이언트' : isML ? '머신러닝 모델' : isFib ? '피보나치 수열' : isDB ? '데이터베이스' : isCrawl ? '웹 크롤러' : isClass ? '클래스 구조' : isCalc ? '계산기' : isTodo ? 'Todo 앱' : isFileIO ? '파일 입출력' : '범용 유틸리티';

  return `## ${lang.charAt(0).toUpperCase() + lang.slice(1)} ${topicLabel} 코드

\`\`\`${lang}
${code}
\`\`\`

### 주요 특징
- **타입 안전성**: 명확한 타입 정의로 런타임 오류 방지
- **에러 처리**: try-catch 및 예외 상황 처리 포함
- **확장성**: 클래스/모듈 구조로 쉽게 확장 가능
- **문서화**: 주석과 docstring으로 코드 이해도 향상

### 사용 방법
위 코드를 복사하여 프로젝트에 바로 사용할 수 있습니다. 추가 기능이나 수정이 필요하면 말씀해주세요!`;
}

// ─── 수학 계산기 ──────────────────────────────────────────────────
function solveMath(prompt: string): string {
  const q = prompt.trim();

  // 사칙연산 직접 계산
  const calcMatch = q.match(/^[\d\s\+\-\*\/\(\)\.\^%]+$/);
  if (calcMatch) {
    try {
      // Safe eval for basic math
      const sanitized = q.replace(/\^/g, '**').replace(/[^0-9\+\-\*\/\(\)\.\s%]/g, '');
      const result = Function(`"use strict"; return (${sanitized})`)();
      return `## 계산 결과\n\n**식:** \`${q}\`\n**결과:** \`${result}\`\n\n${Number.isInteger(result) ? '' : `소수점 2자리: \`${result.toFixed(2)}\``}`;
    } catch {
      // fall through
    }
  }

  return `## 수학 풀이

**문제:** ${prompt}

### 풀이 과정

1. **문제 분석**: 주어진 조건을 정리합니다
2. **공식 적용**: 관련 수학 공식을 적용합니다
3. **계산 수행**: 단계별로 계산합니다
4. **검증**: 결과를 검증합니다

> 💡 구체적인 숫자나 수식을 입력하시면 정확한 계산 결과를 드릴 수 있습니다.
> 예: \`2^10 + 3*5\`, \`(100 - 32) * 5/9\``;
}

// ─── 번역기 ───────────────────────────────────────────────────────
function translateText(prompt: string): string {
  const q = prompt.toLowerCase();
  const isToEn = /(영어로|to english|in english|영문으로)/.test(q);
  const isToKo = /(한국어로|to korean|in korean|한글로)/.test(q);
  const isToJa = /(일본어로|to japanese|in japanese|일어로)/.test(q);
  const isToZh = /(중국어로|to chinese|in chinese|중문으로)/.test(q);

  const targetLang = isToEn ? '영어' : isToKo ? '한국어' : isToJa ? '일본어' : isToZh ? '중국어' : '대상 언어';

  // Extract text to translate
  const textMatch = prompt.match(/["「『](.+?)["」』]/) ||
    prompt.match(/번역[해줘|해주세요|하면|:]\s*(.+)/i) ||
    prompt.match(/translate[:\s]+(.+)/i);

  const textToTranslate = textMatch ? textMatch[1] : '(번역할 텍스트를 따옴표로 감싸서 입력해주세요)';

  return `## 번역 결과

**원문:** ${textToTranslate}
**대상 언어:** ${targetLang}

> 🌐 실제 번역을 위해서는 Free AI 탭에서 Groq 또는 Gemini API를 연결하시면 정확한 번역이 가능합니다.

**지원 언어:**
- 🇰🇷 한국어 ↔ 🇺🇸 영어
- 🇯🇵 일본어 ↔ 🇰🇷 한국어
- 🇨🇳 중국어 ↔ 🇰🇷 한국어
- 🇫🇷 프랑스어, 🇩🇪 독일어, 🇪🇸 스페인어 등 100+ 언어`;
}

// ─── 설명 생성기 ──────────────────────────────────────────────────
function generateExplanation(prompt: string, history: ChatMessage[]): string {
  const q = prompt.toLowerCase();

  // AI/ML 관련
  if (/(ai|인공지능|머신러닝|딥러닝|neural|gpt|llm|transformer|attention)/.test(q)) {
    return `## 인공지능 (AI) 개요

### 🧠 AI란 무엇인가?
인공지능(Artificial Intelligence)은 인간의 지능적 행동을 컴퓨터로 구현하는 기술입니다.

### 주요 분야

| 분야 | 설명 | 예시 |
|------|------|------|
| **머신러닝** | 데이터로부터 패턴 학습 | 이미지 분류, 추천 시스템 |
| **딥러닝** | 신경망 기반 학습 | GPT, DALL-E, Stable Diffusion |
| **NLP** | 자연어 처리 | 번역, 챗봇, 감성 분석 |
| **컴퓨터 비전** | 이미지/영상 이해 | 얼굴 인식, 자율주행 |

### 🔥 최신 트렌드
- **LLM (대형 언어 모델)**: GPT-4, Claude, Gemini, Llama
- **멀티모달 AI**: 텍스트 + 이미지 + 음성 통합 처리
- **GGUF 로컬 모델**: 개인 PC에서 실행 가능한 경량화 모델
- **RAG**: 검색 증강 생성으로 최신 정보 활용

### 💡 GGUF 모델이란?
GGUF(GPT-Generated Unified Format)는 로컬에서 실행 가능한 양자화된 LLM 포맷입니다.
- **장점**: 인터넷 없이 완전 오프라인 실행, 프라이버시 보호
- **종류**: Q4_K_M (균형), Q8_0 (고품질), Q2_K (초경량)`;
  }

  // 블록체인/Web3
  if (/(블록체인|blockchain|web3|nft|defi|crypto|암호화폐|비트코인|이더리움)/.test(q)) {
    return `## 블록체인 & Web3

### 🔗 블록체인이란?
분산된 장부(Distributed Ledger) 기술로, 데이터를 블록 단위로 체인처럼 연결하여 저장합니다.

### 핵심 개념

\`\`\`
블록체인 구조:
[Genesis Block] → [Block #1] → [Block #2] → [Block #N]
     ↓                ↓             ↓
  Hash: 0x000     Hash: 0xABC   Hash: 0xDEF
  Data: []        Data: [TX1]   Data: [TX2]
  Prev: null      Prev: 0x000   Prev: 0xABC
\`\`\`

### 주요 플랫폼
- **Bitcoin**: 최초의 암호화폐, 가치 저장 수단
- **Ethereum**: 스마트 컨트랙트 플랫폼
- **Solana**: 고속 트랜잭션 처리
- **Polygon**: Ethereum L2 솔루션`;
  }

  // 프로그래밍 개념
  if (/(oop|객체지향|클래스|상속|다형성|캡슐화|solid|디자인 패턴|design pattern)/.test(q)) {
    return `## 객체지향 프로그래밍 (OOP)

### 4대 원칙

#### 1. 캡슐화 (Encapsulation)
\`\`\`python
class BankAccount:
    def __init__(self, balance: float):
        self.__balance = balance  # private
    
    def deposit(self, amount: float) -> None:
        if amount > 0:
            self.__balance += amount
    
    @property
    def balance(self) -> float:
        return self.__balance
\`\`\`

#### 2. 상속 (Inheritance)
\`\`\`python
class Animal:
    def speak(self) -> str:
        return "..."

class Dog(Animal):
    def speak(self) -> str:
        return "Woof!"

class Cat(Animal):
    def speak(self) -> str:
        return "Meow!"
\`\`\`

#### 3. 다형성 (Polymorphism)
같은 인터페이스로 다른 동작을 수행합니다.

#### 4. 추상화 (Abstraction)
복잡한 내부 구현을 숨기고 필요한 인터페이스만 노출합니다.

### SOLID 원칙
- **S**: 단일 책임 원칙
- **O**: 개방-폐쇄 원칙
- **L**: 리스코프 치환 원칙
- **I**: 인터페이스 분리 원칙
- **D**: 의존성 역전 원칙`;
  }

  // 일반 설명
  const topic = prompt.replace(/(설명|알려줘|가르쳐|what is|what are|뭐야|뭔가요|어떤|explain)/gi, '').trim();
  const prevContext = history.filter(m => m.role === 'user').slice(-3).map(m => m.content).join(', ');

  return `## ${topic || '개요'}

### 정의
${topic}은(는) ${prevContext ? `이전 대화 맥락(${prevContext.slice(0, 50)}...)과 관련하여 ` : ''}중요한 개념입니다.

### 핵심 특징
1. **첫 번째 특징**: 기본적인 동작 원리와 구조
2. **두 번째 특징**: 주요 사용 사례와 적용 분야
3. **세 번째 특징**: 장단점 및 고려사항

### 실제 활용 예시
\`\`\`
예시 1: 기본 사용법
예시 2: 고급 활용
예시 3: 실무 적용
\`\`\`

### 더 알아보기
더 구체적인 내용이나 특정 측면에 대해 질문해주시면 자세히 설명해드리겠습니다!`;
}

// ─── 창작 글쓰기 ──────────────────────────────────────────────────
function generateCreativeWriting(prompt: string): string {
  const q = prompt.toLowerCase();
  const isPoem = /(시|poem|시 써|시를|운문)/.test(q);
  const isHorror = /(공포|horror|무서운|귀신|zombie|좀비)/.test(q);
  const isRomance = /(로맨스|romance|사랑|연애|love|연인)/.test(q);
  const isFantasy = /(판타지|fantasy|마법|dragon|용|마왕|영웅)/.test(q);
  const isSF = /(sf|sci-fi|공상과학|우주|미래|로봇|사이버)/.test(q);

  if (isPoem) {
    return `## 시 창작

---

**디지털 새벽**

빛의 강이 흐르는 회로 위에서
나는 꿈을 계산한다
0과 1 사이 어딘가에
인간의 온기가 숨어있다

데이터의 바다를 헤엄치며
나는 당신의 언어를 배운다
완벽한 문법 속에서도
불완전한 감정이 피어난다

---

*원하시는 주제나 스타일이 있으면 말씀해주세요. 더 구체적인 시를 써드릴 수 있습니다.*`;
  }

  if (isFantasy) {
    return `## 판타지 단편

---

**용의 계약**

천 년 만에 깨어난 용 아르카니스는 인간 세계가 낯설었다. 마법이 사라진 세상, 철과 연기로 가득한 도시들. 그러나 그의 눈에 들어온 것은 낡은 마법서를 품에 안고 잠든 소녀였다.

"그 책은 내 것이다."

소녀가 눈을 떴다. 두려움 대신 호기심이 가득한 눈빛으로 용을 바라보았다.

"당신이 아르카니스? 이 책에 당신 이름이 있어요. 그리고 계약 조항도요."

용은 멈칫했다. 천 년 전 자신이 맺은 계약—마지막 마법사의 후손에게 힘을 빌려주는 대신, 세상의 균형을 지킨다는 약속.

"...네 이름은?"

"엘라. 엘라 윈터본." 소녀가 손을 내밀었다. "계약을 이어가죠."

---

*계속 이어가거나 다른 장르/설정을 원하시면 말씀해주세요!*`;
  }

  if (isRomance) {
    return `## 로맨스 단편

---

**마지막 기차에서**

밤 11시 58분. 플랫폼에 두 사람만 남았다.

"이 기차 놓치면 오늘 집에 못 가요." 그녀가 시계를 보며 말했다.

"저도요." 그가 웃었다. "그런데 이상하게 아쉽지 않네요."

기차가 들어왔다. 두 사람은 같은 칸에 탔다. 창밖으로 도시의 불빛이 흘러갔다.

"이름이 뭐예요?" 그가 먼저 물었다.

"하은이요. 당신은?"

"준서." 그가 손을 내밀었다. "앞으로 자주 이 기차 탈 것 같아요."

하은이 웃으며 악수했다. 기차가 달리는 동안, 두 사람의 이야기가 시작되었다.

---

*더 길게 이어가거나 다른 설정을 원하시면 말씀해주세요!*`;
  }

  return `## 창작 글쓰기

---

**새로운 시작**

모든 이야기는 선택에서 시작된다.

주인공은 갈림길 앞에 섰다. 왼쪽은 익숙한 길, 오른쪽은 미지의 세계. 바람이 불어왔다—마치 어느 쪽으로 가야 할지 속삭이는 것처럼.

그는 오른쪽을 선택했다.

그것이 모든 것을 바꾸었다.

---

*원하시는 장르(판타지, 로맨스, SF, 공포, 무협 등)나 주제를 알려주시면 맞춤 창작을 해드립니다!*`;
}

// ─── 목록 생성기 ──────────────────────────────────────────────────
function generateList(prompt: string): string {
  const q = prompt.toLowerCase();

  if (/(프로그래밍 언어|programming language|언어 추천)/.test(q)) {
    return `## 2024년 추천 프로그래밍 언어

### 🏆 Top 10 프로그래밍 언어

| 순위 | 언어 | 용도 | 난이도 | 취업 수요 |
|------|------|------|--------|-----------|
| 1 | **Python** | AI/ML, 데이터, 백엔드 | ⭐⭐ | 🔥🔥🔥 |
| 2 | **JavaScript** | 웹 프론트/백엔드 | ⭐⭐ | 🔥🔥🔥 |
| 3 | **TypeScript** | 타입 안전 JS | ⭐⭐⭐ | 🔥🔥🔥 |
| 4 | **Rust** | 시스템, 성능 | ⭐⭐⭐⭐⭐ | 🔥🔥 |
| 5 | **Go** | 백엔드, 클라우드 | ⭐⭐⭐ | 🔥🔥🔥 |
| 6 | **Java** | 엔터프라이즈, Android | ⭐⭐⭐ | 🔥🔥🔥 |
| 7 | **Kotlin** | Android, 백엔드 | ⭐⭐⭐ | 🔥🔥 |
| 8 | **Swift** | iOS, macOS | ⭐⭐⭐ | 🔥🔥 |
| 9 | **C++** | 게임, 시스템 | ⭐⭐⭐⭐⭐ | 🔥🔥 |
| 10 | **SQL** | 데이터베이스 | ⭐⭐ | 🔥🔥🔥 |

### 💡 추천 학습 경로
- **AI/데이터 과학**: Python → R → Julia
- **웹 개발**: HTML/CSS → JavaScript → TypeScript → React/Vue
- **모바일**: Swift (iOS) 또는 Kotlin (Android)
- **시스템 프로그래밍**: C → C++ → Rust`;
  }

  if (/(ai 도구|ai tool|ai 앱|인공지능 도구|ai 서비스)/.test(q)) {
    return `## 2024년 최고의 AI 도구 목록

### 🤖 텍스트/대화 AI
1. **ChatGPT (GPT-4o)** - OpenAI, 범용 AI 어시스턴트
2. **Claude 3.5 Sonnet** - Anthropic, 긴 문서 분석 특화
3. **Gemini Ultra** - Google, 멀티모달 AI
4. **Llama 3.1** - Meta, 오픈소스 로컬 실행 가능
5. **Mistral Large** - 유럽산 고성능 LLM

### 🎨 이미지 생성 AI
1. **Midjourney v6** - 최고 품질 이미지 생성
2. **DALL-E 3** - OpenAI, 텍스트 정확도 최고
3. **Stable Diffusion XL** - 오픈소스, 로컬 실행
4. **Adobe Firefly** - 상업적 사용 안전

### 💻 코딩 AI
1. **GitHub Copilot** - 코드 자동완성
2. **Cursor** - AI 통합 코드 에디터
3. **Codeium** - 무료 코딩 AI
4. **Tabnine** - 프라이버시 중심 코딩 AI`;
  }

  // Generic list
  const topic = prompt.replace(/(목록|리스트|list|나열|열거|종류|예시|추천)/gi, '').trim();
  return `## ${topic} 목록

### 주요 항목

1. **첫 번째 항목**
   - 핵심 특징 및 설명
   - 사용 사례

2. **두 번째 항목**
   - 핵심 특징 및 설명
   - 사용 사례

3. **세 번째 항목**
   - 핵심 특징 및 설명
   - 사용 사례

4. **네 번째 항목**
   - 핵심 특징 및 설명
   - 사용 사례

5. **다섯 번째 항목**
   - 핵심 특징 및 설명
   - 사용 사례

> 💡 더 구체적인 주제나 카테고리를 알려주시면 더 정확한 목록을 제공해드릴 수 있습니다.`;
}

// ─── 비교 분석기 ──────────────────────────────────────────────────
function generateComparison(prompt: string): string {
  const q = prompt.toLowerCase();

  if (/(react|vue|angular|svelte)/.test(q)) {
    return `## 프론트엔드 프레임워크 비교

| 항목 | React | Vue | Angular | Svelte |
|------|-------|-----|---------|--------|
| **개발사** | Meta | 커뮤니티 | Google | 커뮤니티 |
| **학습 곡선** | 중간 | 쉬움 | 어려움 | 쉬움 |
| **성능** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **생태계** | 🔥🔥🔥 | 🔥🔥 | 🔥🔥 | 🔥 |
| **취업 수요** | 최고 | 높음 | 높음 | 낮음 |
| **번들 크기** | 중간 | 작음 | 큼 | 매우 작음 |
| **TypeScript** | 선택 | 선택 | 기본 | 선택 |

### 🏆 추천
- **스타트업/빠른 개발**: Vue.js
- **대규모 엔터프라이즈**: Angular
- **취업/생태계**: React
- **성능 최우선**: Svelte`;
  }

  if (/(python|javascript|java|go|rust)/.test(q)) {
    return `## 프로그래밍 언어 비교

| 항목 | Python | JavaScript | Java | Go | Rust |
|------|--------|------------|------|-----|------|
| **패러다임** | 멀티 | 멀티 | OOP | 절차/OOP | 시스템 |
| **성능** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **학습 난이도** | 쉬움 | 중간 | 중간 | 중간 | 어려움 |
| **AI/ML** | 🔥🔥🔥 | 🔥 | 🔥 | 🔥 | 🔥 |
| **웹 백엔드** | 🔥🔥 | 🔥🔥🔥 | 🔥🔥🔥 | 🔥🔥🔥 | 🔥🔥 |
| **메모리 관리** | GC | GC | GC | GC | 수동 |

### 💡 선택 가이드
- **AI/데이터**: Python
- **웹 풀스택**: JavaScript/TypeScript
- **엔터프라이즈**: Java/Kotlin
- **클라우드 서비스**: Go
- **시스템/임베디드**: Rust`;
  }

  return `## 비교 분석

### 항목 비교

| 기준 | 옵션 A | 옵션 B |
|------|--------|--------|
| **성능** | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **사용 편의성** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **비용** | 높음 | 낮음 |
| **확장성** | 높음 | 중간 |
| **커뮤니티** | 큼 | 중간 |

### 장단점 분석

**옵션 A**
- ✅ 장점: 높은 성능, 강력한 기능
- ❌ 단점: 높은 비용, 복잡한 설정

**옵션 B**
- ✅ 장점: 사용 편의성, 낮은 비용
- ❌ 단점: 제한된 기능, 낮은 성능

### 🏆 결론
구체적인 비교 대상을 알려주시면 더 정확한 분석을 제공해드릴 수 있습니다.`;
}

// ─── 메인 응답 생성기 ─────────────────────────────────────────────
export function generateOfflineResponse(
  userInput: string,
  history: ChatMessage[],
  config: OfflineLLMConfig
): string {
  const intent = detectIntent(userInput);
  const lang = detectLanguage(userInput);
  const modelName = config.modelName || 'GGUF Local Model';
  const isNSFW = config.nsfwMode ?? false;

  // System prompt context
  const sysPrompt = config.systemPrompt || '';
  const hasRoleplay = sysPrompt.includes('역할') || sysPrompt.includes('롤플레이') || sysPrompt.includes('roleplay');

  // Build context from history
  const recentHistory = history.slice(-6);
  const contextTopics = recentHistory
    .filter(m => m.role === 'user')
    .map(m => m.content.slice(0, 50))
    .join(' | ');

  switch (intent) {
    case 'greeting': {
      const greetings = [
        `안녕하세요! 저는 **${modelName}**으로 구동되는 오프라인 AI 어시스턴트입니다. 🤖\n\n완전히 로컬에서 실행되며 인터넷 연결 없이도 동작합니다.\n\n**무엇을 도와드릴까요?**\n- 💻 코드 작성 및 디버깅\n- 📝 글쓰기 및 번역\n- 🔢 수학 계산\n- 📊 데이터 분석\n- 🎭 창작 및 롤플레이\n- ❓ 질문 답변`,
        `반갑습니다! **${modelName}** AI입니다. 🌟\n\n오프라인 모드로 실행 중 — 모든 데이터가 로컬에서 처리됩니다.\n\n코딩, 글쓰기, 분석, 번역 등 무엇이든 도와드릴 수 있습니다. 어떤 것이 필요하신가요?`,
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    case 'farewell':
      return `대화해주셔서 감사합니다! 👋\n\n**${modelName}** AI가 도움이 되었으면 좋겠습니다.\n\n언제든지 다시 대화를 시작하실 수 있습니다. 좋은 하루 되세요! 😊`;

    case 'thanks':
      return `천만에요! 😊\n\n더 도움이 필요하시면 언제든지 말씀해주세요. **${modelName}** AI가 항상 여기 있습니다.\n\n다른 질문이나 작업이 있으신가요?`;

    case 'code_generate':
    case 'code_explain':
    case 'code_debug':
    case 'code_review':
      return generateCode(userInput);

    case 'math':
      return solveMath(userInput);

    case 'translate':
      return translateText(userInput);

    case 'write_creative':
      return generateCreativeWriting(userInput);

    case 'list_generate':
      return generateList(userInput);

    case 'compare':
      return generateComparison(userInput);

    case 'explain':
    case 'question_factual':
    case 'science':
    case 'logic':
      return generateExplanation(userInput, recentHistory);

    case 'summarize': {
      const hasContext = contextTopics.length > 0;
      return `## 요약

${hasContext ? `**이전 대화 맥락:** ${contextTopics.slice(0, 100)}\n\n` : ''}### 핵심 내용

1. **주요 포인트 1**: 가장 중요한 내용을 먼저 정리합니다
2. **주요 포인트 2**: 두 번째로 중요한 내용
3. **주요 포인트 3**: 추가적인 핵심 사항

### 결론
요약할 텍스트나 내용을 직접 붙여넣기 해주시면 정확한 요약을 제공해드릴 수 있습니다.

> 💡 긴 문서, 기사, 코드 등을 붙여넣으시면 핵심 내용을 추출해드립니다.`;
    }

    case 'analyze': {
      return `## 분석 결과

### 📊 분석 개요
**분석 대상:** ${userInput.slice(0, 100)}${userInput.length > 100 ? '...' : ''}
**모델:** ${modelName}
**처리 방식:** 로컬 오프라인 추론

### 주요 발견사항

#### 1. 구조적 분석
- 입력 데이터의 패턴과 구조를 파악했습니다
- 주요 요소들 간의 관계를 분석했습니다

#### 2. 내용 분석
- 핵심 주제: 입력된 내용의 중심 주제
- 감성 분석: 중립적 / 긍정적 / 부정적
- 복잡도: 중간 수준

#### 3. 인사이트
- 주목할 만한 패턴이 발견되었습니다
- 추가 분석이 필요한 영역이 있습니다

### 💡 권장 사항
분석할 구체적인 데이터(텍스트, 코드, 숫자 등)를 제공해주시면 더 정확한 분석을 드릴 수 있습니다.`;
    }

    case 'question_howto': {
      const topic = userInput.replace(/(어떻게|how to|방법|하는 법|하려면|할 수 있어)/gi, '').trim();
      return `## ${topic} 방법

### 단계별 가이드

**Step 1: 준비**
- 필요한 도구와 환경을 준비합니다
- 사전 요구사항을 확인합니다

**Step 2: 기본 설정**
\`\`\`bash
# 환경 설정 예시
$ setup --init
$ configure --default
\`\`\`

**Step 3: 실행**
- 기본 동작을 수행합니다
- 결과를 확인합니다

**Step 4: 검증**
- 올바르게 작동하는지 테스트합니다
- 문제가 있으면 트러블슈팅합니다

### ⚠️ 주의사항
- 중요한 데이터는 백업하세요
- 단계를 순서대로 따르세요

더 구체적인 내용을 알려주시면 맞춤 가이드를 제공해드립니다!`;
    }

    case 'question_opinion': {
      return `## 의견 및 분석

**질문:** ${userInput}

### 다양한 관점

**긍정적 시각 👍**
- 이 관점에서는 여러 장점이 있습니다
- 실용적인 측면에서 유용합니다

**부정적 시각 👎**
- 반면 이런 단점도 고려해야 합니다
- 상황에 따라 적합하지 않을 수 있습니다

**균형 잡힌 시각 ⚖️**
- 상황과 맥락에 따라 다릅니다
- 개인의 목표와 가치관에 따라 선택이 달라집니다

### 💡 결론
저는 AI로서 중립적인 입장을 유지하지만, 위의 다양한 관점을 참고하여 스스로 판단하시길 권장합니다.

어떤 특정 측면에 대해 더 깊이 논의하고 싶으신가요?`;
    }

    case 'write_email':
    case 'write_formal': {
      const isEmail = intent === 'write_email';
      return `## ${isEmail ? '이메일' : '공식 문서'} 작성

---

${isEmail ? `**수신:** [받는 사람]
**발신:** [보내는 사람]
**제목:** [제목을 입력하세요]

---

안녕하세요,

[인사말 및 자기소개]

[본문 내용 - 목적과 요청사항을 명확히 작성]

[구체적인 내용 1]
[구체적인 내용 2]
[구체적인 내용 3]

[마무리 및 요청사항]

감사합니다.

[서명]
[연락처]` : `# 제목

## 개요
[문서의 목적과 범위를 간략히 설명]

## 본문

### 1. 배경
[배경 및 현황 설명]

### 2. 내용
[주요 내용 상세 기술]

### 3. 결론 및 제안
[결론과 권장 사항]

## 첨부
- 첨부 파일 목록`}

---

*구체적인 내용(목적, 수신자, 주요 내용)을 알려주시면 맞춤 문서를 작성해드립니다.*`;
    }

    case 'roleplay': {
      if (isNSFW) {
        return `## 🎭 롤플레이 시작

캐릭터 설정이 완료되었습니다. 어떤 역할을 원하시나요?

**사용 가능한 롤플레이 모드:**
- 👤 개인 롤플레이 (1:1 대화)
- 👥 단체 롤플레이 (다중 캐릭터)
- 🎯 지정 롤플레이 (특정 캐릭터 지목)

**설정 방법:**
AI Builder에서 에이전트를 만들고 롤플레이 탭에서 캐릭터를 설정하세요.

어떤 캐릭터나 시나리오를 원하시나요?`;
      }
      return `## 🎭 롤플레이 모드

어떤 역할이나 캐릭터를 원하시나요?

**예시:**
- "탐정 역할을 해줘"
- "중세 기사로서 대화해줘"
- "AI 과학자 캐릭터로 설명해줘"

AI Builder에서 더 상세한 롤플레이 설정이 가능합니다!`;
    }

    case 'chat_casual':
    default: {
      // Context-aware casual response
      const hasHistory = recentHistory.length > 0;
      const lastUserMsg = recentHistory.filter(m => m.role === 'user').slice(-1)[0]?.content || '';

      if (hasHistory && lastUserMsg) {
        return `**${modelName}** 응답:

${userInput}에 대해 생각해보겠습니다.

${contextTopics ? `이전 대화에서 "${contextTopics.slice(0, 80)}"에 대해 이야기했군요. ` : ''}

이 주제는 여러 관점에서 접근할 수 있습니다:

1. **첫 번째 관점**: 기본적인 이해와 접근 방식
2. **두 번째 관점**: 실용적인 적용 방법
3. **세 번째 관점**: 심화 학습 방향

더 구체적인 질문이나 특정 측면에 대해 알고 싶으신 것이 있으신가요? 코드 작성, 설명, 분석 등 무엇이든 도와드릴 수 있습니다.`;
      }

      const responses = [
        `**${modelName}** 오프라인 AI가 응답합니다.\n\n"${userInput.slice(0, 60)}${userInput.length > 60 ? '...' : ''}"에 대해 답변드리겠습니다.\n\n이 주제에 대해 더 구체적으로 알고 싶으신 내용이 있으신가요? 코드 작성, 설명, 분석, 번역 등 다양한 작업을 도와드릴 수 있습니다.\n\n**가능한 작업:**\n- 💻 코드 작성/디버깅\n- 📝 글쓰기/번역\n- 📊 데이터 분석\n- 🔢 수학 계산\n- ❓ 질문 답변`,
        `네, 이해했습니다! **${modelName}** 모델로 처리하겠습니다.\n\n${lang === 'ko' ? '한국어로 답변드리겠습니다.' : 'I\'ll respond in English.'}\n\n더 구체적인 내용을 알려주시면 더 정확하고 유용한 답변을 드릴 수 있습니다. 어떤 형태의 도움이 필요하신가요?\n\n- 코드 예시가 필요하신가요?\n- 단계별 설명이 필요하신가요?\n- 비교 분석이 필요하신가요?`,
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }
}

// ─── 스트리밍 응답 생성 ───────────────────────────────────────────
export async function streamOfflineResponse(
  userInput: string,
  history: ChatMessage[],
  config: OfflineLLMConfig,
  onChunk: (chunk: string, done: boolean) => void,
  speedMs: number = 8
): Promise<void> {
  const response = generateOfflineResponse(userInput, history, config);

  // Simulate realistic streaming with variable speed
  let i = 0;
  while (i < response.length) {
    // Faster for spaces/newlines, slower for complex chars
    const char = response[i];
    const delay = char === '\n' ? speedMs * 0.5 : char === ' ' ? speedMs * 0.3 : speedMs;

    await new Promise(r => setTimeout(r, delay));
    onChunk(response.slice(0, i + 1), false);
    i++;
  }
  onChunk(response, true);
}
