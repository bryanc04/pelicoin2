"use client";

import React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Trash2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import emailjs from "@emailjs/browser";
export default function UpcomingMeetings() {
  const [data, setData] = React.useState([]);
  const [newEventName, setNewEventName] = React.useState("");
  const [newEventDate, setNewEventDate] = React.useState();
  const [newEventTime, setNewEventTime] = React.useState("");
  const emailRef = useRef < HTMLInputElement > "";
  const nameRef = useRef < HTMLInputElement > "";

  const { toast } = useToast();
  useEffect(() => emailjs.init("D6aKMxno3vr0IgN3e"), []);
  // Add these
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
    } finally {
    }
  };

  // Generate time options for every 30 minutes
  const timeOptions = React.useMemo(() => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const hourFormatted = hour.toString().padStart(2, "0");
        const minuteFormatted = minute.toString().padStart(2, "0");
        const time = `${hourFormatted}:${minuteFormatted}`;
        times.push(time);
      }
    }
    return times;
  }, []);

  // Format time from 24h to 12h format for display
  const formatTimeForDisplay = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const fetchData = async () => {
    const { data: fetchedData, error } = await supabase
      .from("Meetings")
      .select()
      .order("Date", { ascending: true });

    if (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } else {
      setData(fetchedData || []);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleAddMeeting = async () => {
    if (!newEventName || !newEventDate || !newEventTime) {
      toast({
        title: "Error",
        description: "Please fill in the topic, date, and time",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time
    const combinedDateTime = new Date(newEventDate);
    const [hours, minutes] = newEventTime.split(":");
    combinedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const newMeeting = {
      Topic: newEventName,
      Date: combinedDateTime.toISOString(),
      Attendees: [],
      id: Math.floor(Math.random() * 1000000000000000),
    };
    console.log(newMeeting);

    const { error } = await supabase.from("Meetings").insert([newMeeting]);

    if (error) {
      console.error("Error adding meeting:", error);
      toast({
        title: "Error",
        description: "Failed to add meeting",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Meeting added successfully",
      });
      handleSubmit();
      setNewEventName("");
      setNewEventDate(undefined);
      setNewEventTime("");
      fetchData();
    }
  };

  const handleDeleteMeeting = async (topic, date) => {
    const { error } = await supabase
      .from("Meetings")
      .delete()
      .match({ Topic: topic, Date: date });

    if (error) {
      console.error("Error deleting meeting:", error);
      toast({
        title: "Error",
        description: "Failed to delete meeting",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Meeting deleted successfully",
      });
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
    });
  };

  return (
    <div className="">
      <SidebarProvider>
        <AppSidebar />
        <SidebarTrigger />
        <Card
          style={{
            width: "80vw",
            height: "90vh",
            padding: "30px",
            marginTop: "30px",
          }}
        >
          <CardContent>
            <h1 className="text-xl font-bold mb-4">Upcoming Meetings</h1>
            <ScrollArea className="h-64">
              {data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Attendees</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row) => (
                      <TableRow key={Math.random() * 10}>
                        <TableCell>{row.Topic}</TableCell>
                        <TableCell>{formatDate(row.Date)}</TableCell>
                        <TableCell>
                          {(row.Attendees || []).join(", ")}
                        </TableCell>
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
                <p className="text-muted-foreground">No meetings found.</p>
              )}
            </ScrollArea>
            <div className="grid grid-cols-3 gap-4 mt-4">
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newEventTime && "text-muted-foreground"
                    )}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {newEventTime ? (
                      formatTimeForDisplay(newEventTime)
                    ) : (
                      <span>Select time</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0">
                  <ScrollArea className="h-72">
                    <div className="grid grid-cols-1 gap-1 p-2">
                      {timeOptions.map((time) => (
                        <Button
                          key={Math.random() * 10}
                          variant={newEventTime === time ? "default" : "ghost"}
                          className="justify-start text-left"
                          onClick={() => setNewEventTime(time)}
                        >
                          {formatTimeForDisplay(time)}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
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
