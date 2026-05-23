import React, { useState } from 'react'; 
import MessageList from './components/MessageList.jsx'; 
import ChatInput from './components/ChatInput.jsx';

function App() {
  
  const [chatMessages, setChatMessages] = useState([
    { message: "Server is online.", sender: "robot", type: "text", id: "init" }
  ]);

  return (
    <div className="app-container">
      <h3>Chat</h3>
      <MessageList chatMessages={chatMessages} />
      <ChatInput chatMessages={chatMessages} setChatMessages={setChatMessages} />
    </div>
  );
}


export default App;