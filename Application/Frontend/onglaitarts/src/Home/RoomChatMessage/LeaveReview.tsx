// import React from "react";
// import "./RoomChatMessage.css";
// import { SendOutlined } from "@ant-design/icons";

// const LeaveReview = () => {
//   return (
//     <div className="roomchat-container">
//       {/* <div className="side-bar">Sidebar</div> */}
//       <div className="main-chat">
//         <div>Leave Review</div>
//         <div className="text-container">
//           <div className="text-box">
//             <input
//               type="text"
//               placeholder="Enter Text"
//               className="text-message"
//             />
//             <SendOutlined className="send-button" />
//           </div>
//         </div>
//       </div>
//       <div className="top-container">
//         <div className="text-info">Fun Outing!</div>
//         <div className="text-info-pin">PIN:</div>
//         <div className="text-info-pin">1234ABCD</div>
//       </div>
//       <div className="sidebar">
//         <button>Leave Review</button>
//         <button>Close Room</button>
//       </div>
//     </div>
//   );
// };

// export default LeaveReview;

import React, { useState } from "react";
import "./RoomChatMessage.css";
import { SendOutlined } from "@ant-design/icons";
import { Button, Modal, Rate, Input, message } from "antd";

const LeaveReview = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [reason, setReason] = useState("");

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    message.success(
      `Submitted! ⭐ Rating: ${rating}, Reason: ${reason || "N/A"}`
    );
    // Save to DB here (SQLite or API)
    setIsModalOpen(false);
    setRating(0);
    setReason("");
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="roomchat-container">
      <div className="main-chat">
        <div>Leave Review</div>
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
        <Button onClick={showModal} className="sidebar-button">
          Leave a Review
        </Button>
        <Button
          onClick={() => console.log("Close room")}
          className="sidebar-button"
        >
          Close Room
        </Button>
      </div>

      <Modal
        title="📌 Rate your experience!"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Submit"
        className="review-modal"
      >
        <p className="review-reason-label">
          How many stars would you rate (restaurant)?
        </p>
        <Rate onChange={(value) => setRating(value)} value={rating} />
        <p className="review-reason-label">
          Leave your reasoning below (optional):
        </p>
        <Input.TextArea
          placeholder="Enter your reason here!"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
        />
      </Modal>
    </div>
  );
};

export default LeaveReview;
