import { createContext, useState, useEffect } from 'react';

const UserContext = createContext({ 
  userDetails: undefined, 
  authChecked: false,
  refetchUser: () => {} 
});

export const UserProvider = ({ children }) => {
  const [userDetails, setUser] = useState(undefined);
  const [authChecked, setAuthChecked] = useState(false);

  const refetchUser = async () => {
    try {
      const response = await fetch(process.env.REACT_APP_MARKET_MICROSERVICES + '/users/whoami', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.status === 200) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    if (!authChecked) {
      refetchUser();
      setAuthChecked(true);
    }
  }, [authChecked]);

  return (
    <UserContext.Provider value={{ userDetails, authChecked, refetchUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
