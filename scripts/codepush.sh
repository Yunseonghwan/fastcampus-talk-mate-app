#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
fi

usage() {
  cat <<EOF
Usage: $0 <command> <platform> [options]

Commands:
  create-history   새 바이너리 버전의 릴리스 히스토리 생성
  release          CodePush 업데이트 릴리스
  show-history     릴리스 히스토리 조회
  update-history   릴리스 히스토리 수정

Platform: ios | android

Options:
  --binary-version, -b   바이너리 앱 버전 (필수)
  --app-version, -a      CodePush 업데이트 버전 (release 시 필수)
  --identifier, -i       식별자 (기본값: production)
  --mandatory, -m        필수 업데이트 여부 (기본값: false)
  --rollout, -r          롤아웃 비율 0~100 (기본값: 100)
  --enable, -e           활성화 여부 (update-history 시 사용)

Examples:
  npm run codepush:create-history:ios -- 1.0.0
  npm run codepush:release:android -- 1.0.0 1.0.1
  npm run codepush:release:ios -- 1.0.0 1.0.1 -m true -r 50
  npm run codepush:show-history:ios -- 1.0.0
  npm run codepush:rollback:ios -- 1.0.0 1.0.1
EOF
  exit 1
}

if [ $# -lt 2 ]; then
  usage
fi

COMMAND="$1"
PLATFORM="$2"
shift 2

if [[ "$PLATFORM" != "ios" && "$PLATFORM" != "android" ]]; then
  echo "Error: platform must be 'ios' or 'android'"
  exit 1
fi

BINARY_VERSION=""
APP_VERSION=""
IDENTIFIER="production"
MANDATORY="false"
ROLLOUT="100"
ENABLE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --binary-version|-b) BINARY_VERSION="$2"; shift 2 ;;
    --app-version|-a)    APP_VERSION="$2"; shift 2 ;;
    --identifier|-i)     IDENTIFIER="$2"; shift 2 ;;
    --mandatory|-m)      MANDATORY="$2"; shift 2 ;;
    --rollout|-r)        ROLLOUT="$2"; shift 2 ;;
    --enable|-e)         ENABLE="$2"; shift 2 ;;
    *)
      if [ -z "$BINARY_VERSION" ]; then
        BINARY_VERSION="$1"; shift
      elif [ -z "$APP_VERSION" ]; then
        APP_VERSION="$1"; shift
      else
        echo "Unknown option: $1"; usage
      fi
      ;;
  esac
done

case "$COMMAND" in
  create-history)
    if [ -z "$BINARY_VERSION" ]; then
      echo "Error: --binary-version (-b) is required"
      exit 1
    fi
    echo "Creating release history for $PLATFORM v$BINARY_VERSION ($IDENTIFIER)..."
    npx code-push create-history \
      --binary-version "$BINARY_VERSION" \
      --platform "$PLATFORM" \
      --identifier "$IDENTIFIER"
    echo "Done! Release history created."
    ;;

  release)
    if [ -z "$BINARY_VERSION" ] || [ -z "$APP_VERSION" ]; then
      echo "Error: --binary-version (-b) and --app-version (-a) are required"
      exit 1
    fi
    echo "Releasing CodePush update $APP_VERSION for $PLATFORM (binary: $BINARY_VERSION, $IDENTIFIER)..."
    npx code-push release \
      --framework expo \
      --binary-version "$BINARY_VERSION" \
      --app-version "$APP_VERSION" \
      --platform "$PLATFORM" \
      --identifier "$IDENTIFIER" \
      --entry-file index.js \
      --mandatory "$MANDATORY" \
      --rollout "$ROLLOUT"
    echo "Done! CodePush $APP_VERSION released."
    ;;

  show-history)
    if [ -z "$BINARY_VERSION" ]; then
      echo "Error: --binary-version (-b) is required"
      exit 1
    fi
    npx code-push show-history \
      --binary-version "$BINARY_VERSION" \
      --platform "$PLATFORM" \
      --identifier "$IDENTIFIER"
    ;;

  update-history)
    if [ -z "$BINARY_VERSION" ] || [ -z "$APP_VERSION" ]; then
      echo "Error: --binary-version (-b) and --app-version (-a) are required"
      exit 1
    fi
    CMD="npx code-push update-history \
      --binary-version $BINARY_VERSION \
      --app-version $APP_VERSION \
      --platform $PLATFORM \
      --identifier $IDENTIFIER"
    [ -n "$ENABLE" ] && CMD="$CMD --enable $ENABLE"
    [ "$MANDATORY" != "false" ] && CMD="$CMD --mandatory $MANDATORY"
    [ "$ROLLOUT" != "100" ] && CMD="$CMD --rollout $ROLLOUT"
    echo "Updating history for $PLATFORM $APP_VERSION..."
    eval "$CMD"
    echo "Done!"
    ;;

  *)
    echo "Unknown command: $COMMAND"
    usage
    ;;
esac
