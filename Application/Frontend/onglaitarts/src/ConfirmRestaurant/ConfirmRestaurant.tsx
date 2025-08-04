import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import './ConfirmRestaurant.css';

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
}

const ConfirmRestaurant = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const restaurants: Restaurant[] = (location.state as any)?.restaurants || [];

    const handleYesClick = () => {
        navigate('/VotingPage', { 
            state: { 
                lockVoting: true,
                restaurants: restaurants,
                votesUpdated: true
            } 
        });
    };

    const handleNoClick = () => {
        navigate('/VotingPage', {
            state: {
                lockVoting: false,
                restaurants: restaurants
            }
        });
    };

    return (
        <div className="confirm-restaurant-page">
            <h1>Please confirm your votes</h1>
            <button className="confirm-votes-button" onClick={handleYesClick}>Confirm</button>
            <button className="deny-votes-button" onClick={handleNoClick}>Back to Voting</button>
        </div>
    );
};

export default ConfirmRestaurant;
