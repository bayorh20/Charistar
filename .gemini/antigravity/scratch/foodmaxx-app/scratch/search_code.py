import os

search_dirs = [
    'src',
    'admin-dashboard/src'
]

patterns = ['vercel.app', 'web.app', 'firebaseapp.com']

found = False
for search_dir in search_dirs:
    if not os.path.exists(search_dir):
        continue
    for root, dirs, files in os.walk(search_dir):
        # prune unwanted dirs
        dirs[:] = [d for d in dirs if d not in ['node_modules', 'dist', '.vercel']]
        for file in files:
            if file.endswith(('.js', '.jsx', '.html', '.json', '.ts', '.tsx')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                    for idx, line in enumerate(lines):
                        for pattern in patterns:
                            if pattern in line:
                                print(f"Match found in {filepath}:{idx+1}:")
                                print("  ", line.strip())
                                found = True
                except Exception as e:
                    pass

if not found:
    print("No matches found in source code.")
