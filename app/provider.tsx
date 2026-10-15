"use client"
import React, { useEffect, useState } from "react"
import axios from 'axios'
import { UserDetailContext } from "@/context/UserDetailContext";
import { useUser } from "@clerk/nextjs";

function Provider({ children }: { children: React.ReactNode }) {
    const [userDetail, setUserDetail] = useState<any>();
    const { user, isLoaded } = useUser();

    useEffect(() => {
        if (isLoaded && user) {
            createNewUser();
        }
    }, [isLoaded, user])

    const createNewUser = async () => {
        const result = await axios.post('/api/users');
        setUserDetail(result.data)
        console.log(result.data)
    }

    return (
        <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
            <div>{children}</div>
        </UserDetailContext.Provider>
    )
}

export default Provider