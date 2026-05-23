import json
import os

from flask import Flask, request, jsonify
from flask_cors import CORS

import langchain_ollama

from chatbot.legalos_rag import factsRetriever
from chatbot.legalos_rag import ragInvoker


# -------------------- APP SETUP --------------------

app = Flask(__name__)
CORS(app)


# -------------------- LOAD CONFIG --------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CONFIG_PATH = os.path.join(BASE_DIR, "config", "rag_v1.json")

with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    config = json.load(f)

VECTOR_DB_PATH = os.path.abspath(
    os.path.join(BASE_DIR, config["vectordbpath"])
)
PROMPT_TEMPLATE = config["template"]


# -------------------- MODEL SETUP --------------------

SLM_MODEL_NAME = "qwen2.5:3b-instruct"

slm = langchain_ollama.ChatOllama(
    model=SLM_MODEL_NAME,
    temperature=1,
)


# -------------------- ROUTES --------------------


@app.route("/chat", methods=["GET", "POST"])
def chat():
    if request.method == "GET":
        query = request.args.get("message", "").strip()
    else:
        data = request.get_json(silent=True) or {}
        query = data.get("message", "").strip()

    if not query:
        return jsonify({"error": "Empty query"}), 400

    retrieved_docs = factsRetriever.getFacts(
        q=query,
        db_path=VECTOR_DB_PATH,
    )
    if not retrieved_docs:
        return jsonify({
            "answer_found": False,
            "reply": "Not found in the documents",
            "citations": [],
        })

    # Run RAG
    result = ragInvoker.invoker(
        slm,
        retrieved_docs,
        query,
        SLM_MODEL_NAME,
        PROMPT_TEMPLATE,
    )

    if not result.answer_found:
        return jsonify({
            "answer_found": False,
            "reply": "Not found in the documents",
            "citations": [],
        })

    return jsonify({
        "answer_found": True,
        "reply": result.explanation,
        "citations": [
            {
                "page": c.page,
                "quote": c.quote,
            }
            for c in result.citations
        ],
    })


# -------------------- ENTRY POINT --------------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
