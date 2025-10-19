"use client";

import React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Trash2, Cog, Loader2 } from "lucide-react";
import supabase from "../../supabaseClient";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import emailjs from "@emailjs/browser";
import { toast, Toaster } from "react-hot-toast";

export default function UpcomingMeetings() {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [newEventName, setNewEventName] = React.useState("");
  const [newEventDate, setNewEventDate] = React.useState();
  const [newEventTime, setNewEventTime] = React.useState("");
  const [newMaxStudents, setNewMaxStudents] = React.useState("");

  useEffect(() => emailjs.init("D6aKMxno3vr0IgN3e"), []);

  const handleSubmit = async (e) => {
    const serviceId = "service_51uk45n";
    const templateId = "template_z6zefyv";
    try {
      await emailjs.send(serviceId, templateId, {
        name: "Bryan Chung",
        recipient: "bryan_chung@loomis.org",
      });
      toast.success("Email sent to bryan_chung@loomis.org");
    } catch (error) {
      console.log(error);
    }
  };

  // Validate time input format (HH:MM in 24-hour format)
  const validateTimeInput = (time) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(time);
  };

  // Format time from 24h to 12h format for display
  const formatTimeForDisplay = (time) => {
    if (!time || !validateTimeInput(time)) return time;

    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Format time input to ensure it's in HH:MM format
  const formatTimeInput = (input) => {
    // Remove non-numeric and non-colon characters
    let cleaned = input.replace(/[^\d:]/g, "");

    // Handle colon placement
    if (cleaned.length > 2 && !cleaned.includes(":")) {
      cleaned = cleaned.slice(0, 2) + ":" + cleaned.slice(2);
    }

    // Limit to 5 characters (HH:MM)
    cleaned = cleaned.slice(0, 5);

    return cleaned;
  };

  const extractMaxFromTopic = (topic = "") => {
    const m = topic.match(/\[max:(\d+)\]/i);
    return m ? Number(m[1]) : 15;
  };

  const extractTopicFromTopic = (topic = "") =>
  topic.replace(/\s*\[max:\d+\]\s*/i, "").trim();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: fetchedData, error } = await supabase
        .from("Meetings")
        .select()
        .order("Date", { ascending: true });
      if (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch data");
      } else {
        setData(fetchedData || []);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleAddMeeting = async () => {
    if (!newEventName || !newEventDate || !newEventTime || !newMaxStudents) {
      toast.error("Please fill in all values");
      return;
    }

    const max = Number(newMaxStudents);
    if (Number.isNaN(max) || !Number.isInteger(max) || max <= 0) {
      toast.error("Please enter a valid positive integer for max students");
      return;
    }

    if (!validateTimeInput(newEventTime)) {
      toast.error("Please enter a valid time in HH:MM format");
      return;
    }

    // Combine date and time
    const combinedDateTime = new Date(newEventDate);
    const [hours, minutes] = newEventTime.split(":");
    combinedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const topicWithMax = `${newEventName} [max:${max}]`;

    const newMeeting = {
      Topic: topicWithMax,
      Date: combinedDateTime.toISOString(),
      Attendees: [],
      id: Math.floor(Math.random() * 1000000000000000),
    };
    console.log(newMeeting);

    const { error } = await supabase.from("Meetings").insert([newMeeting]);

    if (error) {
      console.error("Error adding meeting:", error);
      toast.error("Failed to add meeting");
    } else {
      toast.success("Meeting added successfully");
      handleSubmit();
      setNewEventName("");
      setNewEventDate(undefined);
      setNewEventTime("");
      setNewMaxStudents("");
      fetchData();
    }
  };
  const addNotification = async (
      category,
      content,
      time,
      id,
      approved
    ) => {
      const notif = {
        Category: category,
        Content: content,
        Time: time,
        id: id,
        Approved: approved,
      };
  
      const { error } = await supabase.from("Notifications").insert([notif]);
    };

  const handleUnregister = async (meetingTopic, meetingdate, attendees, removedUserName) => {
      setLoading(true);
  
      // removedUserName = `${curUser["First Name"]} ${curUser["Last Name"]}`;

      if (!attendees.includes(removedUserName)) {
        alert("This member is not registered for this meeting!");
        setLoading(false);
        return;
      }
  
      // Filter out the current user from the attendees list
      const updatedAttendees = attendees.filter(
        (name) => name !== removedUserName
      );
  
      const { error } = await supabase
        .from("Meetings")
        .update({ Attendees: updatedAttendees })
        .eq("Topic", meetingTopic);
  
      if (!error) {
        fetchData();
        toast.success("Successfully unregistered " + removedUserName + " from " + meetingTopic);
        addNotification(
          "Un-registers",
          `Admin unregistered ${removedUserName} 
          from ${meetingTopic} on ${formatDate(meetingdate)}`,
          new Date(),
          Math.floor(Math.random() * 1000000000000000),
          true
        );
      } else {
        alert("Failed to unregister from meeting.");
      }
  
      setLoading(false);
    };

  const handleDeleteMeeting = async (topic, date) => {
    const { error } = await supabase
      .from("Meetings")
      .delete()
      .match({ Topic: topic, Date: date });

    if (error) {
      console.error("Error deleting meeting:", error);
      toast.error("Failed to delete meeting");
    } else {
      toast.success("Meeting deleted successfully");
      fetchData();
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      timeZone: "America/New_York",
    });
  };

  return (
    <div className="">
      <SidebarProvider>
        <Toaster />
        <AppSidebar />
        <SidebarTrigger />
        <Card
          style={{
            width: "80vw",
            height: "90vh",
            padding: "30px",
            marginTop: "30px",
            border: "none",
            boxShadow: "none",
          }}
        >
          <CardContent>
            <h1 className="text-xl font-bold mb-4">Upcoming Meetings</h1>
            <ScrollArea>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">
                    Loading meetings...
                  </span>
                </div>
              ) : data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Attendees</TableHead>
                      <TableHead>Max students</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row) => (
                      <TableRow key={row.id || Math.random() * 10}>
                        <TableCell>{extractTopicFromTopic(row.Topic)}</TableCell>
                        <TableCell>{formatDate(row.Date)}</TableCell>

                        <TableCell>
                         <div className="flex flex-wrap gap-2">
                            {(row.Attendees || []).map((name) => (
                              <div key={name} className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
                                <span className="text-sm">{name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleUnregister(row.Topic, row.Date, row.Attendees, name)
                                  }
                                  className="text-gray-500 hover:text-red-700 h-5 w-5 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            {(row.Attendees || []).length === 0 && (
                              <span className="text-gray-500 text-sm">No attendees</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{extractMaxFromTopic(row.Topic) ?? "—"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleDeleteMeeting(row.Topic, row.Date)
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No meetings found.
                </p>
              )}
            </ScrollArea>
            <div className="grid grid-cols-4 gap-4 mt-4">
              <Input
                placeholder="Meeting Topic"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newEventDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newEventDate ? (
                      format(newEventDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newEventDate}
                    onSelect={setNewEventDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  placeholder="Enter time (HH:MM)"
                  value={newEventTime}
                  onChange={(e) =>
                    setNewEventTime(formatTimeInput(e.target.value))
                  }
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Max students"
                  value={newMaxStudents}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^\d]/g, ""); // keep integers only
                    setNewMaxStudents(v);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleAddMeeting} className="mt-4">
              Add Meeting
            </Button>
          </CardContent>
        </Card>
      </SidebarProvider>
    </div>
  );
}
