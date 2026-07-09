#!/usr/bin/env python3
"""
Script to fix width support issues:
1. Update max-width from 1024px to 1440px where appropriate
2. Ensure proper responsive breakpoints
"""
import os
import re
from pathlib import Path

# Get all HTML files
html_files = list(Path('.').glob('*.html'))

# Statistics
files_updated = 0
width_changes = 0

def fix_max_width(content):
    """Update max-width constraints to support 1440px"""
    changes = 0

    # Pattern 1: max-width: 1024px in main containers/layouts
    # We'll update to 1440px for main content areas
    patterns_to_update = [
        # Main content, container, layout max-widths
        (r'(\.main-content\s*{[^}]*?max-width:\s*)1024px', r'\g<1>1440px'),
        (r'(\.container\s*{[^}]*?max-width:\s*)1024px', r'\g<1>1440px'),
        (r'(\.layout\s*{[^}]*?max-width:\s*)1024px', r'\g<1>1440px'),
        (r'(\.content\s*{[^}]*?max-width:\s*)1024px', r'\g<1>1440px'),
        (r'(\.page-container\s*{[^}]*?max-width:\s*)1024px', r'\g<1>1440px'),

        # Common inline styles
        (r'(style="[^"]*?max-width:\s*)1024px', r'\g<1>1440px'),
    ]

    new_content = content
    for pattern, replacement in patterns_to_update:
        matches = re.findall(pattern, new_content, re.DOTALL)
        if matches:
            new_content = re.sub(pattern, replacement, new_content)
            changes += len(matches)

    return new_content, changes

def add_viewport_if_missing(content):
    """Add viewport meta tag if missing"""
    if 'name="viewport"' not in content:
        # Add viewport meta tag after <head>
        if '<head>' in content:
            content = content.replace(
                '<head>',
                '<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
                1
            )
            return content, True
    return content, False

# Process each file
print("Fixing width support issues...\n")
print("=" * 80)

for html_file in html_files:
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Fix max-width
        new_content, changes = fix_max_width(content)

        # Add viewport if missing
        new_content, viewport_added = add_viewport_if_missing(new_content)

        # Write changes if any
        if changes > 0 or viewport_added:
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(new_content)

            updates = []
            if changes > 0:
                updates.append(f"{changes} width fix(es)")
                width_changes += changes
            if viewport_added:
                updates.append("viewport added")

            print(f"✓ {html_file.name}: {', '.join(updates)}")
            files_updated += 1
        else:
            print(f"- {html_file.name}: No changes needed")

    except Exception as e:
        print(f"✗ Error processing {html_file.name}: {str(e)}")

# Summary
print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"✓ Files updated: {files_updated}")
print(f"✓ Width constraints fixed: {width_changes}")
print(f"✓ Total files processed: {len(html_files)}")
print("=" * 80)
