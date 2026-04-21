#!/usr/bin/env bash

set -euo pipefail

release_type="patch"
publish="false"
publish_current="false"

usage() {
  cat <<'EOF'
Usage: scripts/release-quiver.sh [patch|minor|major|x.y.z] [--publish | --publish-current]

By default the script performs a release dry run:
  - validates the installer smoke
  - validates the package artifact
  - prints the versioning and publish commands to run next

Pass --publish to run npm version and npm publish after the smoke checks pass.
Pass --publish-current to publish the current package version without forcing a patch bump.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --publish)
      publish="true"
      shift
      ;;
    --publish-current)
      publish_current="true"
      publish="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      release_type="$1"
      shift
      ;;
  esac
done

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "FAIL: release requires a clean worktree" >&2
  exit 1
fi

bash scripts/ci/smoke-create-quiver.sh
bash scripts/package-quiver.sh

if [[ "$publish" == "false" ]]; then
  echo "Release dry run passed."
  echo "Next commands:"
  if [[ "$publish_current" == "true" ]]; then
    echo "  npm publish --access public"
  else
    echo "  npm version $release_type -m \"chore(release): %s\""
    echo "  npm publish --access public"
  fi
  echo "  git push origin HEAD --tags"
  exit 0
fi

if [[ "$publish_current" == "true" ]]; then
  npm publish --access public
  git push origin HEAD --tags
  exit 0
fi

npm version "$release_type" -m "chore(release): %s"
npm publish --access public
git push origin HEAD --tags
