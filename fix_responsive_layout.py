#!/usr/bin/env python3
"""
Script to fix responsive layout for all HTML pages in EZPLM project.
Requirements:
1. Desktop width should be 1440px (max-width: 1440px)
2. Must be mobile-friendly with responsive design
3. Ensure viewport meta tag is present
4. Apply consistent responsive CSS standards
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Tuple
import json


class ResponsiveLayoutFixer:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.stats = {
            'total_files': 0,
            'files_updated': 0,
            'viewport_added': 0,
            'max_width_fixed': 0,
            'media_queries_added': 0,
            'files_skipped': 0,
            'errors': []
        }
        self.changes_log = []

    def find_all_html_files(self) -> List[Path]:
        """Find all HTML files in the directory."""
        html_files = list(self.base_path.glob('*.html'))
        return sorted(html_files)

    def has_viewport_meta(self, content: str) -> bool:
        """Check if HTML has viewport meta tag."""
        pattern = r'<meta\s+name=["\']viewport["\']'
        return bool(re.search(pattern, content, re.IGNORECASE))

    def add_viewport_meta(self, content: str) -> Tuple[str, bool]:
        """Add viewport meta tag if missing."""
        if self.has_viewport_meta(content):
            return content, False

        # Find the <head> tag and add viewport after charset
        pattern = r'(<meta\s+charset=["\'][^"\']*["\']>)'
        replacement = r'\1\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">'

        if re.search(pattern, content, re.IGNORECASE):
            new_content = re.sub(pattern, replacement, content, count=1, flags=re.IGNORECASE)
            return new_content, True

        # If no charset found, add after <head>
        pattern = r'(<head[^>]*>)'
        replacement = r'\1\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
        new_content = re.sub(pattern, replacement, content, count=1, flags=re.IGNORECASE)
        return new_content, True

    def fix_max_width_values(self, content: str) -> Tuple[str, int]:
        """Fix max-width values to 1440px for main containers."""
        changes = 0

        # Patterns to fix max-width
        patterns = [
            (r'max-width:\s*1400px', 'max-width: 1440px'),
            (r'max-width:\s*1200px', 'max-width: 1440px'),
            (r'max-width:\s*1000px', 'max-width: 1000px'),  # Keep smaller containers
            (r'max-width:\s*1300px', 'max-width: 1440px'),
            (r'max-width:\s*1500px', 'max-width: 1440px'),
        ]

        for pattern, replacement in patterns:
            matches = re.findall(pattern, content)
            if matches:
                # Only replace main container widths (1200px, 1300px, 1400px, 1500px)
                if '1400px' in pattern or '1200px' in pattern or '1300px' in pattern or '1500px' in pattern:
                    content = re.sub(pattern, replacement, content)
                    changes += len(matches)

        return content, changes

    def has_mobile_media_queries(self, content: str) -> bool:
        """Check if content has mobile media queries."""
        pattern = r'@media\s*\([^)]*max-width\s*:\s*768px[^)]*\)'
        return bool(re.search(pattern, content))

    def add_mobile_menu_support(self, content: str) -> Tuple[str, bool]:
        """Add mobile menu support if navbar exists but no mobile support."""
        # Check if there's a navbar but no mobile menu styles
        has_navbar = bool(re.search(r'class=["\']navbar["\']', content))
        has_mobile_menu = bool(re.search(r'\.mobile-menu|\.nav-toggle|\.hamburger', content))

        if not has_navbar or has_mobile_menu or self.has_mobile_media_queries(content):
            return content, False

        # Add basic mobile menu CSS before closing </style>
        mobile_css = '''
        /* Mobile Navigation */
        .mobile-menu-toggle {
            display: none;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #3d4647;
        }

        @media (max-width: 768px) {
            .mobile-menu-toggle {
                display: block;
            }

            .nav-menu {
                display: none;
                position: absolute;
                top: 80px;
                left: 0;
                right: 0;
                background: white;
                flex-direction: column;
                padding: 20px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                gap: 0 !important;
            }

            .nav-menu.active {
                display: flex;
            }

            .nav-menu li {
                padding: 12px 0;
                border-bottom: 1px solid #f0f0f0;
            }

            .nav-actions {
                flex-direction: column;
                width: 100%;
            }

            .nav-actions .btn {
                width: 100%;
                text-align: center;
            }
        }
'''

        # Find the closing </style> tag and insert before it
        pattern = r'(</style>)'
        replacement = mobile_css + r'\n    \1'

        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content, count=1)
            return content, True

        return content, False

    def ensure_responsive_grid(self, content: str) -> Tuple[str, bool]:
        """Ensure grid layouts are responsive."""
        # Check if there are grid layouts without mobile breakpoints
        has_grid = bool(re.search(r'display:\s*grid|grid-template-columns', content))
        has_mobile_grid = bool(re.search(r'@media.*grid-template-columns.*1fr', content))

        if not has_grid or has_mobile_grid:
            return content, False

        # Add responsive grid styles
        responsive_grid_css = '''
        /* Responsive Grid Support */
        @media (max-width: 768px) {
            .features-grid,
            .pricing-grid,
            .use-cases-grid,
            .benefits-container,
            .footer-container {
                grid-template-columns: 1fr !important;
            }

            .hero-stats {
                grid-template-columns: 1fr !important;
            }
        }

        @media (max-width: 1024px) and (min-width: 769px) {
            .features-grid {
                grid-template-columns: repeat(2, 1fr) !important;
            }

            .pricing-grid {
                grid-template-columns: repeat(2, 1fr) !important;
            }
        }
'''

        # Only add if not already present
        if not re.search(r'/\*\s*Responsive Grid Support\s*\*/', content):
            pattern = r'(</style>)'
            replacement = responsive_grid_css + r'\n    \1'

            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content, count=1)
                return content, True

        return content, False

    def add_responsive_typography(self, content: str) -> Tuple[str, bool]:
        """Add responsive typography if missing."""
        has_responsive_typo = bool(re.search(r'@media.*font-size.*48px|@media.*font-size.*36px', content))

        if has_responsive_typo:
            return content, False

        responsive_typo_css = '''
        /* Responsive Typography */
        @media (max-width: 768px) {
            .hero h1 {
                font-size: 36px !important;
            }

            .section-header h2,
            .benefits-content h2,
            .cta h2 {
                font-size: 32px !important;
            }

            .hero p {
                font-size: 16px !important;
            }

            .section-header p,
            .cta p {
                font-size: 16px !important;
            }

            .nav-container {
                padding: 0 20px !important;
            }

            .hero,
            .features,
            .benefits,
            .pricing,
            .use-cases,
            .cta {
                padding: 60px 20px !important;
            }
        }

        @media (max-width: 480px) {
            .hero h1 {
                font-size: 28px !important;
            }

            .btn {
                padding: 10px 20px !important;
                font-size: 13px !important;
            }

            .hero-actions {
                flex-direction: column !important;
                width: 100%;
            }

            .hero-actions .btn {
                width: 100%;
            }
        }
'''

        # Only add if not already present
        if not re.search(r'/\*\s*Responsive Typography\s*\*/', content):
            pattern = r'(</style>)'
            replacement = responsive_typo_css + r'\n    \1'

            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content, count=1)
                return content, True

        return content, False

    def process_file(self, file_path: Path) -> Dict:
        """Process a single HTML file."""
        changes = {
            'file': str(file_path.name),
            'viewport_added': False,
            'max_width_changes': 0,
            'mobile_menu_added': False,
            'responsive_grid_added': False,
            'responsive_typography_added': False,
            'updated': False
        }

        try:
            # Read file
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            original_content = content

            # 1. Add viewport meta tag if missing
            content, viewport_added = self.add_viewport_meta(content)
            changes['viewport_added'] = viewport_added
            if viewport_added:
                self.stats['viewport_added'] += 1

            # 2. Fix max-width values
            content, max_width_changes = self.fix_max_width_values(content)
            changes['max_width_changes'] = max_width_changes
            if max_width_changes > 0:
                self.stats['max_width_fixed'] += max_width_changes

            # 3. Add mobile menu support
            content, mobile_menu_added = self.add_mobile_menu_support(content)
            changes['mobile_menu_added'] = mobile_menu_added

            # 4. Ensure responsive grid
            content, responsive_grid_added = self.ensure_responsive_grid(content)
            changes['responsive_grid_added'] = responsive_grid_added

            # 5. Add responsive typography
            content, responsive_typography_added = self.add_responsive_typography(content)
            changes['responsive_typography_added'] = responsive_typography_added

            # Check if any changes were made
            if content != original_content:
                changes['updated'] = True
                self.stats['files_updated'] += 1

                # Write back to file
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)

                self.changes_log.append(changes)
            else:
                self.stats['files_skipped'] += 1

            return changes

        except Exception as e:
            error_msg = f"Error processing {file_path.name}: {str(e)}"
            self.stats['errors'].append(error_msg)
            changes['error'] = error_msg
            return changes

    def run(self) -> Dict:
        """Run the responsive layout fixer on all HTML files."""
        print("=" * 80)
        print("EZPLM Responsive Layout Fixer")
        print("=" * 80)
        print()

        # Find all HTML files
        html_files = self.find_all_html_files()
        self.stats['total_files'] = len(html_files)

        print(f"Found {len(html_files)} HTML files to process...")
        print()

        # Process each file
        for i, file_path in enumerate(html_files, 1):
            print(f"[{i}/{len(html_files)}] Processing {file_path.name}...", end=' ')
            changes = self.process_file(file_path)

            if changes.get('error'):
                print(f"ERROR: {changes['error']}")
            elif changes['updated']:
                updates = []
                if changes['viewport_added']:
                    updates.append("viewport")
                if changes['max_width_changes'] > 0:
                    updates.append(f"{changes['max_width_changes']} max-width")
                if changes['mobile_menu_added']:
                    updates.append("mobile menu")
                if changes['responsive_grid_added']:
                    updates.append("responsive grid")
                if changes['responsive_typography_added']:
                    updates.append("responsive typography")

                print(f"UPDATED ({', '.join(updates)})")
            else:
                print("SKIPPED (no changes needed)")

        print()
        print("=" * 80)
        print("Summary Report")
        print("=" * 80)
        print(f"Total files processed: {self.stats['total_files']}")
        print(f"Files updated: {self.stats['files_updated']}")
        print(f"Files skipped: {self.stats['files_skipped']}")
        print(f"Viewport tags added: {self.stats['viewport_added']}")
        print(f"Max-width values fixed: {self.stats['max_width_fixed']}")
        print()

        if self.stats['errors']:
            print("Errors encountered:")
            for error in self.stats['errors']:
                print(f"  - {error}")
            print()

        # Generate detailed report
        self.generate_report()

        return self.stats

    def generate_report(self):
        """Generate a detailed report of all changes."""
        report_path = self.base_path / 'responsive_layout_report.json'

        report = {
            'summary': self.stats,
            'changes': self.changes_log
        }

        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        print(f"Detailed report saved to: {report_path}")
        print()

        # Also create a human-readable report
        txt_report_path = self.base_path / 'responsive_layout_report.txt'
        with open(txt_report_path, 'w', encoding='utf-8') as f:
            f.write("=" * 80 + "\n")
            f.write("EZPLM Responsive Layout Fix Report\n")
            f.write("=" * 80 + "\n\n")

            f.write("SUMMARY\n")
            f.write("-" * 80 + "\n")
            f.write(f"Total files processed: {self.stats['total_files']}\n")
            f.write(f"Files updated: {self.stats['files_updated']}\n")
            f.write(f"Files skipped: {self.stats['files_skipped']}\n")
            f.write(f"Viewport tags added: {self.stats['viewport_added']}\n")
            f.write(f"Max-width values fixed: {self.stats['max_width_fixed']}\n")
            f.write("\n")

            f.write("CHANGES BY FILE\n")
            f.write("-" * 80 + "\n")
            for change in self.changes_log:
                f.write(f"\nFile: {change['file']}\n")
                if change['viewport_added']:
                    f.write("  ✓ Added viewport meta tag\n")
                if change['max_width_changes'] > 0:
                    f.write(f"  ✓ Fixed {change['max_width_changes']} max-width values to 1440px\n")
                if change['mobile_menu_added']:
                    f.write("  ✓ Added mobile menu support\n")
                if change['responsive_grid_added']:
                    f.write("  ✓ Added responsive grid layouts\n")
                if change['responsive_typography_added']:
                    f.write("  ✓ Added responsive typography\n")

            if self.stats['errors']:
                f.write("\n")
                f.write("ERRORS\n")
                f.write("-" * 80 + "\n")
                for error in self.stats['errors']:
                    f.write(f"  ✗ {error}\n")

        print(f"Human-readable report saved to: {txt_report_path}")


if __name__ == '__main__':
    # Get the directory of this script
    base_path = os.path.dirname(os.path.abspath(__file__))

    # Run the fixer
    fixer = ResponsiveLayoutFixer(base_path)
    stats = fixer.run()

    print()
    print("✓ Responsive layout fix completed!")
    print()
    print("Standard responsive CSS patterns applied:")
    print("  - Main container: max-width: 1440px; margin: 0 auto;")
    print("  - Mobile breakpoint: @media (max-width: 768px)")
    print("  - Tablet breakpoint: @media (max-width: 1024px)")
    print("  - Small mobile: @media (max-width: 480px)")
    print()
