# RunEnv VS Code 릴리즈 체크리스트

## 1. 자동 검증 (CI 대체 가능)

```bash
cd runenv-vscode && npm test
python3 ../run_vscode_dist.py
```

자동 검증이 확인하는 항목:

- [ ] `npm test` 통과 (compile → l10n sync → 111 unit tests)
- [ ] VSIX 생성 (`runenv-vscode/release/runenv-<version>.vsix`)
- [ ] 필수 파일: `dist/extension.js`, `resources/runenv-sidebar.svg`, `l10n/bundle.l10n.*.json`
- [ ] 필수 command: `runenv.quickStart`, `runenv.openHome`, `runenv.status`, `runenv.doctor`, `runenv.smokeChecklist`
- [ ] 필수 view: `runenvHome`, `runenvSecrets`
- [ ] 필수 walkthrough: `runenv.gettingStarted`
- [ ] welcome state ≥ 3
- [ ] 중복 command/view id 없음
- [ ] 제외 파일 미포함: `src/`, `test/`, `RELEASE_CHECKLIST.md`, `IMPLEMENTATION_SUMMARY.md`, `check_l10n_sync.js`, `todo.md`
- [ ] l10n 키 일관성: 영어 base + 번역 8개 locale 동기화 유지 (현재 locale 당 425 keys)

## 2. 수동 검증: Clean Install

> **환경 준비**: 로컬 API 서버가 필요합니다.
> ```bash
> python3 run_dev.py          # 다른 터미널에서 먼저 실행
> ```

### 2-1. Clean Profile 설치

```bash
python3 run_vscode_dev.py     # Extension Development Host 실행
```

또는 직접 VSIX 설치:

```bash
rm -rf /tmp/runenv-vsix-verify
mkdir -p /tmp/runenv-vsix-verify/{user-data,extensions}
code --install-extension runenv-vscode/release/runenv-0.1.0.vsix \
     --extensions-dir /tmp/runenv-vsix-verify/extensions --force
code --new-window \
     --user-data-dir /tmp/runenv-vsix-verify/user-data \
     --extensions-dir /tmp/runenv-vsix-verify/extensions \
     /path/to/test/workspace
```

확인 항목:

- [ ] Activity Bar에 RunEnv 아이콘 (구름) 노출
- [ ] `Home` / `Secrets` 뷰 정상 렌더링
- [ ] Status bar에 `RunEnv: Not logged in` 표시
- [ ] Status bar 클릭 → `Home` 열림
- [ ] Command Palette에 `Quick Start`, `Doctor Report`, `Smoke Test Checklist` 존재

### 2-2. Core Flow (서버 연결 필요)

- [ ] `Quick Start` 실행 → 브라우저 로그인 → 성공 메시지
- [ ] `Home > Progress`에 로그인 체크 표시
- [ ] `Init Project` → 프로젝트/환경 선택 → `.runenv.json` 생성
- [ ] `Load Secrets` → status bar에 `✅ RunEnv: project/env (N)` 표시
- [ ] 터미널 열기 → `echo $SECRET_KEY` 로 secret 주입 확인
- [ ] `Doctor Report` → 현재 workspace 상태 반영
- [ ] `Home > Recent` → 마지막 실행 기록 노출 및 클릭 가능

### 2-3. File Flow (서버 연결 필요)

- [ ] `.env` 파일 import → diff preview (`new / changed / unchanged`)
- [ ] `Overwrite Existing Values` / `Only Add Missing Keys` 모두 테스트
- [ ] `.env` generate → `.gitignore` 자동 추가 확인
- [ ] 로그아웃 / reload 후 stale secrets 가 남지 않는지 확인
- [ ] Preset recommendation 표시 시 one-click apply 확인
- [ ] `.env` 파일 열기 → editor title에 import/doctor 액션 표시
- [ ] `.runenv.json` 열기 → editor title actions 표시
- [ ] `.runenv.json` 고의 파손 → RunEnv diagnostics 표시 확인

## 3. 수동 검증: Update Install

- [ ] 이전 버전 VSIX가 설치된 상태에서 새 VSIX 설치
- [ ] 기존 command, view, walkthrough, welcome state, status bar 정상 동작
- [ ] 중복 command/view registration 오류 없음
- [ ] F5 디버그 → 개발 모드에서도 동일 확인

## 4. 다국어 검증 (선택)

- [ ] VS Code 표시 언어를 한국어로 변경 → UI 라벨 한국어로 표시
- [ ] VS Code 표시 언어를 일본어로 변경 → UI 라벨 일본어로 표시
- [ ] VS Code 표시 언어를 스페인어로 변경 → UI 라벨 스페인어로 표시
- [ ] `ar`, `bn`, `hi`, `jv`, `sw` 중 하나로 변경 → 누락 문자열 없이 번들 로드 확인
- [ ] 지원하지 않는 언어 → 영어 fallback 확인

## 5. 릴리즈 결정

- [ ] 위 1~3 전부 통과
- [ ] 확장 내장 `Smoke Test Checklist` 전체 항목 체크됨
- [ ] **clean-install + update-install** 모두 통과한 뒤에만 퍼블리시
