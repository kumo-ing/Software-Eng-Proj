import { ReactNode } from "react";
import "./Background.css";

interface GgProps {
  children: ReactNode;
}

const Background = ({ children }: GgProps) => {
  return <div className="bg-col">{children}</div>;
};

export default Background;
