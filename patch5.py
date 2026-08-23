import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_finally = """    } finally {
      // setLoading(false) is now handled in initApp
    }"""
new_finally = """    } finally {
      if (!isBackground) setLoading(false);
    }"""
content = content.replace(old_finally, new_finally)

with open('src/App.tsx', 'w') as f:
    f.write(content)

