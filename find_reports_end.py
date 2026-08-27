
with open("src/components/AdminPanel.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Reports starts at 6739
start_idx = 6738
brace_count = 0
for i in range(start_idx, len(lines)):
    line = lines[i]
    for char in line:
        if char == '{': brace_count += 1
        elif char == '}': brace_count -= 1
    
    if brace_count == 0:
        print(f"Reports ends at line {i+1}")
        break
