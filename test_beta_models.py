import os
from openai import OpenAI

# Check if API key is set
api_key = os.getenv("DEEPSEEK_API_KEY")
if not api_key:
    print("DEEPSEEK_API_KEY not set!")
    exit(1)

print(f"API Key found (length: {len(api_key)})")

# Test the API with beta endpoint
try:
    client = OpenAI(
        api_key=api_key,
        base_url="https://api.deepseek.com/beta"
    )
    
    print("Testing beta models endpoint...")
    response = client.models.list()
    
    print(f"Found {len(response.data)} models:")
    for model in response.data:
        print(f"  - {model.id} (owned by {model.owned_by})")
        
except Exception as e:
    print(f"Beta API Error: {e}")

# Also test regular endpoint
try:
    client = OpenAI(
        api_key=api_key,
        base_url="https://api.deepseek.com/v1"
    )
    
    print("\nTesting regular models endpoint...")
    response = client.models.list()
    
    print(f"Found {len(response.data)} models:")
    for model in response.data:
        print(f"  - {model.id} (owned by {model.owned_by})")
        
except Exception as e:
    print(f"Regular API Error: {e}")
