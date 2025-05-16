import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { user, isAuthenticated, isLoading, logout } = useAuth0();
  const [userData, setUserData] = useState(null);
  const [userPrivilege, setUserPrivilege] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated && user?.email) {
        try {
          const response = await fetch('https://backend.marichiventures.com/admin/pages/users.php?action=get');
          
          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }
          
          const users = await response.json();
          const matchedUser = users.find(u => u.email === user.email);
          
          if (matchedUser) {
            setUserData(matchedUser);
            setUserPrivilege(matchedUser.privilege);
          } else {
            // User email not found in system
            setUserPrivilege('Unauthorized');
          }
        } catch (err) {
          setError(err.message);
          console.error('Error fetching user data:', err);
        } finally {
          setLoading(false);
        }
      } else if (!isLoading) {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated, isLoading, user]);

  const handleLogout = () => {
    logout({ returnTo: window.location.origin });
    navigate('/login');
  };

  const hasAccess = (requiredPrivilege) => {
    if (userPrivilege === 'Admin') return true;
    if (userPrivilege === 'Manager' && requiredPrivilege !== 'Admin') return true;
    if (userPrivilege === 'Employee' && requiredPrivilege !== 'Admin' && requiredPrivilege !== 'Manager') return true;
    return false;
  };

  // const canAccessRoute = (path) => {
  //   // Define route access restrictions
  //   if (path === '/user-management' && userPrivilege !== 'Admin') return false;
  //   if (path === '/manage-subscribers' && (userPrivilege === 'Employee' || userPrivilege === 'Registered User' || userPrivilege === 'Unauthorized')) return false;
  //   if ((userPrivilege === 'Registered User' || userPrivilege === 'Unauthorized')) return false;
  //   return true;
  // };
  const canAccessRoute = (path) => {
    // Unauthorized or registered users can't access anything
    if (userPrivilege === 'Unauthorized' || userPrivilege === 'Registered User') {
      return false;
    }
    
    // Path-specific restrictions based on user privilege
    switch (userPrivilege) {
      case 'Admin':
        // Admin can access everything
        return true;
      case 'Manager':
        // Managers can access everything except user management
        return path !== '/user-management';
      case 'Employee':
        // Employees can access everything except user management and manage subscribers
        return path !== '/user-management' && path !== '/manage-subscribers';
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        userData, 
        userPrivilege, 
        loading, 
        error, 
        handleLogout, 
        hasAccess,
        canAccessRoute,
        isAuthenticated 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);