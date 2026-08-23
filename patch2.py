import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

import re

# Fix fetchProducts
fetchprod_pattern = re.compile(r'  const fetchProducts = async \(\) => \{\n    try \{\n      setLoading\(true\);\n      \n      // First try to load from IndexedDB for instant display\n      const cached = await getCachedProducts\(\);\n      if \(cached && cached\.length > 0\) \{\n        setProducts\(cached\);\n        setLoading\(false\);\n      \}')
if fetchprod_pattern.search(content):
    print("Found fetchProducts!")
else:
    print("Could NOT find fetchProducts exact match.")
