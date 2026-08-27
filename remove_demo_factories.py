import json
import os

files = ['data/b2b-config.json', 'b2b-config.json']

for file_path in files:
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if 'factories' in data:
                original_len = len(data['factories'])
                # Remove fac-1 and fac-2
                data['factories'] = [f for f in data['factories'] if f.get('id') not in ['fac-1', 'fac-2']]
                new_len = len(data['factories'])
                
                if original_len != new_len:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        json.dump(data, f, indent=2, ensure_ascii=False)
                    print(f"Updated {file_path}: removed {original_len - new_len} factories.")
                else:
                    print(f"No matching factories found in {file_path}.")
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
    else:
        print(f"File {file_path} does not exist.")
