export interface RunenvIssueState {
  title: string
  detail: string
  command?: {
    id: string
    title: string
  }
}

export class WorkspaceSessionStore {
  private _loadedSecretCount = 0
  private _loadedProject = ''
  private _loadedEnv = ''
  private _loadedSecrets: Record<string, string> = {}
  private _lastRefreshTime: Date | null = null
  private _isLoading = false
  private _issue: RunenvIssueState | null = null

  get loadedSecretCount() {
    return this._loadedSecretCount
  }

  get loadedProject() {
    return this._loadedProject
  }

  get loadedEnv() {
    return this._loadedEnv
  }

  get loadedSecrets() {
    return this._loadedSecrets
  }

  get lastRefreshTime() {
    return this._lastRefreshTime
  }

  get isLoading() {
    return this._isLoading
  }

  get issue() {
    return this._issue
  }

  get activeSecrets() {
    if (!this._loadedProject || !this._loadedEnv) {
      return null
    }

    return {
      project: this._loadedProject,
      env: this._loadedEnv,
      secrets: this._loadedSecrets,
    }
  }

  hasLoadedSession(project?: { project: string; env: string } | null) {
    if (!this._loadedProject || !this._loadedEnv) {
      return false
    }

    if (!project) {
      return true
    }

    return (
      this._loadedProject === project.project && this._loadedEnv === project.env
    )
  }

  setLoadedSecrets(
    project: string,
    env: string,
    secrets: Record<string, string>,
    count: number
  ) {
    this._loadedSecretCount = count
    this._loadedProject = project
    this._loadedEnv = env
    this._loadedSecrets = secrets
    this._lastRefreshTime = new Date()
  }

  clearLoadedSecrets() {
    this._loadedSecretCount = 0
    this._loadedProject = ''
    this._loadedEnv = ''
    this._loadedSecrets = {}
    this._lastRefreshTime = null
  }

  setLoading(isLoading: boolean) {
    this._isLoading = isLoading
  }

  setIssue(issue: RunenvIssueState | null) {
    this._issue = issue
  }

  clearIssue() {
    this._issue = null
  }
}
