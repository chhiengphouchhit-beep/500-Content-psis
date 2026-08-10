import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add a Reset Data button in header actions for instant recovery if needed
old_actions = '<button class="btn-action btn-telegram" onclick="openBatchTelegramModal()"><i class="fa-paper-plane fa-solid"></i> ផ្ញើសារជូន DG And DDG</button>'
new_actions = '<button class="btn-action btn-telegram" onclick="openBatchTelegramModal()"><i class="fa-paper-plane fa-solid"></i> ផ្ញើសារជូន DG And DDG</button>\n      <button class="btn-action" style="background:#64748b;" onclick="resetToDefaults()"><i class="fa-solid fa-rotate"></i> Reset ទិន្នន័យ (497 Cards)</button>'

if old_actions in html and 'resetToDefaults()' not in html:
    html = html.replace(old_actions, new_actions)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Header Reset button added cleanly!")
