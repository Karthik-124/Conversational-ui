import flask
import flask_cors
import json
import os
import ollama

app = flask.Flask(__name__)
flask_cors.CORS(app)

# Load  data
with open('data.json', 'r') as f:
    CAMPUS_DATA = json.load(f)

def keyword_matching_fallback(query):
    """
    Fallback to keyword matching if Ollama fails.
    Simple pattern matching for basic queries.
    """
    query_lower = query.lower()
    locations = CAMPUS_DATA['locations']
    
    if 'boys' in query_lower and 'hostel' in query_lower:
        boys_hostels = [loc for loc in locations if loc['loctype'] == 'boys_hostel']
        return {"type": "poi", "zoom": 15, "locations": boys_hostels}
    
    elif 'girls' in query_lower and 'hostel' in query_lower:
        girls_hostels = [loc for loc in locations if loc['loctype'] == 'girls_hostel']
        return {"type": "poi", "zoom": 15, "locations": girls_hostels}
    
    elif 'faculty' in query_lower or 'academic' in query_lower:
        academic = [loc for loc in locations if loc['loctype'] == 'academic']
        return {"type": "poi", "zoom": 15, "locations": academic}
    
    elif 'how many' in query_lower and 'hostel' in query_lower:
        stats = CAMPUS_DATA['statistics']
        return {
            "type": "text",
            "message": f"There are {stats['total_hostels']} hostels: {stats['boys_hostels']} boys hostels and {stats['girls_hostels']} girls hostel."
        }
    
    else:
        return {
            "type": "text",
            "message": "Try: 'Show boys hostels', 'Show girls hostels', 'Show faculty building', 'How many hostels are there?'"
        }

def process_query_with_ollama(query):
    """
    Use Ollama LLM to process natural language queries.
    Falls back to keyword matching if Ollama is unavailable.
    """
    
    system_prompt = f"""You are a campus assistant for IIIT Sri City. You have access to this campus data:

{json.dumps(CAMPUS_DATA, indent=2)}

IMPORTANT: Respond with ONLY valid JSON, no other text. Use one of these formats:

For location queries (show buildings/hostels on map):
{{"type": "poi", "zoom": 15, "locations": [array of location objects with lat, lng, label, loctype]}}

For information queries (counts, questions):
{{"type": "text", "message": "your answer here"}}

If user asks for data NOT in the provided JSON, respond with:
{{"type": "text", "message": "I don't have that information. I can help with: hostel locations, hostel student counts, building locations."}}

Rules:
- For "show boys hostels" → return poi type with all locations where loctype == "boys_hostel"
- For "show girls hostels" → return poi type with all locations where loctype == "girls_hostel"
- For "show faculty building" or "academic" → return poi type with loctype == "academic"
- For "how many hostels" → return text type with count from statistics
- For "show all hostels" → return poi type with all boys_hostel and girls_hostel locations
- For "total number of students" → return text type count from statistics
- For "where can I eat" or "cafeteria" or "food" → return poi type with loctype == "food"
- For "show all buildings" or "show everything" → return poi type with ALL locations
- For "what facilities does [building] have" → return text type listing facilities from that location
- For "timings" or "when is [building] open" → return text type with timings if available
- For "what departments" → return text type listing departments from Academic Block
- Always include lat, lng, label, and loctype in location objects

Respond with ONLY the JSON object, nothing else."""

    try:
        response = ollama.chat(
            model='llama3.2',
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': query}
            ]
        )
        
        # Extract response text
        response_text = response['message']['content'].strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith('```'):
            response_text = response_text.split('```')[1]
            if response_text.startswith('json'):
                response_text = response_text[4:]
            response_text = response_text.strip()
        
        # Parse JSON response
        response_data = json.loads(response_text)
        response_data["source"] = "ollama"
        return response_data
    
    except Exception as e:
        result = keyword_matching_fallback(query)
        result["source"] = "fallback" 
        return result

@app.route("/chat", methods=["POST"])
def chat():
    data = flask.request.get_json(silent=True)
    if not data:
        return flask.jsonify({"error": "No data provided"}), 400
    
    user_message = data.get("message", "")
    if not user_message:
        return flask.jsonify({"error": "No message provided"}), 400

    # Process query using Ollama 
    response = process_query_with_ollama(user_message)
    
    reply_data = {k: v for k, v in response.items() if k not in ['type', 'source']}
    
    # Return appropriate response format
    return flask.jsonify({
        "type": response["type"],
        "source": response.get("source", "ollama"),
        "reply": reply_data.get("message") if response["type"] == "text" else reply_data
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)