import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_fetch_sig = "  const fetchProducts = async () => {"
new_fetch_sig = "  const fetchProducts = async (isBackground = false) => {"

content = content.replace(old_fetch_sig, new_fetch_sig)

old_set_load = "    try {\n      setLoading(true);"
new_set_load = "    try {\n      if (!isBackground) setLoading(true);"
content = content.replace(old_set_load, new_set_load)

with open('src/App.tsx', 'w') as f:
    f.write(content)

