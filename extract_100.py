import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
full_log = r'C:\Users\ASUS\.gemini\antigravity\brain\aa02d8ba-5495-4689-942d-c23a1860872a\.system_generated\logs\transcript_full.jsonl'

titles = []
seen = set()
ignore = {'Draft', 'Review', 'Approved', 'Posted', 'Chhit', 'Sivleng', 'Admin', 'Editor', 'never', 'any', 'user_id'}

with open(full_log, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            d = json.loads(line)
            if d.get('type') == 'USER_INPUT':
                content = d.get('content', '')
                matches = re.findall(r'"([^"\n]+)"', content)
                for m in matches:
                    t = m.strip()
                    if t and len(t) > 5 and t not in seen and not any(w in t for w in ignore):
                        seen.add(t)
                        titles.append(t)
        except Exception as e:
            pass

print(f"Total extracted titles: {len(titles)}")
for i, t in enumerate(titles):
    print(f"{i+1}. {t}")

with open('extracted_100_titles.json', 'w', encoding='utf-8') as out:
    json.dump(titles, out, ensure_ascii=False, indent=2)
