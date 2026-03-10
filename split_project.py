import os
import re

base_dir = r"d:\tool\ai"
index_path = os.path.join(base_dir, "index.html")

assets_dir = os.path.join(base_dir, "assets")
css_dir = os.path.join(assets_dir, "css")
js_dir = os.path.join(assets_dir, "js")

os.makedirs(css_dir, exist_ok=True)
os.makedirs(js_dir, exist_ok=True)

with open(index_path, "r", encoding="utf-8") as f:
    html = f.read()

# Extract CSS
style_match = re.search(r"<style>(.*?)</style>", html, re.DOTALL)
if style_match:
    css_content = style_match.group(1)
    with open(os.path.join(css_dir, "style.css"), "w", encoding="utf-8") as f:
        f.write(css_content.strip())
    html = html.replace(style_match.group(0), '<link rel="stylesheet" href="assets/css/style.css" />')

# Extract JS
script_match = re.search(r"<script>(.*?)</script>", html, re.DOTALL)
if script_match:
    js_content = script_match.group(1)
    
    # We will split JS into chunks if needed, or put them all into app.js
    # Let's put everything in app.js first, we can manually split later.
    with open(os.path.join(js_dir, "app.js"), "w", encoding="utf-8") as f:
        f.write(js_content.strip())
        
    html = html.replace(script_match.group(0), '<script src="assets/js/app.js"></script>')

with open(index_path, "w", encoding="utf-8") as f:
    f.write(html)

print("Split completed.")
