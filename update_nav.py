#!/usr/bin/env python3
import os
import re
from pathlib import Path

# Files already updated
updated_files = {'projects.html', 'tasks.html', 'analytics.html', 'collaboration.html'}

# Get all HTML files
html_files = [f for f in Path('.').glob('*.html') if f.name not in updated_files]

def update_navigation(content, filename):
    """Update navigation section in HTML content"""

    # Pattern 1: Find nav section with 项目 that has absolute URLs
    pattern1 = r'(<div class="nav-section-title">项目</div>\s*<a href="https://ez\.eetree\.cn/projects\.html" class="nav-item">.*?</a>\s*(?:<a href="https://ez\.eetree\.cn/tasks\.html".*?</a>\s*)?(?:<a href="https://ez\.eetree\.cn/collaboration\.html".*?</a>\s*)?)'

    # Pattern 2: Find nav section with 项目 that may have relative URLs but missing tasks/collaboration
    pattern2 = r'(<div class="nav-section-title">项目</div>\s*<a href="(?:https://ez\.eetree\.cn/)?projects\.html" class="nav-item">.*?<span>项目管理</span>\s*</a>)(\s*<a href)'

    # Check if file already has the correct structure
    has_tasks = 'href="tasks.html"' in content or 'href="https://ez.eetree.cn/tasks.html"' in content
    has_collaboration = 'href="collaboration.html"' in content or 'href="https://ez.eetree.cn/collaboration.html"' in content
    has_projects_section = '项目管理' in content

    if not has_projects_section:
        return content, False

    # Find the navigation section
    nav_section_match = re.search(
        r'<div class="nav-section-title">项目</div>\s*'
        r'<a href="[^"]*projects\.html" class="nav-item[^"]*">.*?</a>',
        content,
        re.DOTALL
    )

    if not nav_section_match:
        return content, False

    # Determine which page this is to set active state
    active_page = None
    if 'projects' in filename:
        active_page = 'projects'
    elif 'tasks' in filename or 'task' in filename:
        active_page = 'tasks'
    elif 'collaboration' in filename:
        active_page = 'collaboration'

    # Build the new navigation section
    new_nav = '''                <div class="nav-section-title">项目</div>
                <a href="projects.html" class="nav-item{projects_active}">
                    <span class="nav-icon">📋</span>
                    <span>项目管理</span>
                </a>
                <a href="tasks.html" class="nav-item{tasks_active}">
                    <span class="nav-icon">✅</span>
                    <span>任务中心</span>
                </a>
                <a href="collaboration.html" class="nav-item{collab_active}">
                    <span class="nav-icon">👥</span>
                    <span>团队协作</span>
                </a>'''.format(
        projects_active=' active' if active_page == 'projects' else '',
        tasks_active=' active' if active_page == 'tasks' else '',
        collab_active=' active' if active_page == 'collaboration' else ''
    )

    # Find and replace the entire project navigation section
    # This pattern captures from "项目</div>" to just before the next nav item (like BOM管理)
    pattern = r'(<div class="nav-section-title">项目</div>)\s*(?:<a href="[^"]*projects\.html"[^>]*>.*?</a>\s*)?(?:<a href="[^"]*tasks\.html"[^>]*>.*?</a>\s*)?(?:<a href="[^"]*collaboration\.html"[^>]*>.*?</a>\s*)?'

    # More robust pattern
    pattern = r'<div class="nav-section-title">项目</div>(?:\s*<a href="[^"]*"[^>]*>(?:(?!</div>).)*?</a>)*?(?=\s*(?:<a href="[^"]*bom\.html"|<a href="[^"]*library|</div>\s*<div class="nav-section"))'

    # Replace the navigation section
    updated_content = re.sub(pattern, new_nav, content, count=1, flags=re.DOTALL)

    if updated_content != content:
        return updated_content, True

    return content, False

# Process each file
updated_count = 0
skipped_count = 0
error_count = 0

for html_file in html_files:
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content, was_updated = update_navigation(content, html_file.name)

        if was_updated:
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✓ Updated: {html_file.name}")
            updated_count += 1
        else:
            print(f"- Skipped: {html_file.name} (no project nav section or already correct)")
            skipped_count += 1

    except Exception as e:
        print(f"✗ Error processing {html_file.name}: {str(e)}")
        error_count += 1

print(f"\n=== Summary ===")
print(f"Updated: {updated_count} files")
print(f"Skipped: {skipped_count} files")
print(f"Errors: {error_count} files")
print(f"Already updated: {len(updated_files)} files (projects, tasks, analytics, collaboration)")
