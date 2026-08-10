import json
import re

transcript_path = r'C:\Users\ASUS\.gemini\antigravity\brain\aa02d8ba-5495-4689-942d-c23a1860872a\.system_generated\logs\transcript.jsonl'

with open(transcript_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

user_texts = []
for line in lines:
    try:
        data = json.loads(line)
        if data.get('type') == 'USER_INPUT':
            user_texts.append(data.get('content', ''))
    except Exception as e:
        pass

combined_text = '\n'.join(user_texts)

# Find all titles inside quotes
pattern = r'"([^"\n]+)"'
matches = re.findall(pattern, combined_text)

cleaned_titles = []
seen = set()

ignore_phrases = {"Admin", "Editor", "Chhit", "Sivleng", "Approved", "Draft", "Review", "Posted", "never", "any", "user_id"}

for m in matches:
    t = m.strip()
    if t and t not in seen and len(t) > 6 and not any(p in t for p in ignore_phrases):
        seen.add(t)
        cleaned_titles.append(t)

print(f"Extracted {len(cleaned_titles)} unique master titles!")

with open('all_master_titles.json', 'w', encoding='utf-8') as out:
    json.dump(cleaned_titles, out, ensure_ascii=False, indent=2)
