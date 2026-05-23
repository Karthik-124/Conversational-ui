# Python Backend (Flask)

A Flask-based server logic for handling chat interactions.

## Installation

1. Create and activate a virtual environment:

```bash
 python -m venv .venv
 source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies

```bash
  pip install -r requirements.txt
```

3. Run the server: python app.py (Default port: 5000).

## Testing Text-Formatting

Plain Text:-
Just type normally in the chatbox

```
hello
```

## Markdown

JSON input from chatbox:-

```
{"message": "# Hello **world**", "type": "md"}
```

Sample JSON Request:-
Use this in the terminal after running the python file to see markdown based UX rendering

```

curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "type": "md",
    "message": "# Heading \"text\"\nThis is **bold** text"
  }'
```

Expected output:-

```
{
  "type": "md",
  "reply": "<h1>Heading \"text\"</h1>\n<p>This is <strong>bold</strong> text</p>",
  "raw": "# Heading \"text\"\nThis is **bold** text"
}
```

## Maps

JSON input from the chatbox:-

```
{
  "type": "poi",
  "zoom": 14,
  "locations": [
    {
      "lat": 13.5482,
      "lng": 80.0273,
      "label": "Boys Hostel 1",
      "loctype": "hostel"
    },
    {
      "lat": 13.5511,
      "lng": 80.0261,
      "label": "Academic Block",
      "loctype": "academic"
    }
  ]
}
```

## Radio-Inputs

JSON input from the chatbox:-

```
{
  "type": "choice",
  "message": {
    "text": "Where do you live?",
    "options": [
      "Hyderabad",
      "Chennai",
      "Kolkata",
      "Delhi"
    ]
  }
}

```

## Charts 

To Test Line Graph:-

```
{
  "type": "chart",
  "message": {
    "title":"Monthly Revenue",
    "chartType": "line",
    "data": [
      {"name": "Jan", "value": 400},
      {"name": "Feb", "value": 300},
      {"name": "Mar", "value": 500},
      {"name": "Apr", "value": 200}
    ]
  }
}
```

To Test Bar Graph:-
```
{
  "type": "chart",
  "message": {
    "title":"Monthly Revenue",
    "chartType": "bar",
    "data": [
      {"name": "Jan", "value": 400},
      {"name": "Feb", "value": 300},
      {"name": "Mar", "value": 500},
      {"name": "Apr", "value": 200}
    ]
  }
}
```

To Test Pie Chart:-
```
{
  "type": "chart",
  "message": {
    "title":"Strength",
    "chartType": "pie",
    "data": [
      {
        "name": "Boys",
        "value": 700
      },
      {
        "name": "Girls",
        "value": 250
      },
      {
        "name": "Faculty",
        "value": 50
      }
    ]
  }
}
```

## Tables

To Test Table:-
```
{
  "type": "table",
  "message": {
    "title": "Quarterly Performance Metrics",
    "columns": ["Month", "Revenue", "Users", "Status"],
    "rows": [
      { "Month": "Jan", "Revenue": "4,000", "Users": "1,200", "Status": "Complete" },
      { "Month": "Feb", "Revenue": "3,500", "Users": "1,100", "Status": "Complete" },
      { "Month": "Mar", "Revenue": "5,200", "Users": "1,850", "Status": "Complete" },
      { "Month": "Apr", "Revenue": "2,100", "Users": "900", "Status": "Pending" }
    ]
  }
}
```

## Polygon

To Test Polygon:-
```
{
  "type": "polygon",
  "message": {
    "zoom": 15,
    "polygons": [
      {
        "coordinates": [
          [13.558007818195478, 80.02470156284653],
          [13.552421147578343, 80.02443632826868],
          [13.55214897309095, 80.02502573844026],
          [13.552292222859634, 80.02614561776574],
          [13.552105998143048, 80.02838537641668],
          [13.552249247938406, 80.02865061099436],
          [13.552048698201162, 80.02959366726861],
          [13.552120323126545, 80.02994731337122],
          [13.552163298071875, 80.03030095947372],
          [13.552277897887308, 80.03055145879716],
          [13.555157200110841, 80.02965260828626],
          [13.556417779159545, 80.0297262845566],
          [13.558007818195478, 80.02470156284653]
        ],
        "label": "IIIT Campus Area",
        "color": "red"
      },
      {
        "coordinates": [
          [13.5510, 80.0210],
          [13.5490, 80.0210],
          [13.5490, 80.0230],
          [13.5510, 80.0230],
          [13.5510, 80.0210]
        ],
        "label": "Nearby Facility",
        "color": "blue"
      }
    ]
  }
}

```

## Interactive Polygon Drawing

Set `"interactive": true` to show a drawing toolbar on the map.
The user can draw a polygon by clicking points and double-clicking (or clicking the first point) to close.

To Test:-
```
{
  "type": "polygon",
  "message": {
    "center": {
      "lat": 13.5482,
      "lng": 80.0273
    },
    "zoom": 14,
    "interactive": true,
    "polygons": []
  }
}

```

### What gets sent back to the backend

When the user finishes drawing a polygon, the frontend POSTs to `POST /chat`:

```json
{
  "type": "polygon_drawn",
  "message": {
    "coordinates": [
      [13.548, 80.027],
      [13.550, 80.029],
      [13.546, 80.031]
    ],
    "timestamp": "2026-03-23T15:00:00.000Z"
  }
}
```

`coordinates` is an array of `[lat, lng]` pairs in the order the user drew them.

### Toolbar buttons


 ⬡  - Start drawing a polygon (single-click to add points, double-click or click first point to close) 

 ✎  - Edit an existing drawn polygon's vertices 
 
 ✕  - Delete a drawn polygon 