import React from "react";
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
import { UserProvider } from './UserContext.js';

const Home = () => {
  return <ListingsDisplay/>
}

function App() {
  return (
    <UserProvider>
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
    </UserProvider>
  );
}

export default App;
