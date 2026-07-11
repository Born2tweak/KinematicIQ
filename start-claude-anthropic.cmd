@echo off
REM Clears 9Router env vars from THIS terminal session, then starts Claude Code on Anthropic account auth.
set ANTHROPIC_BASE_URL=
set ANTHROPIC_AUTH_TOKEN=
set ANTHROPIC_API_KEY=
set ANTHROPIC_DEFAULT_SONNET_MODEL=
set ANTHROPIC_DEFAULT_OPUS_MODEL=
set ANTHROPIC_DEFAULT_HAIKU_MODEL=
cd /d "%~dp0"
echo Starting Claude Code (direct Anthropic, not 9Router)...
claude
