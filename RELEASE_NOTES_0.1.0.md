# RunEnv VS Code Extension — Release Notes 0.1.0

Draft date: 2026-03-13
Version: `0.1.0`
Status: ready for final QA sign-off and publish

## English

### Summary

RunEnv for VS Code brings zero-disk secret injection into the editor workflow. Instead of committing `.env` files or manually copying secrets between tools, you connect a workspace once, load secrets, and use them in terminals, tasks, and debug sessions directly from VS Code.

### Highlights

- Home-first workspace UX with `Home`, `Secrets`, `Doctor Report`, and `Smoke Test Checklist`
- Runtime secret injection for terminals, tasks, and debug sessions
- `.env` import flow with diff preview, overwrite/add-only options, and result summaries
- `.env` generation for tools that still require a file on disk
- Flutter debug support with one-command setup
- Read-only secrets view with masked values
- Preset recommendations for local env-file conventions
- Recent actions and guided next-step recovery
- Shared auth flow with RunEnv CLI
- Localized UI with English base plus 8 translated locales

### Release hardening completed before publish

- Prevented stale secret persistence across reloads without valid auth/project state
- Restored auto-refresh after project initialization and environment switching
- Hardened Flutter debug setup against JSONC `tasks.json` and `launch.json`
- Removed risky direct shell interpolation from generated RunEnv command flows
- Corrected file-target resolution for multi-root workspaces

### Validation status

- `npm test` passed (`111/111`)
- `python3 ../run_vscode_dist.py` passed
- VSIX packaging and internal validation passed

### Known non-blocking note

When RunEnv rewrites `.vscode/tasks.json` or `.vscode/launch.json`, existing comments are not preserved and the files are saved back as standard JSON.

## 한국어

### 요약

RunEnv VS Code 익스텐션은 에디터 안에서 시크릿을 런타임에 주입하는 zero-disk 워크플로를 제공합니다. `.env` 파일을 커밋하거나 도구마다 시크릿을 따로 복사하지 않고, 워크스페이스를 한 번 연결한 뒤 VS Code 안에서 바로 터미널, 작업, 디버그에 시크릿을 사용할 수 있습니다.

### 주요 기능

- `Home`, `Secrets`, `Doctor Report`, `Smoke Test Checklist` 중심의 Home-first UX
- 터미널, task, debug 세션에 대한 런타임 시크릿 주입
- diff preview, overwrite/add-only, 결과 summary를 포함한 `.env` import
- 파일이 꼭 필요한 도구를 위한 `.env` generate
- Flutter 디버그용 원클릭 설정
- 마스킹된 read-only secrets 뷰
- 로컬 env-file 규칙에 맞춘 preset recommendation
- Recent actions 및 next-step recovery 흐름
- RunEnv CLI 와 공유되는 인증 흐름
- 영어 base + 번역 8개 locale 지원

### 출시 전 보강 완료 항목

- 유효한 로그인/프로젝트 없이 reload 되었을 때 stale secrets가 남지 않도록 수정
- 프로젝트 초기화와 환경 전환 이후 auto-refresh가 다시 시작되도록 수정
- JSONC 형식의 `tasks.json`, `launch.json` 에서도 Flutter debug setup 이 동작하도록 보강
- 생성되는 RunEnv 명령에서 직접 셸 문자열 보간을 제거
- multi-root workspace 에서 `.runenv.json` 이 있는 폴더를 기준으로 파일 쓰기 동작 정렬

### 검증 상태

- `npm test` 통과 (`111/111`)
- `python3 ../run_vscode_dist.py` 통과
- VSIX 패키징 및 내부 검증 통과

### 비차단 메모

RunEnv가 `.vscode/tasks.json` 또는 `.vscode/launch.json` 을 다시 저장할 때 기존 주석은 유지되지 않고 일반 JSON으로 저장됩니다.
