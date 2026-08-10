import json
import re
import sys
import subprocess

sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Update loadData logic to include bulletproof fallback if array is empty or corrupt
old_load = """    function loadData() {
      const savedUser = localStorage.getItem('psis_current_user');
      if (savedUser) {
        try { currentUser = JSON.parse(savedUser); } catch(e) {}
      }

      const saved = localStorage.getItem('psis_topics_data_v20');
      if (saved) {
        try { psisTopicsData = JSON.parse(saved); } catch (e) { psisTopicsData = buildMasterDatasetFromUserTitles(); }
      } else {
        psisTopicsData = buildMasterDatasetFromUserTitles();
      }

      const savedComments = localStorage.getItem('psis_comments_data_v20');
      if (savedComments) {
        try { commentsData = JSON.parse(savedComments); } catch (e) { commentsData = {}; }
      }
    }"""

new_load = """    function loadData() {
      const savedUser = localStorage.getItem('psis_current_user');
      if (savedUser) {
        try { currentUser = JSON.parse(savedUser); } catch(e) {}
      }

      const saved = localStorage.getItem('psis_topics_data_v21');
      if (saved) {
        try { psisTopicsData = JSON.parse(saved); } catch (e) { psisTopicsData = buildMasterDatasetFromUserTitles(); }
      } else {
        psisTopicsData = buildMasterDatasetFromUserTitles();
      }

      // BULLETPROOF SAFEGUARD: If empty or invalid on fresh GitHub Pages deploy, force populate master dataset!
      if (!psisTopicsData || !Array.isArray(psisTopicsData) || psisTopicsData.length === 0) {
        psisTopicsData = buildMasterDatasetFromUserTitles();
        saveData();
      }

      const savedComments = localStorage.getItem('psis_comments_data_v21');
      if (savedComments) {
        try { commentsData = JSON.parse(savedComments); } catch (e) { commentsData = {}; }
      }
    }"""

if old_load in html:
    html = html.replace(old_load, new_load)
else:
    # Regex replacement for loadData
    html = re.sub(r'function loadData\(\) \{[\s\S]*?const savedComments = localStorage[\s\S]*?\}', new_load, html)

# Bump version key to v21
html = html.replace('psis_topics_data_v20', 'psis_topics_data_v21')
html = html.replace('psis_comments_data_v20', 'psis_comments_data_v21')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated index.html with bulletproof GitHub Pages fallback!")

# Verify script syntax with Node
m = re.search(r'<script>(.*?)</script>', html, re.DOTALL)
if m:
    with open('temp_check.js', 'w', encoding='utf-8') as js_out:
        js_out.write(m.group(1))

res = subprocess.run(['node', '--check', 'temp_check.js'], capture_output=True)
if res.returncode == 0:
    print("SUCCESS: Node syntax check passed cleanly! No syntax errors!")
else:
    print("Node check failed:")
    print(res.stderr.decode('utf-8', errors='replace'))
