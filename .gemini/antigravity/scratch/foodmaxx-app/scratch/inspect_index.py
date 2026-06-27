import os

file_path = r"c:\Users\Quickprint\.gemini\antigravity\scratch\foodmaxx-app\dist\assets\index-lCw_XmRc.js"

if not os.path.exists(file_path):
    print("File not found:", file_path)
    exit(1)

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# The error stack says: index-lCw_XmRc.js:41:10561
# Let's split by lines first and look at line 41 (which is 0-indexed 40)
lines = content.splitlines()
print(f"Number of lines: {len(lines)}")
if len(lines) >= 41:
    line_41 = lines[40]
    print(f"Line 41 length: {len(line_41)}")
    # Let's print the character range around 10561
    start = max(0, 10561 - 200)
    end = min(len(line_41), 10561 + 200)
    print("--- Code around index 10561 ---")
    print(line_41[start:end])
else:
    print(f"File has less than 41 lines. Total lines: {len(lines)}")
    # Let's just print the whole file since it's only 93KB
    # We will search for occurrences of 'ReferenceError' or variable initializations
