import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './Profile.css'
import editIcon from '../resources/edit-icon.svg';
import backIcon from '../resources/back-icon.svg';
import { send_form, send_put } from "../tools/request";
import { getAuthorisationHeader, infoFromCookie, saveCookie } from "../tools/authorisation";

const Profile = () => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [username, setUsername] = useState("");
    const [userId, setUserId] = useState("");
    const [profilePicture, setProfilePicture] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);



    useEffect(() => {
        const user_info = infoFromCookie()
        setUsername(user_info?.username || "");
        setUserId(user_info?.id || "");
        setProfilePicture(user_info?.profile_pic || "")
    }, []);

    const handleEditProfile = () => {
        setIsEditing(true);
    };

    const handleSaveProfile = async () => {
        setIsEditing(false);
        const headers = getAuthorisationHeader();
        if (!headers) {
            alert("Not authenticated.");
            return;
        }

        try {
            // 🔼 Upload profile picture first
            if (selectedFile) {
                const formData = new FormData();
                formData.append("file", selectedFile);

                const result = await send_form("/users/profile_pic/", formData, headers);
                if (!result?.error && result.profile_pic) {
                    setProfilePicture(result.profile_pic);
                    alert("Profile picture updated!");
                    setSelectedFile(null); // Clear after upload
                } else {
                    alert("Profile picture upload failed: " + (result?.error || "Unknown error"));
                    return; // Stop here if picture upload failed
                }
            }

            // ✏️ Update username after successful image upload
            const response = await send_put(
                "/users/",
                { username: username },
                headers
            );

            if (response?.access_token) {
                saveCookie(response.access_token);
                alert("Username updated!");
            } else {
                alert("Failed to update username: " + (response?.error || "Unknown error"));
            }

        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Error saving profile.");
        }
    };

    const handleUploadClick = () => {
        console.log('uploading...');
        document.getElementById('fileInput')?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Store the file for upload later
        setSelectedFile(file);

        // Preview the image
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) {
                setProfilePicture(reader.result.toString());
            }
        };
        reader.readAsDataURL(file);
    };

    const handleBackClick = () => {
        setIsEditing(false);
    };

    return (
        <div className='profile-container'>
            {isEditing && (
                <img src={backIcon} alt="Back" className='back-button' onClick={handleBackClick} />
            )}
            <p className='member-id'>Member ID: {userId}</p>
            <div className='profile-content'>
                <div className='profile-picture-container'>
                    <img src={profilePicture} alt="Profile Picture" className={`profile-picture ${isEditing ? 'editable' : ''}`} //conditionally add class
                        onClick={isEditing ? handleUploadClick : undefined} //conditionally attach onClick 
                    />
                    {isEditing && <img src={editIcon} alt="Edit Icon" className='edit-icon' onClick={handleUploadClick} />}
                </div>
                <div className='profile-flex'>
                    {isEditing ? (
                        <>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className='username-input'
                            />
                            <button className='submit-button' onClick={handleSaveProfile}>
                                Submit
                            </button>
                        </>
                    ) : (
                        <>
                            <p className='username'>{username}</p>
                            <button className='profile-button' onClick={handleEditProfile}>
                                Edit Profile
                            </button>
                            <button className='profile-button' onClick={() => navigate("/PastRooms")}>
                                View Past Rooms
                            </button>
                        </>
                    )}
                </div>
            </div>
            <input type="file" id="fileInput" style={{ display: 'none' }} onChange={handleFileChange} accept="image/*" />
        </div>
    );
};

export default Profile;