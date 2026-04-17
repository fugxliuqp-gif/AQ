# Skill 清单

## 一、Kimi CLI 内置 Skills

| 名称 | 路径 | 说明 |
|------|------|------|
| `kimi-cli-help` | `~/.local/lib/python3.12/site-packages/kimi_cli/skills/kimi-cli-help/` | 解答 Kimi Code CLI 的使用、配置和故障排查问题 |
| `skill-creator` | `~/.local/lib/python3.12/site-packages/kimi_cli/skills/skill-creator/` | 创建有效 Skill 的指南 |

## 二、当前环境的自定义 Skills（Kimi 可直接加载）

位于当前工作目录 `/mnt/c/Users/davidfu/.config/agents/skills/` 下，共 **2** 个：

| 名称 | 说明 |
|------|------|
| `launch-daily-apps` | 一键以管理员权限批量启动 Windows 常用软件（WSL、V2rayN、Snipaste、SKLoader 等） |
| `windows-software-management` | Windows 软件安装/卸载/更新管理，支持 winget、chocolatey、scoop 及静默安装 .exe/.msi |

## 三、其他项目级 / 编辑器级 Skills（hermes-agent 除外）

### 1. `ai-admin-demo` 项目技能（9 个）
位于 `~/projects/ai-admin-demo/.agents/skills/`：
- `system-architect` / `e2e-runner` / `feature-planner` / `security-reviewer` / `build-error-resolver` / `doc-updater` / `code-reviewer` / `tdd-guide` / `refactor-cleaner`

### 2. `.cursor` 编辑器技能（11 个）
位于 `~/.cursor/skills-cursor/`：
- `babysit` / `canvas` / `create-hook` / `create-rule` / `create-skill` / `create-subagent` / `migrate-to-skills` / `shell` / `statusline` / `update-cli-config` / `update-cursor-settings`

### 3. `openclaw` 工具技能（60+ 个）
位于 `~/.npm-global/lib/node_modules/openclaw/skills/` 及 `extensions/*/skills/`：
- 核心：`github`, `notion`, `obsidian`, `slack`, `spotify-player`, `gemini`, `canvas`, `tmux`, `weather` 等
- 扩展：`feishu-doc`, `feishu-drive`, `feishu-perm`, `feishu-wiki`, `diffs`, `prose`, `acp-router` 等

### 4. 其他散落的 Skills
- **Cursor Server / Cline 扩展**: `create-pull-request`
- **VS Code 扩展**: Copilot Chat (`troubleshoot`, `install-vscode-extension` 等)、Python Envs (`run-integration-tests`, `run-smoke-tests` 等)
- **Dify 插件**: `md_exporter`
- **fastapi 库自带**: `fastapi`

## 四、统计汇总

| 类别 | 数量 |
|------|------|
| Kimi CLI 内置 Skill | **2** |
| 当前环境自定义 Skill（`.config/agents/skills/`） | **2** |
| `ai-admin-demo` 项目 Skill | **9** |
| `.cursor` 编辑器 Skill | **11** |
| `openclaw` 工具 Skill | **60+** |
| 其他扩展/工具 Skill | **10+** |

**结论**：排除 `hermes-agent` 后，当前工作目录下 Kimi 可直接加载的**自定义 Skill 有 2 个**（`launch-daily-apps` 和 `windows-software-management`），加上内置 2 个，当前环境直接可用的 Skill 共 **4** 个。
