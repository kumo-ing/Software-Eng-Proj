import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { send_post } from "../tools/request";
import { jwtDecode } from "jwt-decode";

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
};

const useAuthRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
    }
  }, [navigate]);
};

const handleLogout = async () => {
  try {
    const authorisationHeader = getAuthorisationHeader();
    await send_post("/users/logout/", undefined, authorisationHeader);
  } catch (err) {
    console.error("Logout request failed:", err);
  }
  document.cookie = "access_token=; path=/; max-age=0";
  window.location.href = "/login";
};


const isLoggedIn = (): boolean => {
  const token = getCookie("access_token");
  return !!token;
};

const saveCookie = (token: string) => {
  document.cookie = `access_token=${token}; path=/; SameSite=Lax`;
}

const getAuthorisationHeader = () => {
  const match = document.cookie.match(new RegExp('(^| )access_token=([^;]+)'));
  if (match) {
    return { "Authorization": "Bearer " + match[2] };
  }
  return null;
}

interface DecodedToken {
  id: string;
  username: string;
  profile_pic: string;
}


const infoFromCookie = (): DecodedToken | null => {
  const match = document.cookie.match(/(^| )access_token=([^;]+)/);
  if (match) {
    const fullDecoded = jwtDecode<any>(match[2]);

    const simplified: DecodedToken = {
      id: fullDecoded.id,
      username: fullDecoded.sub, // `sub` becomes `username`
      profile_pic: fullDecoded.profile_pic,
    };

    return simplified;
  }
  return null;
};

export {
  useAuthRedirect,
  handleLogout,
  isLoggedIn,
  saveCookie,
  getAuthorisationHeader,
  infoFromCookie
};
