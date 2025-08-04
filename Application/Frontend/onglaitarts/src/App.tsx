import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import NavBar from "./NavBar/NavBar";
import Home from "./Home/Home";
import Login from "./Login/Login";
import NotFound from "./NotFound/NotFound";
import Background from "./Background/Background";
import ForgetPassword from "./Login/Forget Password/ForgetPassword";
import SignUp from "./Login/Sign Up/SignUp";
import NewPassword from "./Login/Forget Password/NewPassword";
import ResetConfirmation from "./Login/Forget Password/ResetConfirmation";
import EnterPassword from "./Login/Sign Up/EnterPassword";
import AccountConfirmation from "./Login/Sign Up/AccountConfirmation";
import { GoogleOAuthProvider } from "@react-oauth/google";
import RoomChatMessage from "./Home/RoomChatMessage/RoomChatMessage";
import JoinRoom from "./Join Room/Join Room/joinRoom";
import CreateRoom from "./Create Room/createRoom";
import AddNickname from "./Join Room/Add Nickname/addNickname";
import ViewRooms from "./View Rooms/viewRooms";
// import SelectFood from "./Preferences/Food/selectFood";
// import SelectLocation from "./Preferences/Location/selectLocation";
// import SelectDate from "./Preferences/Date&Time/selectDate";
import LeaveReview from "./Home/RoomChatMessage/LeaveReview";
import AfterSubmission4 from "./Home/RoomChatMessage/AfterSubmission4";
import AfterSubmission3 from "./Home/RoomChatMessage/AfterSubmission3";
import AfterSubmission2 from "./Home/RoomChatMessage/AfterSubmission2";
import AfterSubmission from "./Home/RoomChatMessage/AfterSubmission";
import { ConfigProvider } from "antd";
import SpinTheWheel from "./Spin The Wheel/spinTheWheel";
import Profile from "./Profile/Profile";
import PastRooms from "./PastRooms/PastRooms";
import Friends from "./Friends/Friends";
import AddFriends from "./AddFriends/AddFriends";
import ViewFriends from "./ViewFriends/ViewFriends";
// import VotingPage from "./VotingPage/VotingPage";
import ConfirmRestaurant from "./ConfirmRestaurant/ConfirmRestaurant";

function App() {
  // keep username in cookie when login then extract it out here
  const username = "OngLaiTarts";

  return (
    <Router>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#ff7590",
            colorPrimaryHover: "#ff6f82",
            colorPrimaryActive: "#ff5e75",
          },
        }}
      >
        <NavBar username={username} />
        <Background>
          <GoogleOAuthProvider clientId="614838875620-53vlupjbc5pahigc7i4bd99kqaq32a8p.apps.googleusercontent.com">
            <Routes>
              <Route path="*" element={<NotFound />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgetpassword" element={<ForgetPassword />} />
              <Route path="/newpassword" element={<NewPassword />} />
              <Route
                path="/resetconfirmation"
                element={<ResetConfirmation />}
              />
              <Route path="/signup" element={<SignUp />} />
              {/* <Route path="/enterpassword" element={<EnterPassword />} /> */}
              <Route path="/roomchat/:roomId" element={<RoomChatMessage />} />
              {/* <Route
                path="/accountconfirmation"
                element={<AccountConfirmation />}
              /> */}
              <Route path="/home" element={<Home />} />
              <Route path="/" element={<Navigate to="login" />} />
              <Route path="/joinroom" element={<JoinRoom />} />
              <Route path="/createroom" element={<CreateRoom />} />
              {/* <Route path="/addnickname" element={<AddNickname />} /> */}
              <Route path="/viewrooms" element={<ViewRooms />} />
              {/* <Route path="/selectfood" element={<SelectFood />} /> */}
              {/* <Route path="/selectlocation" element={<SelectLocation />} /> */}
              {/* <Route path="/selectdate" element={<SelectDate />} /> */}
              <Route path="/aftersubmission" element={<AfterSubmission />} />
              <Route path="/aftersubmission2" element={<AfterSubmission2 />} />
              <Route path="/aftersubmission3" element={<AfterSubmission3 />} />
              <Route path="/aftersubmission4" element={<AfterSubmission4 />} />
              <Route path="/leavereview" element={<LeaveReview />} />
              <Route path="/spinthewheel" element={<SpinTheWheel />} />
              <Route path="/Profile" element={<Profile />} />
              <Route path="/PastRooms" element={<PastRooms />} />
              <Route path="/Friends" element={<Friends />} />
              <Route path="/AddFriends" element={<AddFriends />} />
              <Route path="/ViewFriends" element={<ViewFriends />} />
              {/* <Route path="/VotingPage" element={<VotingPage />} /> */}
              <Route
                path="/confirm-restaurant"
                element={<ConfirmRestaurant />}
              />
            </Routes>
          </GoogleOAuthProvider>
        </Background>
        {/* </div> */}
      </ConfigProvider>
    </Router>
  );
}

export default App;
