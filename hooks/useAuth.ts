import { useState, useEffect } from "react";

const getAuthToken = () => {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("authToken="))
    ?.split("=")[1] || null;
};

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log("📢 useAuth chamado!"); // Verifica se está a ser chamado


    setTimeout(() => {
      const token = getAuthToken();
      setIsAuthenticated(!!token);
    }, 100); 
  }, []);

  return isAuthenticated;
};
