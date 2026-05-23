import flask
import flask_cors
import markdown
import json
import requests as req_lib

app = flask.Flask(__name__)
flask_cors.CORS(app)

@app.route("/proxy", methods=["POST"])
def proxy():
    """
    Proxies a GET request to an external backend (e.g. Agriguard Cloudflare tunnel).
    Body: { "url": "https://tunnel.trycloudflare.com/main?query=", "query": "user message" }
    Forwards as GET server-side → no browser CORS restrictions.
    """
    data = flask.request.get_json(silent=True) or {}
    backend_url = data.get("url", "")
    query       = data.get("query", "")
    if not backend_url:
        return flask.jsonify({"error": "No url provided"}), 400

    try:
        full_url = backend_url + req_lib.utils.quote(query, safe="")
        resp = req_lib.get(full_url, timeout=1800)
        return flask.jsonify(resp.json())
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 502

def is_agriguard_response(data):
    """Check if the payload looks like an Agriguard API response."""
    if not isinstance(data, dict):
        return False
    items = data.get("data", None)
    if not isinstance(items, list):
        return False
    return any(isinstance(item, dict) and item.get("type") == "ui_data" for item in items)

@app.route("/chat", methods=["GET", "POST"])
def chat():
    if flask.request.method == "GET":
        content = flask.request.args.get("message", "")
        msg_type = "text"
    else:
        data = flask.request.get_json(silent=True)
        if data:
            # --- Agriguard pass-through ---
            # If the request body IS an Agriguard response (e.g. proxied from the real API),
            # return it as-is so the frontend can parse the ui_data.
            if is_agriguard_response(data):
                return flask.jsonify(data)

            msg_type = data.get("type", "text")
            
            if msg_type == "poi":
                content = data
            elif msg_type == "choice":
                content = data.get("message", {})
            else:
                content = data.get("message", "")
        else:
            content = flask.request.data.decode("utf-8")
            msg_type = "text"

    
    if not content:
        return flask.jsonify({"error": "No message provided"}), 400

    if msg_type == "md":
        reply = markdown.markdown(content, extensions=["tables", "fenced_code"])
    elif msg_type in ["poi", "choice"]:
        
        if not isinstance(content, dict):
            try:
                content = json.loads(content)
                reply = content
            except:
                msg_type = "text"
                reply = content
        else:
            reply = content
    else:
        reply = content

    return flask.jsonify({
        "type": msg_type,
        "reply": reply
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)