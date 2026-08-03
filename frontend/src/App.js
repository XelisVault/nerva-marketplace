import React, {useEffect, useState, useContext} from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  //Link
} from "react-router-dom";
import Login from "./Login.js";
import Registration from "./Registration.js";
import UserActivationPage from "./UserActivaton.js";
import ListingCreateForm from "./ListingCreateForm.js";
import ListingsDisplay from "./ListingsDisplay.js";
import Cart from './Cart.js'
import Invoice from "./Invoice.js";
import Listing from "./Listing.js"
import VendorOrders from "./VendorOrders.js"
import UserContext from './UserContext.js';

const Home = () => {
  return <ListingsDisplay/>
}

function App() {
  const [userDetails, setUser] = useState(null);

  useEffect(() => {
    const getWhoami = async () => {
      try {
        const response = await fetch(process.env.REACT_APP_MARKET_MICROSERVICES + '/users/whoami', {
          method: 'GET',
          credentials: 'include'
        });

        if (response.status === 200) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    if (userDetails === null) getWhoami();
  }, [userDetails]);

  return (
    <UserContext.Provider value={userDetails}>
      <Router>
          <Routes>
            <Route path="/register" element={<Registration />} />
            <Route path="activate/:token" element={<UserActivationPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create_listing" element={<ListingCreateForm/>} />
            <Route path="/listings" element={<ListingsDisplay/>} />
            <Route path="/listing/:listing_id" element={<Listing/>} />
            <Route path="/cart" element={<Cart/>} />
            <Route path="/invoice/:invoice_id" element={<Invoice/>} />
            <Route path="/vendor/orders" element={<VendorOrders/>} />
            <Route path="/" element={<Home />} />
          </Routes>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
