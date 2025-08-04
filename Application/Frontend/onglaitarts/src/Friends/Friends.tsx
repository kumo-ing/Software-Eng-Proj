import { useNavigate } from "react-router-dom";
import './Friends.css';

const Friends = () => {
    const navigate = useNavigate();

    const handleViewFriends = () => {
        console.log('View friends button clicked');
    };

    return (
        <div className='friends-page'>
            <p className='member-id'>Member ID: 58419</p>
            <h1 className='friends-title'>Friends</h1>
            <div className='button-container'>
                <button className='friends-button' onClick={() => navigate("/AddFriends")}>
                    Add Friend by Member ID
                </button>
                <button className='friends-button' onClick={() => navigate("/ViewFriends")}> 
                    View Friends 
                </button>
            </div>
        </div>
    );
};

export default Friends;