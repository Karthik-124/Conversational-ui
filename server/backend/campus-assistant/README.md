# IIIT Sri City Campus Assistant

Simple conversational assistant for campus navigation.


## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
curl -fsSL https://ollama.com/install.sh | sh
```

2. Run ollama
```bash
ollama serve
```
3. Install Llama 3.2
```
ollama pull llama3.2
```

4. Run the server:
```bash
python3 app.py
```

Server runs on `http://localhost:5001`

Stopping the Ollama model :-
```
ollama stop llama3.2
```

Killing the Ollama background service:-
```
sudo systemctl stop ollama

sudo systemctl disable ollama

sudo pkill ollama

```

## How It Works

Uses Llama 3.2
 - data.json is injected
 - generates structured JSON 
 - includes rule-based fallback

## Example Queries

**Location queries (returns interactive map):**
- "Show boys hostels" 
- "Show girls hostels" 
- "Show faculty building" 


**Information queries (returns text):**
- "How many hostels are there?"
