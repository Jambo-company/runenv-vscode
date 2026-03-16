# RunEnv VS Code 확장 구현 요약

기준일: 2026-03-13

## 범위

- 대상: `runenv-vscode`
- 목표: 출시 가능한 수준의 VS Code 확장 UX / 런타임 안정성 확보
- 제약: native VS Code UI만 사용, WebView 미사용

## 현재 상태

- 상태: 배포 직전 단계 / release-candidate
- 코드 차단 이슈: 현재 `runenv-vscode` 범위에서는 없음
- 남은 작업: clean install, update install, smoke verification 같은 수동 QA만 남음

## 주요 완료 영역

### 1. 제품 UX

- `Home`를 메인 워크스페이스 화면으로 정리
- `Quick Start`를 setup / recovery 전용으로 제한
- `Workspace Actions`를 compact action menu로 정리
- `Secrets`는 read-only + setup-aware 뷰로 유지
- `Doctor Report`, `Smoke Test Checklist`, `Recent`, editor-title actions를 핵심 흐름에 통합

### 2. Shared Runtime Model

- 공유 surface state를 `workspace-context.ts` 로 일원화
- Home, status bar, doctor report, smoke checklist, action menu가 같은 workspace 해석을 사용
- preset recommendation, next-step guidance, setup status를 surface 간에 일관되게 유지

### 3. 최종 출시 보강 작업

- 유효한 로그인/프로젝트 없이 재시작했을 때 stale secrets가 남지 않도록 terminal env persistence 비활성화
- `Init Project`, `Switch Environment` 이후 secret refresh timer가 다시 시작되도록 수정
- Flutter debug task 생성과 script wrapping 에서 직접 셸 문자열 보간을 제거
- `.vscode/tasks.json`, `.vscode/launch.json` 을 JSONC 로 파싱하도록 보강
- multi-root workspace 에서 `.runenv.json` 을 가진 폴더를 기준으로 파일 쓰기 동작을 정렬
- 로컬 절대경로가 섞여 있던 release 문서 정리

### 4. 다국어

- 모든 사용자 노출 문자열에 `vscode.l10n.t()` 적용
- 영어 base + 번역 8개 locale 동기화 완료
- 현재 번들 수: locale 당 `425` keys

### 5. 테스트 / 패키징 검증

- `npm test` — `111/111` 통과
- `python3 ../run_vscode_dist.py` — 통과
- VSIX 내부 검증 — 통과
- 현재 산출물: `runenv-vscode/release/runenv-0.1.0.vsix`

## 최종 보강에서 중요하게 바뀐 파일

- `src/core/session.ts`
- `src/extension.ts`
- `src/config.ts`
- `src/commands/init.ts`
- `src/commands/run.ts`
- `src/commands/flutter-debug.ts`
- `src/commands/import-env.ts`
- `src/commands/generate-dotenv.ts`
- `src/helpers/environment-collection.ts`
- `src/helpers/jsonc.ts`
- `src/helpers/runenv-command.ts`

## 비차단 메모

- RunEnv가 `tasks.json` / `launch.json` 을 다시 저장할 때 기존 주석은 유지되지 않고 일반 JSON으로 저장됩니다.
- 출시 차단 이슈는 아니지만, 후속 개선 백로그에는 남겨두는 것이 좋습니다.

## 결론

구현 품질, 유지보수성, 안정성, 패키징 기준으로는 현재 확장이 배포 직전 단계에 도달했습니다. 남은 것은 추가 코어 개발이 아니라 수동 QA 사인오프입니다.
