import { pgTable, text, serial, integer, boolean, timestamp, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (already present in the original file)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Locations (areas being monitored)
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  zone: text("zone").notNull(),
  lat: real("lat").notNull(),
  lon: real("lon").notNull(),
  population: integer("population"),
  color: text("color").default("#0039a6"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true
});

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

// Foot traffic records
export const footTraffic = pgTable("foot_traffic", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull(),
  count: integer("count").notNull(),
  dwellTimeInSeconds: integer("dwell_time_seconds").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  dayOfWeek: integer("day_of_week").notNull(),
  hour: integer("hour").notNull(),
});

export const insertFootTrafficSchema = createInsertSchema(footTraffic).omit({
  id: true
});

export type InsertFootTraffic = z.infer<typeof insertFootTrafficSchema>;
export type FootTraffic = typeof footTraffic.$inferSelect;

// Peak hour records
export const peakHours = pgTable("peak_hours", {
  id: serial("id").primaryKey(),
  date: timestamp("date").defaultNow(),
  startTime: text("start_time").notNull(),
  maxTime: text("max_time").notNull(),
  endTime: text("end_time").notNull(),
  startStatus: text("start_status").notNull(),
  maxStatus: text("max_status").notNull(),
});

export const insertPeakHoursSchema = createInsertSchema(peakHours).omit({
  id: true
});

export type InsertPeakHours = z.infer<typeof insertPeakHoursSchema>;
export type PeakHours = typeof peakHours.$inferSelect;

// Calendar events/tasks
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  start: timestamp("start").notNull(),
  end: timestamp("end"),
  color: text("color").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true
});

export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;

// Report interpretations
export const reportInterpretations = pgTable("report_interpretations", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull(), 
  interpretation: text("interpretation").notNull(),
  date: timestamp("date").defaultNow(),
});

export const insertReportInterpretationSchema = createInsertSchema(reportInterpretations).omit({
  id: true,
  date: true
});

export type InsertReportInterpretation = z.infer<typeof insertReportInterpretationSchema>;
export type ReportInterpretation = typeof reportInterpretations.$inferSelect;

// Profile information
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fullName: text("full_name").notNull(),
  title: text("title").notNull(),
  phone: text("phone"),
  address: text("address"),
  email: text("email").notNull(),
  biography: text("biography"),
  photoUrl: text("photo_url"),
  supervisorId: integer("supervisor_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;
