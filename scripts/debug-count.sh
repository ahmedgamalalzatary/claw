#!/usr/bin/env bash
cd "$(dirname "$0")/.." || exit 1

TMPFILE=$(mktemp)
echo "TMPFILE=$TMPFILE"
trap 'rm -f "$TMPFILE"' EXIT

find . \
  -path '*/node_modules' -prune -o \
  -path '*/dist' -prune -o \
  -path '*/.git' -prune -o \
  -path '*/data' -prune -o \
  \( \
    -name '*.ts' -o \
    -name '*.tsx' -o \
    -name '*.json' -o \
    -name '*.md' \
  \) -print | while IFS= read -r file; do
    count=$(wc -l < "$file" 2>/dev/null)
    printf "%d\t%s\n" "$count" "${file#./}"
  done | sort -rn > "$TMPFILE"

echo "TMPFILE line count: $(wc -l < "$TMPFILE")"
echo "First 3 lines of TMPFILE:"
head -3 "$TMPFILE"

total_lines=$(awk '{sum += $1} END {print sum+0}' "$TMPFILE")
total_files=$(wc -l < "$TMPFILE" | tr -d ' ')

echo "TOTAL_LINES=$total_lines"
echo "TOTAL_FILES=$total_files"
