import React from "react";
import { useEffect, useRef } from "react";
import { infoFromCookie } from "../../tools/authorisation";
import styles from "./ChatMessage.module.css";

const ChatMessages = React.memo(
  ({ roomMsg }: { roomMsg: any[] }) => {
    const userId = infoFromCookie()?.id?.toString();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView();
    }, [roomMsg]);

    const formatTime = (datetime: string) => {
      const date = new Date(datetime);
      return date.toLocaleString("en-SG", {
        timeZone: "Asia/Singapore",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        day: "2-digit",
        month: "short",
      });
    };

    return (
      <div className={styles.chatMessagesContainer}>
        {roomMsg.map((msg: any, index) => {
          const isOwnMessage = msg.user_id === userId;

          return (
            <div
              key={index}
              className={`${styles.chatMessage} ${isOwnMessage ? styles.ownMessage : styles.otherMessage
                }`}
            >
              {!isOwnMessage && (
                <img
                  src={msg.profilePic}
                  alt={`${msg.username}'s profile`}
                  className={styles.chatProfilePic}
                />
              )}
              <div className={styles.chatMessageContent}>
                <div className={styles.chatMessageName}>
                  ({msg.username}) •{" "}
                  <span className={styles.chatMessageTime}>
                    {formatTime(msg.datetime)}
                  </span>
                </div>
                <div className={styles.chatMessageText}>{msg.message}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    );
  },
  (prevProps, nextProps) => {
    const prevMsgs = prevProps.roomMsg;
    const nextMsgs = nextProps.roomMsg;

    if (prevMsgs.length !== nextMsgs.length) return false;

    const prevLast = prevMsgs[prevMsgs.length - 1];
    const nextLast = nextMsgs[nextMsgs.length - 1];

    return (
      prevLast?.datetime === nextLast?.datetime &&
      JSON.stringify(prevLast) === JSON.stringify(nextLast)
    );
  }
);

export default ChatMessages;
