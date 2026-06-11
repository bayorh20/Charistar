import re
with open(r'C:\Users\Quickprint\.gemini\antigravity\scratch\charistar-yogurt-new\src\App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "const TrackOrder = lazy(() => import('./pages/TrackOrder'));",
    "const TrackOrder = lazy(() => import('./pages/TrackOrder'));\nconst SearchPage = lazy(() => import('./pages/SearchPage'));\nconst Favorites = lazy(() => import('./pages/Favorites'));"
)

# 2. Routing
search_route_old = '<Route path="/search" element={<div className="h-full flex items-center justify-center text-gray-400 font-bold">Search coming soon!</div>} />'
favs_route_old = '<Route path="/favorites" element={<div className="h-full flex items-center justify-center text-gray-400 font-bold">Favorites coming soon!</div>} />'

search_route_new = '<Route path="/search" element={<Suspense fallback={<Loader />}><SearchPage /></Suspense>} />'
favs_route_new = '<Route path="/favorites" element={<Suspense fallback={<Loader />}><Favorites /></Suspense>} />'

content = content.replace(search_route_old, search_route_new)
content = content.replace(favs_route_old, favs_route_new)

with open(r'C:\Users\Quickprint\.gemini\antigravity\scratch\charistar-yogurt-new\src\App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced contents successfully.")
