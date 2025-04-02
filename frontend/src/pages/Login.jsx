// // src/pages/Login.jsx

// import React from 'react';
// import { useAuth0 } from '@auth0/auth0-react';
// import { Navigate } from 'react-router-dom';

// const Login = () => {
//   const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
//       </div>
//     );
//   }

//   if (isAuthenticated) {
//     return <Navigate to="/" replace />;
//   }

//   return (
//     <div className="flex items-center justify-center h-screen bg-gray-100">
//       <div className="bg-white p-8 rounded-lg shadow-md w-96">
//         <div className="text-center mb-6">
//           <h1 className="text-2xl font-bold text-emerald-700">Marichi Ventures</h1>
//           <p className="text-gray-600">Admin Panel Login</p>
//         </div>
        
//         <button
//           onClick={() => loginWithRedirect()}
//           className="w-full bg-emerald-500 text-white py-2 px-4 rounded-md hover:bg-emerald-600 transition duration-200"
//         >
//           Log In with Auth0
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Login;




import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';
import { Shield, AlertTriangle, LogIn } from 'lucide-react';

const Login = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-emerald-50 to-gray-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header with logo */}
        <div className="bg-white-600 py-6 px-6">
          <div className="flex justify-center">
            <img 
              src="https://marichiventures.com/assets/treelogo-CWLJwYN6.png" 
              alt="Marichi Ventures Logo" 
              className="h-24 object-contain"
            />
          </div>
        </div>
        
        {/* Login container */}
        <div className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Marichi Ventures</h1>
            <p className="text-gray-600 mt-1">Admin Control Panel</p>
          </div>
          
          <div className="mt-8">
            <button
              onClick={() => loginWithRedirect()}
              className="w-full bg-emerald-500 text-white py-3 px-4 rounded-md hover:bg-emerald-600 transition duration-200 flex items-center justify-center font-medium"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Log In with Auth0
            </button>
          </div>
          
          {/* Security badge */}
          <div className="mt-6 flex items-center justify-center text-gray-500 text-sm">
            <Shield className="h-4 w-4 mr-1" />
            <span>Secure authentication powered by Auth0</span>
          </div>
          
          {/* Notice about data management */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800">Important Notice</h3>
                <p className="text-sm text-amber-700 mt-1">
                  This admin panel provides access to manage all company data. Please handle with care as changes made here will directly affect public-facing content.
                </p>
              </div>
            </div>
          </div>
          
          {/* Footer with copyright */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Marichi Ventures. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;