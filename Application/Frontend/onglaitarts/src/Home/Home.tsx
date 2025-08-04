import { useNavigate } from "react-router-dom";
import "./Home.css";
import { useAuthRedirect } from '../tools/authorisation'

const Home = () => {
  const navigate = useNavigate();
  useAuthRedirect()

  return (
    <div className="main-container">
      <p className="main-title">Choose Mode</p>
      <div className="flex-container">
        <div className="join-room-bg">
          <button
            className="styled-button"
            onClick={() => navigate("/joinroom")}
          >
            Join a Room
          </button>
        </div>
        <div className={"create-room-bg"}>
          <button
            className={"styled-button"}
            onClick={() => navigate("/createroom")}
          >
            Create a Room
          </button>
        </div>
        <div className="view-room-bg">
          <button
            className="styled-button"
            onClick={() => navigate("/viewrooms")}
          >
            View All Rooms
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
