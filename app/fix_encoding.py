
import os

files_to_fix = [
    r"c:/Users/Francisco/Downloads/hermes-sales-navigator-main/src/components/routes/LaunchVisitSheet.tsx",
    r"c:/Users/Francisco/Downloads/hermes-sales-navigator-main/src/components/routes/CredenciamentoForm.tsx"
]

replacements = {
    "Ã©": "é",
    "Ã¡": "á",
    "Ã£": "ã",
    "Ã§": "ç",
    "Ã³": "ó",
    "Ãª": "ê",
    "Ãº": "ú",
    "Ãµ": "õ",
    "Ã¢": "â",
    "Ã ": "à",
    "Ã­": "í",
    "Ã´": "ô",
    "Ã‰": "É",
    "ÃŠ": "Ê",
    "Ãš": "Ú",
    "Ã‡": "Ç",
    "Ãƒ": "Ã",
    "ÃÕ": "Õ",
    "Ã€": "À",
    "Ã“": "Ó",
    "Ã®": "î",
    # Add generic handling for cases where second char matters
}

for file_path in files_to_fix:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
        
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        
        # Apply replacements
        for garbage, correct in replacements.items():
            content = content.replace(garbage, correct)
            
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed encoding issues in: {file_path}")
        else:
            print(f"No issues found in: {file_path}")
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
