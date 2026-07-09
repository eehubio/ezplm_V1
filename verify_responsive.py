#!/usr/bin/env python3
"""
Comprehensive verification script to check:
1. All pages have logo linking to index.html
2. All pages support 1440px width (no restrictive max-width on main containers)
3. All pages have mobile responsive design
"""
import re
from pathlib import Path

html_files = list(Path('.').glob('*.html'))

# Results
logo_issues = []
width_support_ok = []
width_support_issues = []
mobile_ok = []
mobile_issues = []

def check_logo_link(content, filename):
    """Check if logo links to index.html"""
    if 'class="logo"' in content:
        if "location.href='index.html'" in content or 'location.href="index.html"' in content:
            return True, None
        elif "location.href='dashboard-pro.html'" in content or 'location.href="dashboard-pro.html"' in content:
            return False, "Logo links to dashboard-pro.html instead of index.html"
        else:
            return False, "Logo link found but target unclear"
    return True, None  # No logo, skip

def check_1440px_support(content, filename):
    """Check if page properly supports 1440px width"""
    issues = []

    # Check for restrictive max-width on body or main containers
    # Look for max-width values less than 1440px applied to main layout elements

    # Pattern: look for max-width on body, .layout, .container, .main-content, .page
    restrictive_patterns = [
        (r'body\s*\{[^}]*max-width:\s*(\d+)px', 'body'),
        (r'\.layout\s*\{[^}]*max-width:\s*(\d+)px', '.layout'),
        (r'\.container\s*\{[^}]*max-width:\s*(\d+)px', '.container'),
        (r'\.main-container\s*\{[^}]*max-width:\s*(\d+)px', '.main-container'),
        (r'\.page\s*\{[^}]*max-width:\s*(\d+)px', '.page'),
    ]

    for pattern, selector in restrictive_patterns:
        matches = re.findall(pattern, content, re.DOTALL)
        for width in matches:
            if int(width) < 1440:
                issues.append(f"Restrictive max-width on {selector}: {width}px")

    # Positive checks: flexible layout
    has_flex_layout = '.layout' in content and 'flex' in content
    has_responsive_container = '.main-content' in content or '.container' in content

    if not (has_flex_layout or has_responsive_container):
        issues.append("No flexible layout structure detected")

    return len(issues) == 0, issues

def check_mobile_support(content, filename):
    """Check if page has proper mobile responsive design"""
    issues = []

    # Check viewport
    if 'name="viewport"' not in content:
        issues.append("Missing viewport meta tag")

    # Check media queries for mobile
    mobile_queries = re.findall(r'@media[^{]*\(max-width:\s*(\d+)px\)', content)

    if not mobile_queries:
        issues.append("No mobile media queries")
    else:
        # Check for common mobile breakpoints
        mobile_widths = [int(w) for w in mobile_queries]
        has_phone = any(w <= 480 for w in mobile_widths)
        has_tablet = any(481 <= w <= 768 for w in mobile_widths)

        if not (has_phone or has_tablet):
            issues.append("Missing phone/tablet breakpoints (≤768px)")

    return len(issues) == 0, issues

print("Verifying all pages for responsive design and 1440px support...\n")
print("=" * 80)

for html_file in sorted(html_files):
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check logo
        logo_ok, logo_issue = check_logo_link(content, html_file.name)
        if not logo_ok:
            logo_issues.append((html_file.name, logo_issue))

        # Check 1440px support
        width_ok, width_issues_list = check_1440px_support(content, html_file.name)
        if width_ok:
            width_support_ok.append(html_file.name)
        else:
            width_support_issues.append((html_file.name, width_issues_list))

        # Check mobile support
        mobile_supported, mobile_issues_list = check_mobile_support(content, html_file.name)
        if mobile_supported:
            mobile_ok.append(html_file.name)
        else:
            mobile_issues.append((html_file.name, mobile_issues_list))

    except Exception as e:
        print(f"Error processing {html_file.name}: {e}")

# Report
print("\n" + "=" * 80)
print("VERIFICATION RESULTS")
print("=" * 80)

print(f"\n📱 Logo Links to index.html")
print("-" * 80)
if logo_issues:
    print(f"❌ Issues found in {len(logo_issues)} files:")
    for filename, issue in logo_issues[:5]:
        print(f"  • {filename}: {issue}")
    if len(logo_issues) > 5:
        print(f"  ... and {len(logo_issues) - 5} more")
else:
    print(f"✅ All pages have correct logo links ({len(html_files)} files checked)")

print(f"\n🖥️  1440px Width Support")
print("-" * 80)
if width_support_issues:
    print(f"⚠️  Potential issues in {len(width_support_issues)} files:")
    for filename, issues in width_support_issues[:5]:
        print(f"  • {filename}:")
        for issue in issues:
            print(f"    - {issue}")
    if len(width_support_issues) > 5:
        print(f"  ... and {len(width_support_issues) - 5} more")
else:
    print(f"✅ All pages support 1440px width ({len(html_files)} files)")

print(f"\n📱 Mobile Responsive Design")
print("-" * 80)
if mobile_issues:
    print(f"⚠️  Issues in {len(mobile_issues)} files:")
    for filename, issues in mobile_issues[:5]:
        print(f"  • {filename}:")
        for issue in issues:
            print(f"    - {issue}")
    if len(mobile_issues) > 5:
        print(f"  ... and {len(mobile_issues) - 5} more")
    print(f"\n✅ {len(mobile_ok)} files have proper mobile support")
else:
    print(f"✅ All pages have mobile responsive design ({len(html_files)} files)")

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"Total files checked: {len(html_files)}")
print(f"Logo links OK: {len(html_files) - len(logo_issues)}/{len(html_files)}")
print(f"1440px support: {len(width_support_ok)}/{len(html_files)}")
print(f"Mobile responsive: {len(mobile_ok)}/{len(html_files)}")
print("=" * 80)
