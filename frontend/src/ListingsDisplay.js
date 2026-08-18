import React, { useState, useEffect, useMemo } from 'react';
import ItemCard from './ItemCard';
import NavBar from './Navbar';
import './listings.css';

const ListingsDisplay = () => {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await fetch(process.env.REACT_APP_MARKET_MICROSERVICES+'/market/listings');
                const data = await response.json();
                setItems(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching items:', error);
                setLoading(false);
            }
        };

        fetchItems();
    }, []);

    const filteredAndSorted = useMemo(() => {
        let result = items.filter(item => item.quantity_available > 0);

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter(item =>
                item.title.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q) ||
                (item.vendor && item.vendor.toLowerCase().includes(q))
            );
        }

        switch (sortBy) {
            case 'price-low':
                result.sort((a, b) => a.price_xnv - b.price_xnv);
                break;
            case 'price-high':
                result.sort((a, b) => b.price_xnv - a.price_xnv);
                break;
            case 'name':
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'newest':
            default:
                result.sort((a, b) => {
                    const aDate = a.create_time ? new Date(a.create_time).getTime() : 0;
                    const bDate = b.create_time ? new Date(b.create_time).getTime() : 0;
                    return bDate - aDate;
                });
                break;
        }

        return result;
    }, [items, search, sortBy]);

    return (
        <div>
            <NavBar />
            <div className="listings-toolbar">
                <div className="search-box">
                    <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        placeholder="Search listings..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name: A to Z</option>
                </select>
            </div>
            <div className="item-container">
                {loading ? (
                    <p className="empty-message">Loading listings...</p>
                ) : filteredAndSorted.length === 0 ? (
                    <p className="empty-message">
                        {search ? `No listings found for "${search}"` : 'No listings available yet.'}
                    </p>
                ) : (
                    filteredAndSorted.map(item => (
                        <ItemCard
                            key={item.listing_id}
                            listing_id={item.listing_id}
                            title={item.title}
                            imageName={item.image_name}
                            price_xnv={item.price_xnv}
                            qnty={item.quantity_available}
                            vendor={item.vendor}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default ListingsDisplay;
