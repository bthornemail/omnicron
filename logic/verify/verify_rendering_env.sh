#!/usr/bin/env bash
set -euo pipefail

missing=0

check_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    printf 'ERROR: missing command: %s\n' "$cmd" >&2
    missing=1
  else
    printf 'OK: command %s\n' "$cmd"
  fi
}

check_pkg() {
  local pkg="$1"
  if ! command -v pkg-config >/dev/null 2>&1; then
    printf 'ERROR: pkg-config missing; cannot check %s\n' "$pkg" >&2
    missing=1
    return
  fi
  if ! pkg-config --exists "$pkg"; then
    printf 'ERROR: missing pkg-config package: %s\n' "$pkg" >&2
    missing=1
  else
    printf 'OK: pkg-config %s\n' "$pkg"
  fi
}

check_cmd node
check_cmd make
check_cmd cc
check_cmd pkg-config
check_cmd python3

check_pkg glfw3

if pkg-config --exists gl 2>/dev/null; then
  printf 'OK: pkg-config gl\n'
elif pkg-config --exists opengl 2>/dev/null; then
  printf 'OK: pkg-config opengl\n'
else
  printf 'WARN: no pkg-config gl/opengl entry; viewer may still link with -lGL if Mesa exposes libGL\n' >&2
fi

if pkg-config --exists glesv2 2>/dev/null; then
  printf 'OK: pkg-config glesv2\n'
else
  printf 'WARN: no pkg-config glesv2 entry; OpenGL ES experiments may need Mesa GLES packages from the rendering shell\n' >&2
fi

if [[ "$missing" -ne 0 ]]; then
  printf 'FAIL: rendering environment is incomplete.\n' >&2
  printf 'Hint: guix shell -m guix/manifest-core.scm -m guix/manifest-rendering.scm\n' >&2
  exit 1
fi

printf 'OK: rendering environment has the required host surface.\n'
