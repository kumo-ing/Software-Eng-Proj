import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import './PastRooms.css';
import backIcon from '../resources/back-icon.svg';

const PastRooms = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState<{name: string; pin: string; people: number; dateTime: string; closed: string}[]>([]);
    const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null); //tracks if menu is open

    const handleBackClick = () => {
        navigate('/profile');
    };

    //Automatically loads when page is entered
    useEffect(() => {
        const exampleData = [
            { name: 'The Bois', pin: '11062589', people: 5, dateTime: '29/02/25 Lunch', closed: '29/02/25' }, 
            { name: 'Ong Lai Lads', pin: '31652510', people: 5, dateTime: '08/03/25 Dinner', closed: '15/03/25' }
        ];
        setRooms(exampleData);
    }, []); //empty dependency array makes it only run once when entered

    const toggleMenu = (index: number) => {
        setOpenMenuIndex(openMenuIndex === index ? null : index);
    };

    const removeRoom = (index: number) => {
        setRooms(rooms.filter((_, i) => i !== index)); //removes room from array
        setOpenMenuIndex(null);
    };

    return (
        <div className="past-rooms-page">
            <img src={backIcon} alt="Back" className='back-button' onClick={handleBackClick} />
            <h1 className='title'>Past Rooms</h1>
            <div className='past-rooms-container'>
                <table className='past-rooms-table'>
                    <thead>
                        <tr>
                            <th>Room Name</th>
                            <th>Room PIN</th>
                            <th>No. of Ppl</th>
                            <th>Date & Time</th>
                            <th>Closed</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rooms.length === 0 ? (
                            <tr>
                                <td colSpan={6} className='empty-message'>No data available</td>
                            </tr>
                        ) : (
                            rooms.map((room, index) => (
                                <tr key={index}>
                                    <td>{room.name}</td>
                                    <td>{room.pin}</td>
                                    <td>{room.people}</td>
                                    <td>{room.dateTime}</td>
                                    <td>{room.closed}</td>
                                    <td className='actions-column'>
                                        <div className='menu-container'>
                                            <button className='menu-button' onClick={() => toggleMenu(index)}>⋮</button>
                                            {openMenuIndex === index && (
                                                <div className='dropdown-menu'>
                                                    <button onClick={() => removeRoom(index)}>Remove Room</button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PastRooms;