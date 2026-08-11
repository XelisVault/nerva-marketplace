import { createContext } from 'react';

const UserContext = createContext({ userDetails: undefined, authChecked: false });

export default UserContext;
