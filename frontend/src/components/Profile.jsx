// import React from 'react';
// import { useAuth0 } from '@auth0/auth0-react';
// import { useAuth } from '../contexts/AuthContext';

// const Profile = () => {
//   const { user } = useAuth0();
//   const { userData, userPrivilege } = useAuth();
  
//   return (
//     <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
//       {/* Greeting Banner */}
//       <div className="bg-emerald-600 text-white p-6 rounded-lg mb-6 flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold">Welcome to Marichi Ventures!</h1>
//           <p className="text-xl mt-1">{userData?.name || user?.name}</p>
//         </div>
//         {user?.picture && (
//           <div className="ml-4">
//             <img 
//               src={user.picture} 
//               alt="Profile" 
//               className="h-16 w-16 rounded-full border-2 border-white"
//             />
//           </div>
//         )}
//       </div>
      
//       {/* User Information */}
//       <div className="bg-gray-50 p-6 rounded-lg">
//         <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200">Profile Information</h2>
        
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <div className="mb-4">
//               <label className="block text-gray-700 text-sm font-bold mb-1">Name</label>
//               <p className="bg-gray-100 p-3 rounded">{userData?.name || user?.name || 'Not available'}</p>
//             </div>
            
//             <div className="mb-4">
//               <label className="block text-gray-700 text-sm font-bold mb-1">Email</label>
//               <p className="bg-gray-100 p-3 rounded">{userData?.email || user?.email || 'Not available'}</p>
//             </div>
            
//             <div className="mb-4">
//               <label className="block text-gray-700 text-sm font-bold mb-1">Role / Privilege</label>
//               <p className="bg-gray-100 p-3 rounded flex items-center">
//                 <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
//                   userPrivilege === 'Admin' ? 'bg-red-500' : 
//                   userPrivilege === 'Manager' ? 'bg-yellow-500' : 
//                   userPrivilege === 'Employee' ? 'bg-green-500' : 'bg-gray-500'
//                 }`}></span>
//                 {userPrivilege || 'Not assigned'}
//               </p>
//             </div>
//           </div>
          
//           <div>
//             {userData && (
//               <>
//                 <div className="mb-4">
//                   <label className="block text-gray-700 text-sm font-bold mb-1">User ID</label>
//                   <p className="bg-gray-100 p-3 rounded">{userData.id || 'Not available'}</p>
//                 </div>
                
//                 <div className="mb-4">
//                   <label className="block text-gray-700 text-sm font-bold mb-1">Last Login</label>
//                   <p className="bg-gray-100 p-3 rounded">
//                     {userData.last_login ? new Date(userData.last_login).toLocaleString() : 'No record'}
//                   </p>
//                 </div>
//               </>
//             )}
            
//             <div className="mb-4">
//               <label className="block text-gray-700 text-sm font-bold mb-1">Auth Provider</label>
//               <p className="bg-gray-100 p-3 rounded">Auth0</p>
//             </div>
//           </div>
//         </div>
//       </div>
      
//       {/* Additional Information - Only shown for certain privilege levels */}
//       {(userPrivilege === 'Admin' || userPrivilege === 'Manager') && (
//         <div className="mt-6 bg-blue-50 p-6 rounded-lg">
//           <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-blue-200">Access Information</h2>
//           <p className="text-gray-700">
//             As a {userPrivilege}, you have access to:
//             <ul className="list-disc pl-5 mt-2">
//               {userPrivilege === 'Admin' && (
//                 <>
//                   <li>All system features</li>
//                   <li>User management</li>
//                   <li>Subscriber management</li>
//                   <li>Content management</li>
//                 </>
//               )}
//               {userPrivilege === 'Manager' && (
//                 <>
//                   <li>Content management</li>
//                   <li>Subscriber management</li>
//                   <li>Analytics and reporting</li>
//                 </>
//               )}
//             </ul>
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Profile;



import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth0();
  const { userData, userPrivilege } = useAuth();
  
  // Define access rights for each role
  const roleAccess = {
    Admin: {
      description: "Full administrative access to all system features",
      access: [
        "User Management", 
        "Subscriber Management", 
        "Blogs", 
        "Certificates", 
        "Events", 
        "News", 
        "Text Testimonials", 
        "Video Testimonials", 
        "Webinars"
      ]
    },
    Manager: {
      description: "Management access to all features except user management",
      access: [
        "Subscriber Management", 
        "Blogs", 
        "Certificates", 
        "Events", 
        "News", 
        "Text Testimonials", 
        "Video Testimonials", 
        "Webinars"
      ],
      restricted: ["User Management"]
    },
    Employee: {
      description: "Standard access to content features",
      access: [
        "Blogs", 
        "Certificates", 
        "Events", 
        "News", 
        "Text Testimonials", 
        "Video Testimonials", 
        "Webinars"
      ],
      restricted: ["User Management", "Subscriber Management"]
    }
  };
  
  // Get role-specific information
  const currentRoleInfo = roleAccess[userPrivilege] || { 
    description: "Limited or no access to system features",
    access: [],
    restricted: ["All administrative features"]
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      {/* Greeting Banner */}
      <div className="bg-emerald-600 text-white p-6 rounded-lg mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome to Marichi Ventures!</h1>
          <p className="text-xl mt-1">{userData?.name || user?.name}</p>
        </div>
        {user?.picture && (
          <div className="ml-4">
            <img 
              src={user.picture} 
              alt="Profile" 
              className="h-16 w-16 rounded-full border-2 border-white"
            />
          </div>
        )}
      </div>
      
      {/* User Information */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200">Profile Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-1">Name</label>
              <p className="bg-gray-100 p-3 rounded">{userData?.name || user?.name || 'Not available'}</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-1">Email</label>
              <p className="bg-gray-100 p-3 rounded">{userData?.email || user?.email || 'Not available'}</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-1">Role / Privilege</label>
              <p className="bg-gray-100 p-3 rounded flex items-center">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                  userPrivilege === 'Admin' ? 'bg-red-500' : 
                  userPrivilege === 'Manager' ? 'bg-yellow-500' : 
                  userPrivilege === 'Employee' ? 'bg-green-500' : 'bg-gray-500'
                }`}></span>
                {userPrivilege || 'Not assigned'}
              </p>
            </div>
          </div>
          
          <div>
            {userData && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-1">User ID</label>
                  <p className="bg-gray-100 p-3 rounded">{userData.id || 'Not available'}</p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-1">Last Login</label>
                  <p className="bg-gray-100 p-3 rounded">
                    {userData.last_login ? new Date(userData.last_login).toLocaleString() : 'No record'}
                  </p>
                </div>
              </>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-1">Auth Provider</label>
              <p className="bg-gray-100 p-3 rounded">Auth0</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Role Access Information */}
      <div className="mt-6 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-blue-200">Your Access Rights</h2>
        
        <div className="mb-4">
          <label className="block text-blue-700 text-sm font-bold mb-1">Role Description</label>
          <p className="p-2">{currentRoleInfo.description}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-green-700 text-sm font-bold mb-2">You Have Access To:</label>
            <ul className="bg-white p-3 rounded border border-green-200 list-disc pl-5">
              {currentRoleInfo.access.map((item, index) => (
                <li key={index} className="mb-1">{item}</li>
              ))}
            </ul>
          </div>
          
          <div>
            {currentRoleInfo.restricted && currentRoleInfo.restricted.length > 0 && (
              <>
                <label className="block text-red-700 text-sm font-bold mb-2">Restricted Areas:</label>
                <ul className="bg-white p-3 rounded border border-red-200 list-disc pl-5">
                  {currentRoleInfo.restricted.map((item, index) => (
                    <li key={index} className="mb-1">{item}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Role Access Matrix */}
      <div className="mt-6 bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200">Role Access Matrix</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b border-r text-left">Feature</th>
                <th className="py-2 px-4 border-b border-r text-center">Admin</th>
                <th className="py-2 px-4 border-b border-r text-center">Manager</th>
                <th className="py-2 px-4 border-b text-center">Employee</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-4 border-b border-r">User Management</td>
                <td className="py-2 px-4 border-b border-r text-center">✅</td>
                <td className="py-2 px-4 border-b border-r text-center">❌</td>
                <td className="py-2 px-4 border-b text-center">❌</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b border-r">Subscriber Management</td>
                <td className="py-2 px-4 border-b border-r text-center">✅</td>
                <td className="py-2 px-4 border-b border-r text-center">✅</td>
                <td className="py-2 px-4 border-b text-center">❌</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b border-r">Blogs</td>
                <td className="py-2 px-4 border-b border-r text-center">✅</td>
                <td className="py-2 px-4 border-b border-r text-center">✅</td>
                <td className="py-2 px-4 border-b text-center">✅</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b border-r">Certificates</td>
                <td className="py-2 px-4 border-b border-r text-center">✅</td>
                <td className="py-2 px-4 border-b border-r text-center">✅</td>
                <td className="py-2 px-4 border-b text-center">✅</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b border-r">Events</td>
                <td className="py-2 px-4 border-b border-r text-center">✅</td>
                <td className="py-2 px-4 border-b border-r text-center">✅</td>
                <td className="py-2 px-4 border-b text-center">✅</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b border-r">News</td>
                <td className="py-2 px-4 border-b border-r text-center">✅</td>
                <td className="py-2 px-4 border-b border-r text-center">✅</td>
                <td className="py-2 px-4 border-b text-center">✅</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b border-r">Text Testimonials</td>
                <td className="py-2 px-4 border-b border-r text-center">✅</td>
                <td className="py-2 px-4 border-b border-r text-center">✅</td>
                <td className="py-2 px-4 border-b text-center">✅</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b border-r">Video Testimonials</td>
                <td className="py-2 px-4 border-b border-r text-center">✅</td>
                <td className="py-2 px-4 border-b border-r text-center">✅</td>
                <td className="py-2 px-4 border-b text-center">✅</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-r">Webinars</td>
                <td className="py-2 px-4 border-r text-center">✅</td>
                <td className="py-2 px-4 border-r text-center">✅</td>
                <td className="py-2 px-4 text-center">✅</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Profile;