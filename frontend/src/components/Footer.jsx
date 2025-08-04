import { Typography } from "antd";

const { Text } = Typography;

const Footer = ({ isDarkMode }) => {
  // Slightly lighter/darker shade for subtle separation
  const background = isDarkMode ? "#18181b" : "#f3f4f6";
  const textColor = isDarkMode ? "#e4e4e7" : "#111827";
  const linkColor = "#0ea5e9";
  const borderColor = isDarkMode ? "#23272f" : "#e5e7eb";

  return (
    <footer
      style={{
        backgroundColor: background,
        padding: "1.5rem 1rem",
        textAlign: "center",
        marginTop: "4rem",
        borderTop: `1.5px solid ${borderColor}`,
      }}
    >
      <Text style={{ color: textColor, fontSize: 14 }}>
        Developed by{" "}
        <a
          href="https://github.com/Preveen369"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: linkColor,
            textDecoration: "underline",
            fontWeight: 500,
            transition: "color 0.2s",
          }}
        >
          Preveen S
        </a>{" and "}
        <a
          href="https://github.com/Preveen369"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: linkColor,
            textDecoration: "underline",
            fontWeight: 500,
            transition: "color 0.2s",
          }}
        >
          Johnson J
        </a>
        • All rights reserved © {new Date().getFullYear()}
      </Text>
    </footer>
  );
};

export default Footer;
