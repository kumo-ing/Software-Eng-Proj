import { useState } from 'react';
import { send_post } from "../tools/request";
import { getAuthorisationHeader } from "../tools/authorisation";
import { useNavigate } from "react-router-dom";
import './AddFriends.css';
import backIcon from '../resources/back-icon.svg';

const AddFriends = () => {
    const navigate = useNavigate();
    const [memberID, setMemberID] = useState('');
    const [error, setError] = useState('');

    const handleBackClick = () => {
        navigate('/friends');
    };

    const handleAddFriend = async () => {
        // if (memberID.length !== 5 || isNaN(Number(memberID))) {
        //     setError('Please enter a valid 5-digit Member ID');
        //     return;
        // }

        const resp = await send_post("/friends/", { friend_id: memberID }, getAuthorisationHeader());
        if (resp["error"]) {
            setError(resp.error);
            return;
        }
        else {
            console.log("Friend added successfully!");

            setMemberID('');
            setError('');
        }

    };

    return (
        <div className="add-friends-page">
            <img src={backIcon} alt='Back' className='back-button' onClick={handleBackClick} />
            <h1 className='title-add-friends'>Add Friend by Member ID</h1>
            <input
                type="text"
                placeholder="Enter Member ID"
                className='input-field'
                value={memberID}
                onChange={(e) => setMemberID(e.target.value)}
            />
            {error && <p className='error-message'>{error}</p>}
            <button className='add-friend-button' onClick={handleAddFriend}> Enter</button>
        </div>
    );
};

export default AddFriends;