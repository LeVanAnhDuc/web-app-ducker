#!/usr/bin/env bash
# commit-lint.sh - validate a commit subject against Conventional Commits 1.0.0.
#
#   bash .githooks/commit-lint.sh --subject "feat(engine): pathfinding"
#   bash .githooks/commit-lint.sh --file .git/COMMIT_EDITMSG
#   bash .githooks/commit-lint.sh --range v1.2.0..HEAD
#   bash .githooks/commit-lint.sh --types      # types currently accepted
#   bash .githooks/commit-lint.sh --groups     # types + release-note buckets (machine readable)
#   bash .githooks/commit-lint.sh --doctor     # effective rule + drift against cliff.toml
#
# Exit 0 when valid, 1 when not. Errors print how to fix them.
#
# THIS FILE IS THE SOURCE OF TRUTH FOR THE TYPE LIST.
#
# It does not read cliff.toml, and that is deliberate. A project that has not
# installed the `release-note` skill has no cliff.toml, yet it still needs a commit
# rule. Defining the rule in cliff.toml would make the shared rule exist only in
# repos that installed a library - the common thing depending on the optional one.
# The direction runs the other way: this rule stands alone, and `release-note`
# READS FROM HERE (`--groups`) to generate its buckets.
set -uo pipefail

# ── The shared rule ────────────────────────────────────────────────────
# The 11 types of Conventional Commits / conventional-changelog. They apply to
# EVERY project - no install, no package.json, no cliff.toml required.
#
# The first column is the bucket order in release notes. 01-03 is what users see;
# 20+ is what the people writing the code care about. The 04-19 range is left
# EMPTY on purpose - that is where a project slots its own types into the
# user-facing zone (see ext_file).
STANDARD_TYPES='
01 feat     = Features
02 fix      = Fixes
03 perf     = Performance
20 refactor = Refactoring
21 style    = Styling
22 docs     = Documentation
23 test     = Tests
24 build    = Build
25 ci       = CI
26 chore    = Chores
27 revert   = Reverts
'

MAX_SUBJECT_DEFAULT=72

repo_root() {
  git rev-parse --show-toplevel 2>/dev/null || pwd
}

# The project's OWN extension file. Its EXISTENCE is the signal "this project has
# a custom setup" - no file means no exceptions, and nothing has to be guessed.
ext_file() {
  printf '%s/.githooks/commit-types' "$(repo_root)"
}

# Prints three columns: <order>\t<type>\t<release-note bucket>
# This is the INTERFACE between the two skills. `release-note` calls exactly this
# to generate commit_parsers, so the two sides cannot declare different lists.
groups() {
  local ext
  ext=$(ext_file)
  {
    printf '%s\n' "$STANDARD_TYPES"
    # `[ -f ] && cat` as the LAST command of the group would make the group exit 1
    # whenever the extension file is absent - which is the common case - and
    # `set -o pipefail` would then propagate that as the exit status of --groups.
    if [ -f "$ext" ]; then cat "$ext"; fi
  } | awk '
    BEGIN { auto = 50 }
    {
      sub(/#.*/, "")
      gsub(/^[ \t]+|[ \t]+$/, "")
      if ($0 == "") next

      order = ""
      line  = $0
      if (match(line, /^[0-9][0-9][ \t]+/)) {
        order = substr(line, 1, 2)
        line  = substr(line, RSTART + RLENGTH)
      }

      name = line; label = ""
      if (index(line, "=") > 0) {
        name  = substr(line, 1, index(line, "=") - 1)
        label = substr(line, index(line, "=") + 1)
      }
      gsub(/^[ \t]+|[ \t]+$/, "", name)
      gsub(/^[ \t]+|[ \t]+$/, "", label)

      if (name == "max_subject") next
      if (name !~ /^[a-z][a-z0-9-]*$/) next

      # Later lines override earlier ones, so one line in .githooks/commit-types
      # can rename a standard bucket without restating its order.
      if (order == "") order = (name in ord) ? ord[name] : sprintf("%02d", auto++)
      if (label == "") label = (name in lbl) ? lbl[name] : toupper(substr(name, 1, 1)) substr(name, 2)
      ord[name] = order
      lbl[name] = label
    }
    END { for (n in lbl) printf "%s\t%s\t%s\n", ord[n], n, lbl[n] }
  ' | sort -k1,1 -k2,2
}

allowed_types() {
  groups | cut -f2 | tr '\n' ' ' | sed 's/ $//'
}

max_subject() {
  local ext n
  ext=$(ext_file)
  if [ -f "$ext" ]; then
    n=$(sed -nE 's/^[[:space:]]*max_subject[[:space:]]*=[[:space:]]*([0-9]+).*/\1/p' "$ext" | tail -1)
    [ -n "${n:-}" ] && { printf '%s' "$n"; return; }
  fi
  printf '%s' "$MAX_SUBJECT_DEFAULT"
}

# Subjects that are NOT authored prose, or that git generates itself -> let through.
is_exempt() {
  case "$1" in
    Merge\ *|Revert\ *|fixup!\ *|squash!\ *|amend!\ *) return 0 ;;
    "Initial commit") return 0 ;;
  esac
  return 1
}

fail() { printf '  x %s\n' "$1" >&2; }

# validate_subject <subject> -> 0/1
validate_subject() {
  local subject="$1"
  local types pattern limit ok=0

  is_exempt "$subject" && return 0

  types=$(allowed_types)
  limit=$(max_subject)
  pattern="^($(printf '%s' "$types" | tr -s ' ' '|' | sed 's/|$//'))(\([^)]+\))?!?: .+"

  if ! printf '%s' "$subject" | grep -qE "$pattern"; then
    fail "bad format: $subject"
    printf '     expected: <type>[(<scope>)][!]: <description>\n' >&2
    printf '     accepted types: %s\n' "$types" >&2
    printf '     project-specific types live in: .githooks/commit-types\n' >&2
    printf '     examples: feat(engine): pathfinding\n' >&2
    printf '               fix(ui)!: drop the legacy prop\n' >&2
    ok=1
  fi

  if [ "${#subject}" -gt "$limit" ]; then
    fail "subject is ${#subject} chars, limit is $limit: $subject"
    ok=1
  fi

  case "$subject" in
    *.) fail "subject must not end with a period: $subject"; ok=1 ;;
  esac

  return $ok
}

# Markers only work in the SUBJECT. In the body they are inert - warn, do not block.
# Only warn when the project actually HAS release-note (has cliff.toml): elsewhere
# those three strings mean nothing, and warning about them is just noise.
warn_markers_in_body() {
  local file="$1" subject body m
  [ -f "$(repo_root)/cliff.toml" ] || return 0
  subject=$(head -1 "$file")
  body=$(tail -n +2 "$file" | grep -v '^#' || true)
  for m in '[skip release]' '[release minor]' '[release major]'; do
    case "$body" in
      *"$m"*)
        case "$subject" in
          *"$m"*) ;;
          *) printf '  ! "%s" sits in the body, where it has NO effect. Move it to the subject if you meant it.\n' "$m" >&2 ;;
        esac
        ;;
    esac
  done
}

# Compare the effective rule against cliff.toml, when the project installed
# release-note. Drift in either direction is a real bug:
#   - cliff.toml has a bucket for a type the hook rejects -> that bucket stays empty
#   - the hook accepts a type cliff.toml does not know    -> those commits land in Other
doctor() {
  local root cfg types cfg_types cfg_flat t rc=0
  root=$(repo_root)
  types=$(allowed_types)

  printf 'repo           %s\n' "$root"
  printf 'types          %s\n' "$types"
  printf 'subject limit  %s chars\n' "$(max_subject)"
  if [ -f "$(ext_file)" ]; then
    printf 'extensions     .githooks/commit-types PRESENT - this project has a custom setup\n'
  else
    printf 'extensions     none - running the shared rule as-is\n'
  fi

  cfg="$root/cliff.toml"
  if [ ! -f "$cfg" ]; then
    printf 'release-note   not installed (no cliff.toml) - the commit rule is still fully in force\n'
    return 0
  fi

  cfg_types=$(sed -nE 's/^[[:space:]]*\{[[:space:]]*message[[:space:]]*=[[:space:]]*"\^([a-z][a-z0-9-]*)".*/\1/p' "$cfg" | sort -u)
  cfg_flat=" $(printf '%s' "$cfg_types" | tr '\n' ' ') "
  printf 'release-note   installed (cliff.toml)\n'

  for t in $cfg_types; do
    case " $types " in
      *" $t "*) ;;
      *) printf '  x cliff.toml has a "%s" bucket but the hook rejects that type -> bucket stays empty forever\n' "$t" >&2; rc=1 ;;
    esac
  done
  for t in $types; do
    case "$cfg_flat" in
      *" $t "*) ;;
      *) printf '  x the hook accepts "%s" but cliff.toml has no bucket -> those commits land in Other\n' "$t" >&2; rc=1 ;;
    esac
  done

  if [ "$rc" -eq 0 ]; then
    printf '  v the commit rule and cliff.toml agree\n'
  else
    printf '  fix with: bash <skills>/release-note/scripts/install.sh %s --force\n' "$root" >&2
  fi
  return $rc
}

main() {
  case "${1:-}" in
    --types)  allowed_types; echo ;;
    --groups) groups ;;
    --doctor) doctor ;;
    --subject)
      validate_subject "${2:?a subject is required}"
      ;;
    --file)
      local f="${2:?a file path is required}" subject
      subject=$(head -1 "$f")
      warn_markers_in_body "$f"
      validate_subject "$subject"
      ;;
    --range)
      local range="${2:?a range is required, e.g. v1.2.0..HEAD}"
      local bad=0 n=0 s
      while IFS= read -r s; do
        [ -z "$s" ] && continue
        n=$((n + 1))
        validate_subject "$s" || bad=1
      done < <(git log --no-merges --pretty=%s "$range")
      if [ "$bad" -eq 0 ]; then
        printf 'v all %d commits in %s meet Conventional Commits\n' "$n" "$range"
      fi
      return $bad
      ;;
    *)
      printf 'usage: %s --subject <s> | --file <path> | --range <a..b> | --types | --groups | --doctor\n' "$0" >&2
      return 2
      ;;
  esac
}

main "$@"
