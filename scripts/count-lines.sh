#!/usr/bin/env bash
# count-lines.sh — Count lines in dev source files under CWD

TMPFILE=$(mktemp)
trap 'rm -f "$TMPFILE"' EXIT

find . \
  -path '*/node_modules' -prune -o \
  -path '*/dist' -prune -o \
  -path '*/.git' -prune -o \
  -path '*/data' -prune -o \
  \( \
    -name '*.ts' -o \
    -name '*.tsx' -o \
    -name '*.js' -o \
    -name '*.jsx' -o \
    -name '*.mts' -o \
    -name '*.cts' -o \
    -name '*.json' -o \
    -name '*.md' \
  \) -print | while IFS= read -r file; do
    count=$(wc -l < "$file" 2>/dev/null)
    printf "%d\t%s\n" "$count" "${file#./}"
  done | sort -rn > "$TMPFILE"

total_lines=$(awk '{sum += $1} END {print sum+0}' "$TMPFILE")
total_files=$(wc -l < "$TMPFILE" | tr -d ' ')

printf "%-8s %s\n" "Lines" "File"
printf "%-8s %s\n" "-----" "----"

while IFS=$'\t' read -r count filepath; do
  printf "%-8d %s\n" "$count" "$filepath"
done < "$TMPFILE"

echo "-----------------------------------------"
printf "Total: %d lines across %d files\n" "$total_lines" "$total_files"
