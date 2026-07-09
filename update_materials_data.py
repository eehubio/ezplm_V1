#!/usr/bin/env python3
import re

# Read the file
with open('materials.html', 'r', encoding='utf-8') as f:
    content = f.content()

# Define price data for each material ID
price_data = {
    2: {'price': 0.08, 'specSheet': '/docs/RC0805_YAGEO.pdf'},
    3: {'price': 0.12, 'specSheet': '/docs/CL10B104KB_Samsung.pdf'},
    4: {'price': 12.50, 'specSheet': '/docs/STM32F103C8T6_datasheet.pdf'},
    5: {'price': 2.80, 'specSheet': '/docs/TYPE-C-31-M-12.pdf'},
    6: {'price': 3.50, 'specSheet': '/docs/LM2596S_datasheet.pdf'},
    7: {'price': 0.25, 'specSheet': '/docs/LTST-C150KRKT.pdf'},
    8: {'price': 15.00, 'specSheet': '/docs/DHT22_datasheet.pdf'},
    9: {'price': 18.50, 'specSheet': '/docs/ESP32-WROOM-32_datasheet.pdf'},
    10: {'price': 0.05, 'specSheet': '/docs/RC0603_YAGEO.pdf'}
}

# Pattern to find material objects
pattern = r'(\{\s*id:\s*(\d+),\s*internalNumber:[^}]+?package:\s*[\'"][^\'"]+[\'"],\s*category:\s*[\'"][^\'"]+[\'"],\s*status:\s*[\'"]active[\'"],)'

def add_price_fields(match):
    full_match = match.group(1)
    material_id = int(match.group(2))
    
    if material_id in price_data:
        data = price_data[material_id]
        # Add price fields after status field
        addition = f'''
                currentPrice: {data['price']},
                priceUpdateTime: '2025-01-27 10:30',
                specSheetUrl: '{data['specSheet']}',
                isCustomerSupplied: false,'''
        return full_match + addition
    return full_match

# Apply replacements
content = re.sub(pattern, add_price_fields, content)

# Write back
with open('materials.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Materials data updated successfully!")
