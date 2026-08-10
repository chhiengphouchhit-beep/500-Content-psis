import json
import re

with open('extracted_100_titles.json', 'r', encoding='utf-8') as f:
    titles = json.load(f)

print(f"Total titles to inject: {len(titles)}")

def get_category(t):
    if any(w in t for w in ['Taekwondo', 'កីឡា', 'PE', 'Sports', 'បាល់', 'កាយសម្បទា', 'ហាត់', 'រត់', 'ល្បឿន', 'មេដាយ', 'ទីលាន', 'Motor Skills', 'Yoga']):
        return "Sports & Physical"
    if any(w in t for w in ['Life Skills', 'ម្ហូប', 'ដាំបន្លែ', 'ឯករាជ្យ', 'Home Economics', 'បំណិនជីវិត', 'លាង', 'អនាម័យ', 'ដេរប៉ាក់', 'សីលធម៌', 'ចរិយាធម៌', 'កែច្នៃ', 'First Aid']):
        return "Character & Life Skills"
    if any(w in t for w in ['សិល្បៈ', 'Music', 'Talent Show', 'គូររូប', 'ច្រៀង', 'តន្ត្រី', 'Fine Arts', 'ប៉ាំង', 'Piano', 'ហ្គីតា', 'Origami', 'Drama', 'ល្ខោន']):
        return "Arts & Creativity"
    if any(w in t for w in ['អាហារូបករណ៍', 'សមិទ្ធផល', 'Spotlight', 'មាតាបិតា', 'ទុកចិត្ត', 'ជោគជ័យ', 'បាក់ឌុប', 'មហាវិទ្យាល័យ', 'ពានរង្វាន់', 'អតីតសិស្ស', 'ហេតុផល', 'Alumni', 'សិស្សឆ្នើម']):
        return "Achievements & Proof"
    if any(w in t for w in ['Campus', 'POV', '៧ ព្រឹក', '៧:០០', 'Hangout', 'សាខា', 'TK', 'TTP', 'CAP', 'RSK', 'NR3', 'Behind the Scenes', 'International Day', 'ចូលឆ្នាំ', 'Halloween', 'Christmas', 'ភ្ជុំបិណ្ឌ', 'Nurse', 'Canteen', 'Field Trip', 'រថយន្តក្រុង', 'Bus', 'Playground', 'អាហារថ្ងៃត្រង់']):
        return "Campus & Culture"
    return "Academic & Languages"

pdf_indices = {50, 52, 53, 68, 101, 108, 113, 168}

cards_js = []
for i, t in enumerate(titles):
    id_num = i + 1
    cat = get_category(t)
    has_pdf = (id_num in pdf_indices)
    
    card_obj = {
        "id": f"card-{id_num}",
        "day": f"Card #{id_num}",
        "category": cat,
        "title": t,
        "hasPdfGuide": has_pdf,
        "objective": f'ពន្យល់ និងបង្ហាញយ៉ាងច្បាស់អំពី "{t}" ដើម្បីជួយឱ្យអាណាព្យាបាលយល់ពីគុណភាពអប់រំ និងការយកចិត្តទុកដាក់នៅ PSIS។',
        "workflowStatus": "Draft",
        "script": {
            "hook": f'"{t}"',
            "context": '"នៅ PSIS កម្មវិធីអប់រំត្រូវបា​នរៀបចំឡើងយ៉ាងផ្ចិតផ្ចង់ ដោយបញ្ចូលវិធីសាស្ត្របង្រៀន និងសកម្មភាពជាក់ស្តែង..."',
            "action": '"សិស្សានុសិស្សទទួលបានការបណ្តុះបណ្តាល និងអនុវត្តផ្ទាល់ជាមួយលោកគ្រូអ្នកគ្រូជំនាញរៀងរាល់ថ្ងៃ..."',
            "result": '"ជួយឱ្យកូនៗអភិវឌ្ឍសមត្ថភាព ទំនុកចិត្ត និងទទួលបានលទ្ធផលសិក្សាដ៏ល្អប្រសើរ!"',
            "cta": '"ចុះឈ្មោះចូលរៀននៅ PSIS ថ្ងៃនេះ ទទួលបានអាហារូបករណ៍ $300!"'
        },
        "shotList": {
            "opening": "Close-up សិស្ស PSIS កំពុងចូលរួមសកម្មភាពដោយស្នាមញញឹម",
            "broll1": "សកម្មភាពក្នុងថ្នាក់រៀន និងការអនុវត្តផ្ទាល់ដៃរបស់សិស្ស",
            "broll2": "លោកគ្រូអ្នកគ្រូណែនាំសិស្សយ៉ាងជិតស្និទ្ធ",
            "graphic": f"Graphic Overlay 'PSIS - {cat.upper()}'",
            "ending": "Logo PSIS + Banner អាហារូបករណ៍ $300"
        },
        "caption": f"🎓 {t}\nនៅ PSIS យើងបណ្ដុះបណ្ដាលសិស្សានុសិស្សគ្រប់ជ្រុងជ្រោយ ទាំងចំណេះដឹង ភាសា និងបច្ចេកវិទ្យា! 🌟 អាហារូបករណ៍ $300 #PSIS #BilingualEducation #PSISExcellence"
    }
    cards_js.append(card_obj)

json_data = json.dumps(cards_js, ensure_ascii=False, indent=2)

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace buildMasterDatasetFromUserTitles definition
new_func_code = f"function buildMasterDatasetFromUserTitles() {{\n  return {json_data};\n}}"

html = re.sub(r'function buildMasterDatasetFromUserTitles\(\) \{[\s\S]*?\n    \}', new_func_code, html)

# Update storage keys to v18 to force cache reset
html = html.replace('psis_topics_data_v17', 'psis_topics_data_v18')
html = html.replace('psis_comments_data_v17', 'psis_comments_data_v18')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Successfully injected all master cards into index.html!")
