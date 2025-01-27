"use client";

import React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
import supabase from "../../supabaseClient";

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
export default function UpcomingMeetings() {
  const [data, setData] = React.useState([]);
  const [newEventName, setNewEventName] = React.useState("");
  const [newEventDate, setNewEventDate] = React.useState();
  const { toast } = useToast();

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
    if (!newEventName || !newEventDate) {
      toast({
        title: "Error",
        description: "Please fill in both the topic and date",
        variant: "destructive",
      });
      return;
    }

    const newMeeting = {
      Topic: newEventName,
      Date: newEventDate.toISOString(),
      Attendees: [],
      id: data.length + 1,
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
      setNewEventName("");
      setNewEventDate(undefined);
      fetchData();
    }
  };

  const handleDeleteMeeting = async (topic) => {
    const { error } = await supabase
      .from("Meetings")
      .delete()
      .match({ Topic: topic });

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
                      <TableRow key={row.Topic}>
                        <TableCell>{row.Topic}</TableCell>
                        <TableCell>{formatDate(row.Date)}</TableCell>
                        <TableCell>
                          {(row.Attendees || []).join(", ")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMeeting(row.Topic)}
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
            <div className="grid grid-cols-2 gap-4 mt-4">
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
