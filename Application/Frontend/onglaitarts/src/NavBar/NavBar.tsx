import { useLocation, useNavigate } from "react-router-dom";
import "./NavBar.css";
import pineapl from "../resources/pineapple_glasses.png"; // Import the pineapple icon
import { isLoggedIn, handleLogout } from '../tools/authorisation'

interface NavProps {
  username: string;
}

const NavBar = ({ username }: NavProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const LoggedIn = () => {
    if (isLoggedIn()) {
      return (
        <button className="nav-button" onClick={() => handleLogout()}>
          Log out
        </button>
      )
    }
    return null;
  }

  const ShowHome = () => {
    if (location.pathname !== "/home") {
      return (
        <button className="nav-button" onClick={() => navigate("/home")}>
          Home
        </button>
      );
    }
    return null;
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <img src={pineapl} alt="pineapple" className="pineapple-icon" />
        <span className="nav-name">{username}</span>
      </div>
      <div className="right_side">
        <LoggedIn />
        <ShowHome />
        <button className="nav-button" onClick={() => navigate("/profile")}>
          Profile
        </button>
        <button className="nav-button" onClick={() => navigate("/friends")}>
          Friends
        </button>
        {/* <button className="nav-button" onClick={() => navigate("/VotingPage")}>
          Voting (temp)
        </button> */}
      </div>
    </nav>
  );
};

export default NavBar;

// import { useLocation, useNavigate } from "react-router-dom";
// import "./NavBar.css";
// import pineapl from "../resources/pineapple_glasses.png"; // Import the pineapple icon

// interface NavProps {
//   username: string;
// }

// const NavBar = ({ username }: NavProps) => {
//   const location = useLocation();
//   const navigate = useNavigate();

//   const ShowHome = () => {
//     if (location.pathname !== "/home") {
//       return (
//         <button className="nav-button" onClick={() => navigate("/home")}>
//           Home
//         </button>
//       );
//     }
//     return null;
//   };

//   return (
//     <nav className="navbar">
//       <div className="nav-left">
//         <img src={pineapl} alt="pineapple" className="pineapple-icon" />
//         <span className="nav-name">{username}</span>
//       </div>
//       <div className="right_side">
//         <ShowHome />
//         <button className="nav-button" onClick={() => navigate("/profile")}>
//           Profile
//         </button>
//         <button className="nav-button" onClick={() => navigate("/friends")}>
//           Friends
//         </button>
//       </div>
//     </nav>
//   );
// };

// export default NavBar;
