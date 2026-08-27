
with open("src/components/AdminPanel.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

start_line = 6393 # line 6394
line_text = lines[start_line]
print(f"Start: {line_text.strip()}")

brace_count = 0
paren_count = 0

for char in line_text:
    if char == '{': brace_count += 1
    if char == '(': paren_count += 1

print(f"Initial counts: brace={brace_count}, paren={paren_count}")

# We need to find the point where brace_count becomes 0 OR paren_count becomes 0
# Actually, it's the </div> at the end of the products table that is the boundary.

for i in range(start_line + 1, len(lines)):
    lt = lines[i]
    for char in lt:
        if char == '{': brace_count += 1
        elif char == '}': brace_count -= 1
        elif char == '(': paren_count += 1
        elif char == ')': paren_count -= 1
    
    # Let's look for the point where we see "profile" or "system" which are wrongly nested
    if "activeSubTab" in lt and ("profile" in lt or "system" in lt) and brace_count > 1:
        print(f"Line {i+1} is nested (brace={brace_count}): {lt.strip()}")
        # We need to backtrack to find where the products block SHOULD have closed.
        # It probably should have closed before the first of these.
        
    if brace_count == 0:
        print(f"Block CLOSED at line {i+1}")
        break
