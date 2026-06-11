import re
with open(r'C:\Users\Quickprint\.gemini\antigravity\scratch\charistar-yogurt-new\src\pages\LandingPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { useTheme, THEMES } from '../contexts/ThemeContext';",
    "import { useTheme, THEMES } from '../contexts/ThemeContext';\nimport ActiveOrderBanner from '../components/ActiveOrderBanner';"
)

# 2. Rendering
search_widget_marker = '''          {/* Futuristic Search Widget */}
          <div className="relative mb-6">'''

replacement = '''          <ActiveOrderBanner />

          {/* Futuristic Search Widget */}
          <div className="relative mb-6">'''

content = content.replace(search_widget_marker, replacement)

with open(r'C:\Users\Quickprint\.gemini\antigravity\scratch\charistar-yogurt-new\src\pages\LandingPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced contents successfully.")
