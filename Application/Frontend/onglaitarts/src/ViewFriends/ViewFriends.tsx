import React, { useEffect, useState, useRef } from "react";
import { send_get } from "../tools/request";
import { getAuthorisationHeader } from "../tools/authorisation";
import { useNavigate } from "react-router-dom";
import './ViewFriends.css';
import backIcon from '../resources/back-icon.svg';

interface Friend {
    id: number;
    name: string;
    profile_pic: string;
}

const ViewFriends = () => {
    const navigate = useNavigate();
    const [friends, setFriends] = useState<Friend[]>([]);



    useEffect(() => {
        const fetchRoomInfo = async () => {
            const resp = await send_get("/friends/", getAuthorisationHeader());

            if (resp["error"]) {
                window.alert(resp.error);
            }
            else {
                setFriends(resp.friends);
            }
        }

        fetchRoomInfo();
    }, []);

    const handleBackClick = () => {
        navigate('/friends');
    };

    return (
        <div className="view-friends-page">
            <img src={backIcon} alt="Back" className='back-button' onClick={handleBackClick} />
            <h1 className="title-view-friends">Friends ({friends.length})</h1>
            <div className="friends-list">
                {friends.map((friend, index) => (
                    <div key={index} className='friend-card'>
                        <img src={friend.profile_pic} alt={`${friend.name}'s Profile Picture`} className="profile-icon" />
                        <div className="friend-info">
                            <p className="friend-name">{friend.name}</p>
                            <p className="friend-id">Member ID: {friend.id}</p>
                        </div>
                    // </div>
                ))}
            </div>
        </div>
    );
};

export default ViewFriends;