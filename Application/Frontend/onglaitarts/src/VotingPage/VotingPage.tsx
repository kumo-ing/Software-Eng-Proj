import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './VotingPage.css';
import backIcon from '../resources/back-icon.svg';
import { send_get } from '../tools/request';
import { getAuthorisationHeader } from '../tools/authorisation';
import { infoFromCookie } from "../tools/authorisation";

interface VotingPageProps {
    room_id: string;
    setShowVoteFood: React.Dispatch<React.SetStateAction<boolean>>;
    cuisine: string;
    location: string;
}

interface Restaurant {
    id: number;
    name: string;
    location: string;
    cuisine: string;
    rating: string;
    votes: number;
    userVote: number;
    details: string;
    reviews: { rating: string; text: string; avatar: string }[];
    upvotedUserIds: string[];
    downvotedUserIds: string[];
}

const VotingPage: React.FC<VotingPageProps> = ({ room_id, setShowVoteFood, cuisine, location }) => {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const userId = infoFromCookie()?.id || "";

    useEffect(() => {
        const fetchRestaurants = async () => {

            const url = `/foods/search/` + room_id;
            const resp = await send_get(url, getAuthorisationHeader());

            if (resp.error) {
                window.alert("Failed to fetch restaurants: " + resp.error);
                return;
            }

            const processed = resp.map((r: any, index: number): Restaurant => ({
                id: index + 1,
                name: r.name,
                location: r.address,
                cuisine: cuisine,
                rating: r.rating ? `${r.rating}/5` : "N/A",
                votes: 0,
                userVote: 0,
                details: `Rating: ${r.rating}/5\nLocation: ${r.address}\nCuisine: ${cuisine}`,
                reviews: [],
                upvotedUserIds: [],
                downvotedUserIds: []
            }));


            setRestaurants(processed);
        };

        fetchRestaurants();
    }, [cuisine, location]);

    const handleVote = (id: number, change: number) => {
        setRestaurants((prevRestaurants) =>
            prevRestaurants.map((restaurant) => {
                if (restaurant.id !== id) return restaurant;

                const newUpvoted = [...restaurant.upvotedUserIds];
                const newDownvoted = [...restaurant.downvotedUserIds];
                let newUserVote = restaurant.userVote;
                let voteAdjustment = 0;

                // Undo vote
                if (restaurant.userVote === change) {
                    newUserVote = 0;
                    voteAdjustment = -change;

                    if (change === 1) {
                        const index = newUpvoted.indexOf(userId);
                        if (index !== -1) newUpvoted.splice(index, 1);
                    } else {
                        const index = newDownvoted.indexOf(userId);
                        if (index !== -1) newDownvoted.splice(index, 1);
                    }
                } else {
                    // Switch vote or new vote
                    voteAdjustment = change - restaurant.userVote;

                    // Remove from previous vote list
                    if (restaurant.userVote === 1) {
                        const index = newUpvoted.indexOf(userId);
                        if (index !== -1) newUpvoted.splice(index, 1);
                    } else if (restaurant.userVote === -1) {
                        const index = newDownvoted.indexOf(userId);
                        if (index !== -1) newDownvoted.splice(index, 1);
                    }

                    // Add to new list
                    if (change === 1 && !newUpvoted.includes(userId)) {
                        newUpvoted.push(userId);
                    } else if (change === -1 && !newDownvoted.includes(userId)) {
                        newDownvoted.push(userId);
                    }

                    newUserVote = change;
                }

                return {
                    ...restaurant,
                    votes: restaurant.votes + voteAdjustment,
                    userVote: newUserVote,
                    upvotedUserIds: newUpvoted,
                    downvotedUserIds: newDownvoted
                };
            })
        );
    };

    return (
        <div className="voting-page">
            <img
                src={backIcon}
                alt="Back"
                className="back-button"
                onClick={() => setShowVoteFood(false)}
            />
            <h1 className="title-voting">Vote for Food Options</h1>

            <div className="restaurants-list">
                {restaurants.map((restaurant, index) => (
                    <div key={restaurant.id} className="restaurant-card">
                        <div className="restaurant-info">
                            <p>{index + 1}. {restaurant.name}</p>
                            <p>{restaurant.location}</p>
                            <p>Cuisine: {restaurant.cuisine}</p>
                            <p>Rating: {restaurant.rating}</p>
                        </div>

                        <div className="vote-buttons">
                            <button
                                onClick={() => handleVote(restaurant.id, 1)}
                                className={restaurant.userVote === 1 ? "voted" : ""}
                            >
                                👍
                            </button>
                            <span>{restaurant.votes}</span>
                            <button
                                onClick={() => handleVote(restaurant.id, -1)}
                                className={restaurant.userVote === -1 ? "voted" : ""}
                            >
                                👎
                            </button>
                        </div>
                    </div>

                ))}
            </div>
            <button
                className="confirm-button"
                onClick={() => {
                    console.log("📝 Full Submitted Restaurant Data:", restaurants);
                }}
            >
                Submit Voting Options
            </button>

        </div>
    );
};

export default VotingPage;
