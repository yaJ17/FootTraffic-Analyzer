import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertCalendarEventSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard data endpoint
  app.get("/api/dashboard", async (req, res) => {
    try {
      const dashboardData = await storage.getFootTrafficSummary();
      res.json(dashboardData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Statistics data endpoint
  app.get("/api/statistics", async (req, res) => {
    try {
      const locations = await storage.getLocations();
      
      // Create sample statistics data
      const statisticsData = {
        heatmap: {
          z: [
            [0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.9],
            [0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.9],
            [0.4, 0.4, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.9, 0.9, 0.9],
            [0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9, 0.9, 0.9],
            [0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.9],
            [0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.9]
          ],
          x: ['12am', '2am', '4am', '6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'],
          y: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        },
        busiestPlaces: {
          places: locations.slice(0, 5).map((location, index) => ({
            id: location.id,
            name: location.name
          }))
        },
        avgFootTraffic: {
          gates: [
            {
              name: 'Main Gate',
              color: '#0039a6',
              values: [40, 30, 35, 40, 35, 40, 35, 30]
            },
            {
              name: 'East Gate',
              color: '#60a5fa',
              values: [12, 20, 15, 12, 14, 16, 18, 20]
            }
          ],
          timeLabels: ['7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM']
        },
        monthFootTraffic: {
          buildings: [
            { id: 'b1', name: 'Building 1', value: 152 },
            { id: 'b2', name: 'Building 2', value: 76 },
            { id: 'b3', name: 'Building 3', value: 15 },
            { id: 'b4', name: 'Building 4', value: 197 },
            { id: 'b5', name: 'Building 5', value: 89 },
            { id: 'b6', name: 'Building 6', value: 93 },
            { id: 'b7', name: 'Building 7', value: 130 },
            { id: 'b8', name: 'Building 8', value: 91 },
            { id: 'b9', name: 'Building 9', value: 68 },
            { id: 'b10', name: 'Building 10', value: 162 },
            { id: 'shop', name: 'Shopping', value: 176 }
          ]
        }
      };
      
      res.json(statisticsData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics data" });
    }
  });

  // Reports data endpoint
  app.get("/api/reports", async (req, res) => {
    try {
      const barangays = await storage.getBarangayReports();
      const interpretations = await storage.getReportInterpretations();
      
      // Find interpretations for specific locations
      const manilaCathedral = interpretations.find(i => i.locationId === 1);
      const divisoriaMarket = interpretations.find(i => i.locationId === 2);
      const fortSantiago = interpretations.find(i => i.locationId === 3);
      
      const reportsData = {
        barangays,
        forecastInterpretation: {
          manilaCathedral: manilaCathedral?.interpretation || "No interpretation available",
          divisoriaMarket: divisoriaMarket?.interpretation || "No interpretation available",
          fortSantiago: fortSantiago?.interpretation || "No interpretation available"
        }
      };
      
      res.json(reportsData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports data" });
    }
  });

  // Calendar data endpoint
  app.get("/api/calendar", async (req, res) => {
    try {
      const events = await storage.getCalendarEvents();
      
      // Convert to the format expected by the frontend
      const tasks = events.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start.toISOString(),
        end: event.end?.toISOString(),
        color: event.color,
        type: event.type
      }));
      
      res.json({ tasks });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch calendar data" });
    }
  });

  // Add calendar event endpoint
  app.post("/api/calendar", async (req, res) => {
    try {
      const eventData = insertCalendarEventSchema.parse(req.body);
      const newEvent = await storage.addCalendarEvent(eventData);
      
      res.json(newEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid event data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add calendar event" });
      }
    }
  });

  // Profile data endpoint
  app.get("/api/profile", async (req, res) => {
    try {
      // For demo purposes, return a default profile
      // In a real app, this would use the authenticated user's ID
      const userId = 1;
      const profile = await storage.getProfile(userId);
      
      if (profile) {
        // Get supervisor data if present
        let supervisorData = null;
        if (profile.supervisorId) {
          const supervisor = await storage.getProfile(profile.supervisorId);
          if (supervisor) {
            supervisorData = {
              name: supervisor.fullName,
              phone: supervisor.phone,
              photoUrl: supervisor.photoUrl
            };
          }
        }
        
        res.json({
          fullName: profile.fullName,
          title: profile.title,
          phone: profile.phone,
          address: profile.address,
          email: profile.email,
          biography: profile.biography,
          photoUrl: profile.photoUrl,
          supervisor: supervisorData
        });
      } else {
        res.status(404).json({ message: "Profile not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile data" });
    }
  });

  // Update profile endpoint
  app.patch("/api/profile", async (req, res) => {
    try {
      // For demo purposes, use a default user ID
      // In a real app, this would use the authenticated user's ID
      const userId = 1;
      const updatedProfile = await storage.updateProfile(userId, req.body);
      res.json(updatedProfile);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Get locations endpoint
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
