"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Users, DollarSign, Layout } from 'lucide-react'
import { Outlet, useNavigate } from "react-router-dom"

const HallManagement = () => {
  const [screens, setScreens] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    // Load screens from localStorage
    const savedScreens = localStorage.getItem("cinema-screens")
    if (savedScreens) {
      setScreens(JSON.parse(savedScreens))
    }
  }, [])

  const deleteScreen = (screenId) => {
    const updatedScreens = screens.filter((screen) => screen.id !== screenId)
    setScreens(updatedScreens)
    localStorage.setItem("cinema-screens", JSON.stringify(updatedScreens))
  }

  const getTotalRevenue = (screen) => {
    return (
      screen.premiumSeats * screen.premiumPrice +
      screen.goldSeats * screen.goldPrice +
      screen.silverSeats * screen.silverPrice
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cinema Hall Management</h1>
          <p className="text-muted-foreground">Manage your cinema screens and seating layouts</p>
        </div>
        <Button onClick={() => navigate("/add-screen")} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Screen
        </Button>
      </div>

      {screens.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Layout className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Screens Created</h3>
            <p className="text-muted-foreground mb-4">Create your first cinema screen to get started</p>
            <Button onClick={() => navigate("/add-screen")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Screen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screens.map((screen) => (
            <Card key={screen.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{screen.name}</CardTitle>
                    <CardDescription>Created on {new Date(screen.createdAt).toLocaleDateString()}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/edit-screen/${screen.id}`)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteScreen(screen.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Seats: {screen.totalSeats}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Premium
                    </Badge>
                    <p className="mt-1">{screen.premiumSeats} seats</p>
                    <p className="text-xs text-muted-foreground">${screen.premiumPrice}</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Gold
                    </Badge>
                    <p className="mt-1">{screen.goldSeats} seats</p>
                    <p className="text-xs text-muted-foreground">${screen.goldPrice}</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                      Silver
                    </Badge>
                    <p className="mt-1">{screen.silverSeats} seats</p>
                    <p className="text-xs text-muted-foreground">${screen.silverPrice}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Max Revenue:</span>
                  </div>
                  <span className="font-bold text-green-600">${getTotalRevenue(screen).toLocaleString()}</span>
                </div>

                <Button
                  className="w-full bg-transparent"
                  variant="outline"
                  onClick={() => navigate(`/edit-screen/${screen.id}`)}
                >
                  View Layout
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Outlet />
    </div>
  )
}

export default HallManagement
