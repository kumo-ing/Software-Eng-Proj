import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import "./RoomChatMessage.css";
import { SendOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import xIcon from "../../resources/x-icon.png";
import { send_get, send_post } from "../../tools/request";
import { getAuthorisationHeader, infoFromCookie } from "../../tools/authorisation";
import ChatMessages from "./ChatMessages";
import SelectDate from "../../Preferences/Date&Time/selectDate";
import SelectFood from "../../Preferences/Food/selectFood";
import SelectLocation from "../../Preferences/Location/selectLocation";
import VotingPage from "../../VotingPage/VotingPage";

interface Message {
  message: string;
  user_id: string;
  username: string;
  profilePic: string;
  datetime: string;
  isSystem?: boolean;
}

interface Friend {
  id: number;
  name: string;
  profile_pic: string;
}

interface VoteSummary {
  confirmed_count: number;
  has_submitted: boolean;
  total_users: number;
}

interface DateRes {
  cuisine: string;
  date: string;
  location: string;
  meal: string;
}

const RoomChatMessage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [roomPin, setRoomPin] = useState("");
  const [userInput, setUserInput] = useState("");
  const [roomMsg, setRoomMsg] = useState<Message[]>([]);
  const [roomName, setRoomName] = useState("");
  const [showAddTime, setShowAddTime] = useState(false);
  const [showSelectfood, setshowSelectfood] = useState(false);
  const [showSelectLocation, setShowSelectLocation] = useState(false);
  const [showSpinthewheel, setShowSpinthewheel] = useState(false);
  const [showVoteFood, setShowVoteFood] = useState(false);
  const [systemMsg, setSystemMsg] = useState<Message | null>(null);

  const [vote_summary, setVote_summary] = useState<VoteSummary | null>(null);
  const [dateRes, setDateRes] = useState<DateRes | null>(null);
  const [refetch, setRefetch] = useState(false)

  useEffect(() => {
    fetchMessages()
    fetchRoomInfo();
    fetchFriends();
    fetchVoteSummary();
  }, [refetch]);


  useEffect(() => {
    fetchMessages(); // load once initially

    const interval = setInterval(() => {
      fetchMessages();
    }, 5000); // every 5 seconds

    return () => clearInterval(interval); // cleanup
  }, [roomId]);

  const fetchMessages = async () => {
    const resp = await send_get("/chat/" + roomId + "/", getAuthorisationHeader());

    if (resp["error"]) {
      window.alert(resp.error);
      return;
    }

    const allMessages: Message[] = resp.messages.map((msg: any) => ({
      message: msg.message,
      user_id: msg.user_id,
      username: msg.username,
      profilePic: msg.profile_pic,
      datetime: msg.datetime,
      isSystem: msg.user_id === "99999",
    }));

    const system = allMessages.find((m) => m.user_id === "99999") || null;
    const normalMessages = allMessages.filter((m) => m.user_id !== "99999");

    setSystemMsg(system);
    setRoomMsg(normalMessages);
  };

  const fetchRoomInfo = async () => {
    const resp = await send_get("/rooms/info/" + roomId + "/", getAuthorisationHeader());

    if (resp["error"]) {
      window.alert(resp.error);
    }
    else {
      console.log("Room Info", resp);
      setRoomName(resp.room_info.name);
      setRoomPin(resp.room_info.room_code);

      const finalized: DateRes = {
        cuisine: resp.room_info.cuisine,
        date: resp.room_info.date,
        location: resp.room_info.location,
        meal: resp.room_info.meal
      };
      setDateRes(finalized)
    }
  }

  const fetchFriends = async () => {
    const resp = await send_get("/friends/", getAuthorisationHeader());

    if (resp["error"]) {
      window.alert(resp.error);
    }
    else {
      console.log("Friends", resp);
      setFriends(resp.friends);
    }
  }

  const fetchVoteSummary = async () => {
    if (!roomId) return;

    const resp = await send_get(`/room_preference/summary/${roomId}`, getAuthorisationHeader());

    if (resp?.error) {
      console.error("Failed to fetch vote summary:", resp.error);
    } else {
      setVote_summary({
        confirmed_count: resp.confirmed_count,
        has_submitted: resp.has_submitted,
        total_users: resp.total_users,
      });
    }
  };


  const handleInvite = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(roomPin);
    alert("Room PIN copied to clipboard!");
  };


  const handleSubmission = async () => {
    if (!roomId) {
      alert("Invalid room ID");
      return;
    }

    const resp = await send_post(`/room_preference/confirm/${roomId}`, {}, getAuthorisationHeader());

    if (resp?.error) {
      alert("Submission failed: " + resp.error);
    } else {
      alert("Your preferences have been submitted successfully!");

      // Increment confirmed_count by 1 and mark user as submitted
      setVote_summary((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          confirmed_count: prev.confirmed_count + 1,
          has_submitted: true
        };
      });

      if (vote_summary && resp.confirmed_user.length === vote_summary.total_users) {
        const resp2 = await send_post("/room_preference/finalize/" + roomId, {}, getAuthorisationHeader());

        if (resp2?.error) {
          console.error("Failed to finalize room preferences:", resp2.error);
          return;
        }

        const finalized: DateRes = {
          cuisine: resp2.cuisine,
          date: resp2.date,
          location: resp2.location,
          meal: resp2.meal
        };
        setDateRes(finalized);
        console.log("Finalized preferences:", finalized);
      }

    }
    setRefetch(!refetch);
  };


  function getFormattedDatetime() {
    const now = new Date();

    // Get ISO string with milliseconds: "2025-04-05T19:15:58.122Z"
    const iso = now.toISOString(); // ends with 'Z' (UTC)

    // Remove the 'Z' and pad to 6-digit microseconds (add '000' to ms)
    const [datePart, timePart] = iso.split('T');
    const [time, ms] = timePart.split('.');
    const microseconds = (ms.slice(0, 3) + '000').padEnd(6, '0'); // "122" => "122000"

    return `${datePart}T${time}.${microseconds}`;
  }

  const addFriendToGrp = async (friendId: number, friendName: string) => {
    const resp = await send_post("/rooms/add_friend", { friend_id: friendId, room_id: roomId, nickname: friendName }, getAuthorisationHeader());
    if (resp["error"]) {
      window.alert(resp.error);
    }
    else {
      window.alert("Friend added to group!");
      setIsModalOpen(false);
    }
  }


  const sendMsg = async () => {
    const userInfo = infoFromCookie();
    const enteredMsg = userInput;
    setUserInput("");

    if (userInput !== "") {
      const msgPayload = {
        message: userInput,
        room_id: roomId,
      }

      const resp = await send_post("/chat/", msgPayload, getAuthorisationHeader());
      if (resp["error"]) {
        window.alert(resp.error);
      }
      else {
        const newMsg: Message = {
          message: enteredMsg,
          user_id: userInfo?.id.toString() || "",
          username: "sending",
          profilePic: userInfo?.profile_pic || "",
          datetime: getFormattedDatetime(),
        };
        setRoomMsg((prevMessages) => [...prevMessages, newMsg]);
      }
    }
  }

  const SideBar = () => {
    if (vote_summary?.has_submitted && vote_summary?.confirmed_count !== vote_summary?.total_users || false) {
      return <div className="sidebar">
        Waiting for everyone to submit
        <div className="submission-text">{vote_summary?.confirmed_count}/{vote_summary?.total_users} has submitted!</div>
      </div >
    }
    else if (vote_summary?.has_submitted && vote_summary?.confirmed_count !== vote_summary?.total_users) {
      // else if (true) {
      return <div className="sidebar">
        <button onClick={() => setShowVoteFood(true)}>Vote For Food</button>
        <button onClick={handleSubmission} className="submit-button">
          Submit
        </button>
        <div className="submission-text">{vote_summary?.confirmed_count}/{vote_summary?.total_users} has submitted!</div>
      </div>
    }
    else if (vote_summary?.confirmed_count === vote_summary?.total_users) {
      return <div className="sidebar">
        <button onClick={() => setShowVoteFood(true)}>Vote For Food</button>
        <button onClick={handleSubmission} className="submit-button">
          Submit
        </button>
        <div className="submission-text">{vote_summary?.confirmed_count}/{vote_summary?.total_users} has submitted!</div>
      </div>
    }
    else {
      return <div className="sidebar">
        <button onClick={handleInvite}>Invite</button>
        <button onClick={() => setShowAddTime(true)}>Add Time</button>
        <button onClick={() => setshowSelectfood(true)}>Add Food</button>
        <button onClick={() => setShowSelectLocation(true)}>Add Location</button>
        <button onClick={handleSubmission} className="submit-button">
          Submit
        </button>
        <div className="submission-text">{vote_summary?.confirmed_count}/{vote_summary?.total_users} has submitted!</div>
      </div >
    }

  }

  if (showAddTime) {
    if (!roomId) {
      return <div>Invalid room ID</div>;
    }

    return <SelectDate room_id={roomId} setShowAddTime={setShowAddTime} />;
  }
  else if (showSelectfood) {
    if (!roomId) {
      return <div>Invalid room ID</div>;
    }

    return <SelectFood room_id={roomId} setShowSelectfood={setshowSelectfood} />;
  }
  else if (showSelectLocation) {
    if (!roomId) {
      return <div>Invalid room ID</div>;
    }

    return <SelectLocation room_id={roomId} setShowSelectLocation={setShowSelectLocation} />;
  }
  else if (showVoteFood) {
    if (!roomId) {
      return <div>Invalid room ID</div>;
    }

    return <VotingPage room_id={roomId} setShowVoteFood={setShowVoteFood} cuisine={dateRes?.cuisine || ""} location={dateRes?.location || ""} />;
  }
  else {
    return (
      <div className="roomchat-container">
        <div className="main-chat">
          {systemMsg && (
            <div className="pinned-system-msg">
              <div className="pinned-label">Pinned Message</div>
              <div className="pinned-content">
                {systemMsg.message
                  .split("\n")
                  .map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
              </div>

            </div>
          )}
          <ChatMessages roomMsg={roomMsg} />
          <div className="text-container">
            <div className="text-box">
              <input
                type="text"
                placeholder="Enter Text"
                className="text-message"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault(); // prevent newline or form submission
                    sendMsg();
                  }
                }}
              />
              <SendOutlined onClick={() => sendMsg()} className="send-button" />
            </div>
          </div>
        </div>
        <div className="top-container">
          <div className="text-info">{roomName}</div>
          <div className="text-info-pin">PIN:</div>
          <div className="text-info-pin">{roomPin}</div>
        </div>
        <SideBar />

        {/* Invite Friends Modal */}
        {isModalOpen && (
          <div className="invite-friend-modal">
            <div className="friend-modal">
              <img
                src={xIcon}
                alt="Close"
                className="modal-close-icon"
                onClick={handleCloseModal}
              />
              <h2>Invite Friends</h2>
              <div className="modal-friend-list">
                {friends.map((friend) => (
                  <div key={friend.id} className="modal-friend-item">
                    <img
                      src={friend.profile_pic}
                      alt={`${friend.name}'s profile`}
                      className="modal-friend-profile-pic"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "http://localhost:5000/api/users/profilepic?filename=default.png";
                      }}
                    />
                    <div onClick={() => addFriendToGrp(friend.id, friend.name)} className="modal-friend-details">
                      <div className="modal-friend-name">{friend.name}</div>
                      <div className="modal-friend-id">ID: {friend.id}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleCopyPin} className="copy-pin-button">
                Copy Room PIN
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
};

const formatSystemDate = (message: string): string => {
  const match = message.match(/Date and time:(.+?)\n?/);
  if (match && match[1]) {
    try {
      const date = new Date(match[1].trim());
      return date.toLocaleString(); // or use dayjs for formatting
    } catch {
      return match[1].trim();
    }
  }
  return "Unknown";
};

const formatSystemLocation = (message: string): string => {
  const match = message.match(/Area:(.+)/);
  return match ? match[1].trim() : "Unknown";
};

export default RoomChatMessage;
