/*
  ChatInput Component
  
 - Handles user input.
 - Auto-resizing textarea that grows with content.
 - Detects JSON input and sends as structured data.
 - Falls back to plain text for non-JSON input.
 - Enter to submit (Shift+Enter for new line)
 - Resets textarea height after sending message.
 */
import React from 'react';

/*
  Backend configuration:
  - Default (no ?url= param) → POST to AWS echo-bot
  - ?url=https://...trycloudflare.com/main?query= → GET to that Agriguard tunnel
  
  To switch: just change the URL in your browser, no code change needed.
*/
const _params      = new URLSearchParams(window.location.search);
const _dynamicUrl  = _params.get('url');

const _isLocal    = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const BACKEND_URL    = _dynamicUrl
  ? _dynamicUrl                        // ?url= → Agriguard tunnel (GET)
  : _isLocal
    ? 'http://127.0.0.1:5000/chat'     // local dev → localhost Flask
    : 'http://16.16.38.89/chat';       // production → AWS Flask
const BACKEND_METHOD = _dynamicUrl ? 'GET' : 'POST';

console.log(`[Backend] method=${BACKEND_METHOD} url=${BACKEND_URL}`);

// crypto.randomUUID() requires HTTPS — fallback for HTTP (AWS without SSL)
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/**
 * parseAgriguardUIData
 * 
 * Parses the ui_data entry from an Agriguard response.
 * Handles all inner types: poi, text, table, chart, md.
 * 
 * @param {object} agriguardEntry - the item from data[] with type === 'ui_data'
 * @returns {{ message, uitype }} - ready to set as chat message
 */
function parseAgriguardUIData(agriguardEntry, allEntries) {
  const innerData = agriguardEntry?.data?.data;
  const uitype    = agriguardEntry?.data?.type || 'text';

  console.log("[Agriguard] uitype:", uitype, "| innerData:", innerData);

  if (uitype === 'poi' && Array.isArray(innerData)) {
    // Build a lookup from any supplementary entry (e.g. db_agent message array)
    // keyed by "lat,lon" so we can merge richer fields into each map marker.
    const extraByLatLon = {};
    if (Array.isArray(allEntries)) {
      allEntries.forEach(entry => {
        const list = Array.isArray(entry.message) ? entry.message : null;
        if (!list) return;
        list.forEach(item => {
          const key = `${item.lat},${item.lon ?? item.lng}`;
          extraByLatLon[key] = item;
        });
      });
    }

    // Spread ALL original fields, then merge any extra fields by lat/lon.
    const locations = innerData
      .filter(w => w.lat != null && (w.lon != null || w.lng != null))
      .map(w => {
        const key  = `${w.lat},${w.lon ?? w.lng}`;
        const extra = extraByLatLon[key] || {};
        return {
          ...extra,             // richer fields from db_agent (name, capacity_mt, etc.)
          ...w,                 // ui_data fields override (lat, lon, market...)
          lng: w.lon ?? w.lng,  // normalize lon → lng for Leaflet
        };
      });

    console.log("[Agriguard] sample location:", locations[0]);
    return { message: { locations, zoom: 6 }, uitype: 'poi' };
  }

  // If type is 'table' and innerData is a plain array (not {columns, rows}),
  // normalize it into the {columns, rows} shape that renderTable expects.
  if (uitype === 'table' && Array.isArray(innerData)) {
    const columns = Object.keys(innerData[0] || {});
    console.log("[Agriguard] table array → normalizing. columns:", columns);
    return { message: { columns, rows: innerData.slice(0, 10) }, uitype: 'table' };
  }

  // For text, chart, md — pass innerData through as-is
  return { message: innerData, uitype };
}

function ChatInput({ chatMessages, setChatMessages }) {
  const [inputText, setInputText] = React.useState('');
  const textareaRef = React.useRef(null);

  async function sendMessage() {
    if (!inputText.trim()) return;

    const userMessage = {
      message: inputText,
      sender: 'user',
      id: generateUUID()
    };

    const loadingId = generateUUID();
    const loadingMessage = { id: loadingId, sender: 'robot', type: 'loading', message: '' };
    const updatedMessages = [...chatMessages, userMessage, loadingMessage];
    setChatMessages(updatedMessages);
    setInputText('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '40px';
    }

    try {
      // Build request
      let fetchUrl, fetchOptions;

      if (_dynamicUrl) {
        // Agriguard: direct GET from browser
        fetchUrl     = _dynamicUrl + encodeURIComponent(inputText);
        fetchOptions = { method: 'GET' };
      } else {
        // If inputText is valid JSON (e.g. pasted Agriguard response), send it directly
        // so the echo-bot's is_agriguard_response check can fire on the real structure.
        // Otherwise wrap in { message, type } for plain text messages.
        let parsedInput = null;
        try { parsedInput = JSON.parse(inputText); } catch { /* plain text */ }

        fetchUrl     = BACKEND_URL;
        fetchOptions = {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    parsedInput
            ? JSON.stringify(parsedInput)                        // raw JSON → send as-is
            : JSON.stringify({ message: inputText, type: 'text' }) // plain text → wrap
        };
      }
      // 90s timeout — Cloudflare tunnels cut at 100s, nginx proxy_read_timeout is 60s
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 9000000);

      console.log(`[${BACKEND_METHOD}] →`, fetchUrl);
      const response = await fetch(fetchUrl, { ...fetchOptions, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status} — check if nginx /proxy is configured and echo-bot is running.`);
      }

      const data = await response.json();
      console.log("Raw backend response:", JSON.stringify(data, null, 2));
      // --- Agriguard ui_data parsing ---
      const agriguardEntry = Array.isArray(data?.data)
        ? data.data.find(entry => entry.type === 'ui_data')
        : null;
      console.log("[Parser] agriguardEntry found:", !!agriguardEntry);

      let finalMessage, finalType, finalSource;

      if (agriguardEntry) {
        const { message, uitype } = parseAgriguardUIData(agriguardEntry, data.data);
        finalMessage = message;
        finalType    = uitype;
        finalSource  = 'agriguard';
      } else {
        // Standard echo-bot / other backend response
        finalMessage = data.reply;
        finalType    = data.type;
        finalSource  = data.source;
      }

      console.log("[Render] type:", finalType, "| source:", finalSource, "| message:", finalMessage);

      // Replace the loading placeholder with the real response
      setChatMessages(prev =>
        prev
          .filter(m => m.id !== loadingId)
          .concat({
            message: finalMessage,
            type:    finalType,
            source:  finalSource,
            sender:  'robot',
            id:      generateUUID()
          })
      );
    } catch (error) {
      console.error("Error connecting to backend:", error);
      const isTimeout = error.name === 'AbortError';
      // Replace loading spinner with a visible error message
      setChatMessages(prev =>
        prev
          .filter(m => m.id !== loadingId)
          .concat({
            message: isTimeout
              ? 'Request timed out (>90s). The backend may still be processing — try again.'
              : `Error: ${error.message}`,
            type:   'text',
            source: 'error',
            sender: 'robot',
            id:     generateUUID()
          })
      );
    }
  }

  return (
    <div className="chat-input-container">
      <textarea
        ref={textareaRef}
        className="chat-input"
        placeholder="Send a Message"
        rows="4"
        style={{ height: 'auto', minHeight: '40px', resize: 'none' }}
        onChange={(e) => {
          setInputText(e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
        value={inputText}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        }}
      />
      <button className="send-button" onClick={sendMessage}>Send</button>
    </div>
  );
}

export default ChatInput;