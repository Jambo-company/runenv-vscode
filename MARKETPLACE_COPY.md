# RunEnv VS Code Extension — Marketplace Copy

Draft date: 2026-03-13

## English

### Short description

Inject secrets into VS Code terminals, tasks, and debug sessions at runtime without relying on committed `.env` files.

### Marketplace summary

RunEnv keeps secrets out of source control and puts them where developers actually need them: inside the running VS Code workspace.

Connect a folder once, choose the project and environment, then load secrets directly into terminals, tasks, and debug sessions. Use `Home` as the main workspace surface for setup, status, troubleshooting, and follow-up actions. Import an existing `.env` file when migrating, or generate one only when a tool still requires it.

RunEnv is designed for teams that want a practical developer workflow:

- no committed `.env` files by default
- read-only masked secret visibility inside VS Code
- guided setup and recovery with `Quick Start`
- doctor-style diagnostics for workspace issues
- import preview and conflict handling
- support for Flutter / React Native style file-based tooling when needed
- shared auth flow with the RunEnv CLI

### Suggested marketplace bullets

- Load secrets into every VS Code terminal without copying values by hand
- Keep setup, troubleshooting, import, and recovery in one `Home` view
- Migrate local `.env` files with preview, diff, and conflict controls
- Generate `.env` files only for tools that still require them
- Inspect masked secrets safely and switch environments quickly

### Suggested release announcement

RunEnv for VS Code is now ready for release. It gives teams a Home-first workflow for connecting a workspace, loading secrets at runtime, importing existing `.env` files, and troubleshooting setup issues without leaving the editor. The final release pass focused on hardening: safer command generation, multi-root correctness, JSONC support for Flutter debug setup, and protection against stale secret reuse after reloads.

## 한국어

### 짧은 소개 문구

커밋된 `.env` 파일에 의존하지 않고, VS Code 터미널·작업·디버그 세션에 시크릿을 런타임으로 주입합니다.

### 마켓플레이스 설명 문구

RunEnv는 시크릿을 소스코드 저장소 밖에 두고, 개발자가 실제로 필요한 위치인 VS Code 실행 워크스페이스 안으로 바로 가져옵니다.

폴더를 한 번 연결하고 프로젝트와 환경을 선택한 뒤, 시크릿을 터미널, task, debug 세션에 직접 로드할 수 있습니다. `Home` 뷰를 메인 화면으로 사용해 설정, 상태 확인, 문제 해결, 다음 액션까지 한 흐름 안에서 처리할 수 있습니다. 기존 `.env` 파일을 마이그레이션할 때는 import 를 쓰고, 파일이 꼭 필요한 도구에만 `.env` 를 선택적으로 생성하면 됩니다.

RunEnv는 다음과 같은 팀 워크플로를 목표로 합니다.

- 기본값으로 `.env` 파일을 커밋하지 않음
- VS Code 안에서 마스킹된 read-only secrets 확인 가능
- `Quick Start` 기반 guided setup / recovery
- 워크스페이스 문제를 위한 doctor-style diagnostics
- import preview 와 충돌 처리
- 필요할 때만 Flutter / React Native 계열 파일 기반 도구 지원
- RunEnv CLI 와 공유되는 인증 흐름

### 마켓플레이스 핵심 bullet 제안

- 값을 복사하지 않고 VS Code 터미널 전체에 시크릿 로드
- 설정, 문제 해결, import, recovery 를 `Home` 한 화면에서 처리
- preview, diff, conflict control 이 있는 `.env` 마이그레이션
- 꼭 필요한 도구에만 `.env` 파일 생성
- 마스킹된 secrets 확인과 빠른 환경 전환 지원

### 릴리즈 공지 문구 제안

RunEnv for VS Code 가 출시 직전 단계에 도달했습니다. 워크스페이스 연결, 런타임 시크릿 로드, 기존 `.env` 파일 import, 설정 문제 진단까지 에디터 안에서 처리할 수 있는 Home-first 워크플로를 제공합니다. 최종 릴리즈 패스에서는 더 안전한 명령 생성, multi-root 정확성, Flutter debug setup 의 JSONC 지원, reload 이후 stale secret 재사용 방지에 집중했습니다.
