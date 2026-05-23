## Frontend 

A minimal web-based UI is included to interact with the `/chat` API.

- Users can enter a message and send it to the backend
- The conversation history is displayed on the screen
- The UI communicates with the backend using HTTP POST requests

The frontend is built Using React and Vite.

## Technologies Used

Frontend:

React – UI framework

Vite – development server and build tool

Recharts – chart rendering library

Leaflet – map visualization

## Prerequisites 
1.Node.js v20+ (for build tools)


Update package list:-
```
sudo apt update
```

Install Node.js using nvm:-

 Install nvm:-
 ```

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

 reload shell:- 
```
source ~/.bashrc
```

 install Node 20:-
```
nvm install 20
nvm use 20
```

 Verify installation
 ```
node -v   # Should show v20.x.x
npm -v
```

## Install Frontend Dependencies

```
cd server/frontend
```

### Install Vite(build tool)
```
npm install vite
```

### Install other dependencies
```
npm install

npm install leaflet-draw
```
This installs:
- `recharts` - Chart rendering
- `vite` - Build tool
- `react`, `react-dom` - UI framework
- `leaflet` - Map library
- `leaflet-draw`- Draw tool

## Use the UI

1. Start the backend server(Python) 
```
cd server/backend/echo-server

python3 app.py
```
Backend runs on `http://localhost:5000`

2. Start the frontend
```
cd server/frontend

npm run dev
```

Vite will start the server
```
http://localhost:5501
```

Note:-
Node.js and npm are used only for frontend development and building:
- Installing dependencies (Recharts, Vite, React)
- Running development server with hot reload
- Building optimized production bundles

