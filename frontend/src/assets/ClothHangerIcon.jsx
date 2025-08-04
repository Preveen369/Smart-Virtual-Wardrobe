import React from "react";

// Cloth hanger icon inside a slightly larger blue circle
const ClothHangerIcon = ({ style = {}, size = 38, color = "#0ea5e9" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    {/* Larger blue circle background */}
    <circle cx="18" cy="18" r="18" fill={color} />
    {/* White hanger, scaled and centered for new viewBox */}
    <path
      d="M18 8c1.657 0 3 1.343 3 3 0 1.306-.835 2.417-2 2.83V16l11.5 8.5a2 2 0 01-2.5 3.2l-10-7.43-10 7.43a2 2 0 01-2.5-3.2L15 16v-2.17A3.001 3.001 0 0118 8z"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export default ClothHangerIcon;
