#!/usr/bin/env python3
"""
Script to:
1. Update all EZPLM logo links to point to index.html
2. Check and ensure pages support 1440px width
3. Verify mobile responsive design
"""
import os
import re
from pathlib import Path

# Get all HTML files
html_files = list(Path('.').glob('*.html'))

# Statistics
logo_updated_count = 0
width_issues = []
mobile_issues = []

def update_logo_link(content):
    """Update logo onclick to point to index.html"""
    # Pattern: <div class="logo" onclick="location.href='dashboard-pro.html'">
    pattern = r'(<div class="logo" onclick=["\']location\.href=)["\']dashboard-pro\.html["\']'
    replacement = r"\1'index.html'"

    updated_content = re.sub(pattern, replacement, content)
    return updated_content, updated_content != content

def check_width_support(content, filename):
    """Check if page has proper width support for 1440px"""
    issues = []

    # Check for max-width constraints that might be too small
    max_width_matches = re.findall(r'max-width:\s*(\d+)px', content)
    for width in max_width_matches:
        if int(width) < 1440 and int(width) > 1000:  # Suspicious max-widths
            issues.append(f"Found max-width: {width}px (might limit 1440px display)")

    # Check if there's a responsive container
    has_container = 'class="container"' in content or 'class="layout"' in content
    has_main_content = 'class="main-content"' in content

    if not (has_container or has_main_content):
        issues.append("No main container/layout detected")

    return issues

def check_mobile_support(content, filename):
    """Check if page has mobile responsive design"""
    issues = []

    # Check for viewport meta tag
    if 'name="viewport"' not in content:
        issues.append("Missing viewport meta tag")

    # Check for media queries
    mobile_queries = re.findall(r'@media.*?max-width:\s*(\d+)px', content, re.IGNORECASE)

    if not mobile_queries:
        issues.append("No mobile media queries found")
    else:
        # Check if there are queries for common mobile breakpoints
        has_mobile = any(int(w) <= 768 for w in mobile_queries)
        if not has_mobile:
            issues.append("No media queries for mobile devices (≤768px)")

    return issues

def ensure_responsive_design(content):
    """Ensure basic responsive design elements are present"""
    modified = False

    # Check if viewport meta tag exists
    if 'name="viewport"' not in content:
        # Add viewport meta tag after <head>
        head_pattern = r'(<head>)'
        viewport_tag = r'\1\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
        content = re.sub(head_pattern, viewport_tag, content, count=1)
        modified = True

    return content, modified

# Process each file
print("Processing HTML files...\n")
print("=" * 80)

for html_file in html_files:
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Update logo link
        new_content, logo_updated = update_logo_link(content)

        # Ensure responsive design
        new_content, responsive_added = ensure_responsive_design(new_content)

        # Write changes if any
        if logo_updated or responsive_added:
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(new_content)

            changes = []
            if logo_updated:
                changes.append("logo link")
                logo_updated_count += 1
            if responsive_added:
                changes.append("viewport meta")

            print(f"✓ {html_file.name}: Updated {', '.join(changes)}")
        else:
            print(f"- {html_file.name}: No changes needed")

        # Check width support
        width_check = check_width_support(new_content, html_file.name)
        if width_check:
            width_issues.append((html_file.name, width_check))

        # Check mobile support
        mobile_check = check_mobile_support(new_content, html_file.name)
        if mobile_check:
            mobile_issues.append((html_file.name, mobile_check))

    except Exception as e:
        print(f"✗ Error processing {html_file.name}: {str(e)}")

# Summary
print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"\n✓ Logo links updated: {logo_updated_count} files")

if width_issues:
    print(f"\n⚠ Width Support Issues ({len(width_issues)} files):")
    for filename, issues in width_issues[:10]:  # Show first 10
        print(f"  • {filename}:")
        for issue in issues:
            print(f"    - {issue}")
    if len(width_issues) > 10:
        print(f"  ... and {len(width_issues) - 10} more files")
else:
    print("\n✓ All files have proper width support")

if mobile_issues:
    print(f"\n⚠ Mobile Support Issues ({len(mobile_issues)} files):")
    for filename, issues in mobile_issues[:10]:  # Show first 10
        print(f"  • {filename}:")
        for issue in issues:
            print(f"    - {issue}")
    if len(mobile_issues) > 10:
        print(f"  ... and {len(mobile_issues) - 10} more files")
else:
    print("\n✓ All files have proper mobile support")

print("\n" + "=" * 80)
print(f"Total files processed: {len(html_files)}")
print("=" * 80)
