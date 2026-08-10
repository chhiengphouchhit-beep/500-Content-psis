import json
from pathlib import Path

root = Path(__file__).resolve().parent
extracted_path = root / 'extracted_100_titles.json'
all_path = root / 'all_master_titles.json'
html_files = [root / 'index.html', root / 'psis_content_planner' / 'index.html']

if not extracted_path.exists():
    raise FileNotFoundError(f'Missing {extracted_path}')

titles = json.loads(extracted_path.read_text(encoding='utf-8'))
if not isinstance(titles, list):
    raise ValueError('Expected a list of titles in extracted_100_titles.json')

# Keep all_master_titles.json in sync with extracted titles.
all_path.write_text(json.dumps(titles, ensure_ascii=False, indent=2), encoding='utf-8')

# Category mapping heuristics.
category_keywords = [
    ('Sports & Physical', ['Taekwondo', 'កីឡា', 'PE', 'Sports', 'បាល់', 'កាយសម្បទា', 'ហាត់', 'រត់', 'ល្បឿន', 'មេដាយ', 'ទីលាន', 'Motor Skills', 'Yoga']),
    ('Character & Life Skills', ['Life Skills', 'ម្ហូប', 'ដាំបន្លែ', 'ឯករាជ្យ', 'Home Economics', 'បំណិនជីវិត', 'លាង', 'អនាម័យ', 'ដេរប៉ាក់', 'សីលធម៌', 'ចរិយាធម៌', 'កែច្នៃ', 'First Aid']),
    ('Arts & Creativity', ['សិល្បៈ', 'Music', 'Talent Show', 'គូររូប', 'ច្រៀង', 'តន្ត្រី', 'Fine Arts', 'ប៉ាំង', 'Piano', 'ហ្គីតា', 'Origami', 'Drama', 'ល្ខោន']),
    ('Achievements & Proof', ['អាហារូបករណ៍', 'សមិទ្ធផល', 'Spotlight', 'មាតាបិតា', 'ទុកចិត្ត', 'ជោគជ័យ', 'បាក់ឌុប', 'មហាវិទ្យាល័យ', 'ពានរង្វាន់', 'អតីតសិស្ស', 'ហេតុផល', 'Alumni', 'សិស្សឆ្នើម']),
    ('Campus & Culture', ['Campus', 'POV', '៧ ព្រឹក', 'Hangout', 'សាខា', 'TK', 'TTP', 'CAP', 'RSK', 'NR3', 'Behind the Scenes', 'International Day', 'ចូលឆ្នាំ', 'Halloween', 'Christmas', 'ភ្ជុំបិណ្ឌ', 'Nurse', 'Canteen', 'Field Trip', 'រថយន្តក្រុង', 'Bus', 'Playground', 'អាហារថ្ងៃត្រង់']),
]

def choose_category(title: str) -> str:
    for category, keywords in category_keywords:
        if any(keyword in title for keyword in keywords):
            return category
    return 'Academic & Languages'

cards = []
for idx, title in enumerate(titles, start=1):
    category = choose_category(title)
    card = {
        'id': f'card-{idx}',
        'day': f'Card #{idx}',
        'category': category,
        'title': title,
        'hasPdfGuide': False,
        'objective': f'ពន្យល់ និងបង្ហាញយ៉ាងច្បាស់អំពី "{title}" ដើម្បីជួយឱ្យអាណាព្យាបាលយល់ពីគុណភាពអប់រំ និងការយកចិត្តទុកដាក់នៅ PSIS។',
        'workflowStatus': 'Draft',
        'script': {
            'hook': f'"{title}"',
            'context': 'នៅ PSIS កម្មវិធីអប់រំត្រូវបានរៀបចំឡើងយ៉ាងផ្ចិតផ្ចង់ ដោយបញ្ចូលវិធីសាស្ត្របង្រៀន និងសកម្មភាពជាក់ស្តែង...',
            'action': 'សិស្សានុសិស្សទទួលបានការបណ្តុះបណ្ដាល និងអនុវត្តផ្ទាល់ជាមួយលោកគ្រូអ្នកគ្រូជំនាញរៀងរាល់ថ្ងៃ...',
            'result': 'ជួយឱ្យកូនៗអភិវឌ្ឍសមត្ថភាព ទំនុកចិត្ត និងទទួលបានលទ្ធផលសិក្សាដ៏ល្អប្រសើរ!',
            'cta': 'ចុះឈ្មោះចូលរៀននៅ PSIS ថ្ងៃនេះ ទទួលបានអាហារូបករណ៍ $300!'
        },
        'shotList': {
            'opening': 'Close-up សិស្ស PSIS កំពុងចូលរួមសកម្មភាពដោយស្នាមញញឹម',
            'broll1': 'សកម្មាពក្នុងថ្នាក់រៀន និងការអនុវត្តផ្ទាល់ដៃរបស់សិស្ស',
            'broll2': 'លោកគ្រូអ្នកគ្រូណែនាំសិស្សយ៉ាងជិតស្និទ្ធ',
            'graphic': f"Graphic Overlay 'PSIS - {category.upper()}'",
            'ending': 'Logo PSIS + Banner អាហារូបករណ៍ $300'
        },
        'caption': f'🎓 {title}\nនៅ PSIS យើងបណ្ដុះបណ្ដាលសិស្សានុសិស្សគ្រប់ជ្រុងជ្រោយ ទាំងចំណេះដឹង ភាសា និងបច្ចេកវិទ្យា! 🌟 អាហារូបករណ៍ $300 #PSIS #BilingualEducation #PSISExcellence'
    }
    cards.append(card)

cards_js = json.dumps(cards, ensure_ascii=False, indent=2)
new_function = 'function buildMasterDatasetFromUserTitles() {\n  return ' + cards_js + ';\n}'

for html_file in html_files:
    text = html_file.read_text(encoding='utf-8')
    if 'function buildMasterDatasetFromUserTitles()' not in text:
        raise ValueError(f'buildMasterDatasetFromUserTitles not found in {html_file}')
    if 'function saveData()' not in text:
        raise ValueError(f'saveData not found in {html_file}')
    prefix, rest = text.split('function buildMasterDatasetFromUserTitles()', 1)
    _, suffix = rest.split('function saveData()', 1)
    new_text = prefix + 'function buildMasterDatasetFromUserTitles() {\n' + '  return ' + cards_js + ';\n}\n\nfunction saveData()' + suffix
    new_text = new_text.replace('psis_topics_data_v23', 'psis_topics_data_v24')
    new_text = new_text.replace('psis_comments_data_v23', 'psis_comments_data_v24')
    html_file.write_text(new_text, encoding='utf-8')
    print(f'Updated {html_file.name} with {len(cards)} cards and v24 storage keys.')

print('Synced all_master_titles.json to extracted_100_titles.json and injected cards into HTML.')
