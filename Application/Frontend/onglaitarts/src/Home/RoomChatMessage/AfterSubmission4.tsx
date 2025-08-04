import React from "react";
import "./RoomChatMessage.css";
import { SendOutlined } from "@ant-design/icons";

const AfterSubmission4 = () => {
  return (
    <div className="roomchat-container">
      {/* <div className="side-bar">Sidebar</div> */}
      <div className="main-chat">
        <div>After Submission 4</div>
        <div className="text-container">
          <div className="text-box">
            <input
              type="text"
              placeholder="Enter Text"
              className="text-message"
            />
            <SendOutlined className="send-button" />
          </div>
        </div>
      </div>
      <div className="top-container">
        <div className="text-info">Fun Outing!</div>
        <div className="text-info-pin">PIN:</div>
        <div className="text-info-pin">1234ABCD</div>
      </div>
      <div className="sidebar">
        <button>Add to Calendar</button>
      </div>
    </div>
  );
};

export default AfterSubmission4;
