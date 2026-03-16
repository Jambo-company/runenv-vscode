# RunEnv VS Code Extension — Release Handoff / 릴리즈 인계

As of: 2026-03-13

## Status

- KO: `runenv-vscode` 는 현재 코드 기준 **배포 직전 단계**입니다. 출시 차단 이슈는 정리되었고, 남은 것은 수동 설치/업데이트 검증과 최종 QA 사인오프입니다.
- EN: `runenv-vscode` is now at the **pre-publish stage**. Release blockers were addressed; the only remaining work is manual install/update verification and final QA sign-off.

## Automated Verification

- `npm test` — passed (`111/111`)
- `python3 ../run_vscode_dist.py` — passed
- VSIX artifact — `runenv-vscode/release/runenv-0.1.0.vsix`
- l10n sync — English base + 8 translated locales, `425` keys in sync

## Final Hardening Completed In This Pass

- Prevent stale secret reuse after reload by disabling persistent env collection caching.
- Restart secret refresh after `Init Project` and `Switch Environment`.
- Stop embedding project/environment names directly into shell command strings for Flutter debug tasks and wrapped scripts.
- Parse `.vscode/tasks.json` and `.vscode/launch.json` as JSONC so comments and trailing commas do not break setup.
- Resolve the active workspace root from the folder that owns `.runenv.json` in multi-root workspaces.
- Clean up release docs that contained local absolute paths.

## Developer Handoff (KO)

- 출시 차단 기준으로 보던 이슈는 모두 수정 완료했습니다.
- 현재 기준으로 `runenv-vscode` 범위에 남아 있는 알려진 코드 차단 이슈는 없습니다.
- 패키징과 단위 테스트는 모두 통과했고, VSIX 내부 검증도 완료됐습니다.
- 이번 패스에서 수정한 핵심 파일:
  - `src/core/session.ts`
  - `src/extension.ts`
  - `src/config.ts`
  - `src/commands/init.ts`
  - `src/commands/run.ts`
  - `src/commands/flutter-debug.ts`
  - `src/commands/import-env.ts`
  - `src/commands/generate-dotenv.ts`
- 이번 패스에서 추가된 안정성 helper / 테스트:
  - `src/helpers/environment-collection.ts`
  - `src/helpers/jsonc.ts`
  - `src/helpers/runenv-command.ts`
  - `test/environment-collection.test.js`
  - `test/jsonc.test.js`
  - `test/project-config-context.test.js`
  - `test/runenv-command.test.js`
- 비차단 메모:
  - RunEnv가 `tasks.json` / `launch.json` 을 다시 저장할 때 주석은 유지되지 않고 일반 JSON으로 저장됩니다.
  - 이 부분은 출시 차단은 아니지만 후속 개선 항목으로 추적하는 것이 좋습니다.

## Developer Handoff (EN)

- All release-blocking issues identified in the final review have been addressed.
- There are no known code-level blockers left inside `runenv-vscode`.
- Unit tests, packaging, and VSIX internal validation are passing.
- Core files touched in this pass:
  - `src/core/session.ts`
  - `src/extension.ts`
  - `src/config.ts`
  - `src/commands/init.ts`
  - `src/commands/run.ts`
  - `src/commands/flutter-debug.ts`
  - `src/commands/import-env.ts`
  - `src/commands/generate-dotenv.ts`
- New hardening helpers / tests added in this pass:
  - `src/helpers/environment-collection.ts`
  - `src/helpers/jsonc.ts`
  - `src/helpers/runenv-command.ts`
  - `test/environment-collection.test.js`
  - `test/jsonc.test.js`
  - `test/project-config-context.test.js`
  - `test/runenv-command.test.js`
- Non-blocking note:
  - When RunEnv rewrites `tasks.json` / `launch.json`, existing comments are not preserved and the files are saved as standard JSON.
  - This is acceptable for release, but should remain on the post-launch improvement list.

## QA / QC Handoff (KO)

- 아래 시나리오를 최소 기준으로 확인해 주세요.

1. clean profile 설치
   - VSIX 설치 → `Home` 오픈 → 로그인 → `Init Project` → `Load Secrets` → 터미널 오픈
2. 업데이트 설치
   - 이전 빌드 위에 설치 후 재시작 → 상태바 / Home / Secrets 동작 확인
3. 로그아웃 / 언로드
   - `Unload Secrets` 와 `Logout` 후 기존 터미널/새 터미널에 값이 남지 않는지 확인
4. import / generate
   - `.env` import preview / overwrite / add-only / 결과 summary 확인
   - `.env` generate 후 `.gitignore` 반영 확인
5. Flutter debug setup
   - 주석이나 trailing comma가 있는 `tasks.json` / `launch.json` 에서도 설정이 실패하지 않는지 확인
   - F5 전 `.env` 생성 / 종료 후 clean 동작 확인
6. 세션 만료 / 401
   - 세션 만료 시 경고, 상태바, 재로그인 유도 흐름 확인
7. 멀티 루트 워크스페이스
   - 첫 번째 폴더가 아니라 다른 폴더에 `.runenv.json` 이 있을 때 import/generate/flutter setup 이 올바른 폴더에 쓰이는지 확인
8. zero-secret 환경
   - 시크릿 0개 환경에서도 에러 없이 상태 표시와 terminal activation 이 되는지 확인

## QA / QC Handoff (EN)

- Please verify at least the following scenarios.

1. Clean-profile install
   - Install the VSIX → open `Home` → login → `Init Project` → `Load Secrets` → open a terminal
2. Update install
   - Install over a previous build, restart VS Code, and verify status bar / Home / Secrets behavior
3. Logout / unload
   - Confirm that `Unload Secrets` and `Logout` remove values from existing and new terminals
4. Import / generate
   - Verify `.env` import preview, overwrite vs add-only behavior, and result summaries
   - Verify `.env` generation and `.gitignore` updates
5. Flutter debug setup
   - Confirm setup still works when `tasks.json` / `launch.json` contain comments or trailing commas
   - Verify `.env` creation before debug and cleanup after debug
6. Expired session / 401 handling
   - Confirm warning UI, status bar state, and re-login guidance
7. Multi-root workspace
   - When `.runenv.json` lives in a non-first folder, confirm import/generate/flutter setup write to the correct workspace
8. Zero-secret environment
   - Confirm no-error activation and correct UI state when an environment contains zero secrets

## Remaining Before Publish

- Run the manual steps in `RELEASE_CHECKLIST.md`
- Record QA pass/fail notes
- Approve final publisher upload
- Use `RELEASE_NOTES_0.1.0.md` and `MARKETPLACE_COPY.md` as the publish-time copy source

## Post-Launch Backlog (Non-Blocking)

- Preserve comments when updating `tasks.json` / `launch.json`
- Add higher-level integration coverage against a real VS Code Extension Host
- Add final marketplace screenshots / listing polish if needed
