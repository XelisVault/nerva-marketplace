import React, {useEffect, useState} from "react";
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
  const [userDetails, setUser] = useState(undefined);
  const [authChecked, setAuthChecked] = useState(false);

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
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error:', error);
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    };

    if (!authChecked) getWhoami();
  }, [authChecked]);

  return (
    <UserContext.Provider value={{ userDetails, authChecked }}>
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
