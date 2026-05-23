/*
  MessageList Component
  
-Container that renders the list of all chat messages.
-Maps over chatMessages array and renders each using ResponseRenderer.
 */
import React from 'react';
import ResponseRenderer from "./ResponseRenderer";

function MessageList({ chatMessages }) {
  return (
    <div className="chat-messages-container">
      {chatMessages.map((msg) => (
        <ResponseRenderer 
          key={msg.id} 
          message={msg.message} 
          sender={msg.sender} 
          type={msg.type} 
          source={msg.source}
        />
      ))}
    </div>
  );
}

export default MessageList;