"use client"

import { useState } from "react"
import LoginForm from "@/components/LoginForm"
import { useNavigate } from "react-router-dom"
import axios from "axios"

const baseApi = import.meta.env.VITE_BASE_API;

const Index = () => {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogin = async (data: any) => {
    setIsLoggedIn(true)
    if (data.user_type === "jurymember") {
      const accessToken = localStorage.getItem("access_token")
      const response = await axios.get(
        `${baseApi}/api/jury/details/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      localStorage.setItem("jury_details", JSON.stringify(response.data))
      navigate("/juri-dashboard")
    } else {
      navigate("/member-dashboard")
    }
  }

  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />
  }

  return null
}

export default Index
