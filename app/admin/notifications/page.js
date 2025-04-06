"use client";

import React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Trash2, Loader2 } from "lucide-react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function UpcomingMeetings() {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

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

  // Format time from 24h to 12h format for display
  const formatTimeForDisplay = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: fetchedData, error } = await supabase
        .from("Notifications")
        .select()
        .order("Time", { ascending: false });

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

  const handleDeleteMeeting = async (id) => {
    const { error } = await supabase
      .from("Notifications")
      .delete()
      .match({ id: id });

    if (error) {
      console.error("Error deleting notif:", error);
      toast.error("Failed to delete notif");
    } else {
      toast.success("Notification deleted succesfully");
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
            <h1 className="text-xl font-bold mb-4">Notifications</h1>
            <ScrollArea>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">
                    Loading notifications...
                  </span>
                </div>
              ) : data.length > 0 ? (
                <Accordion type="triple" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Student Purchases</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableBody>
                          {data.map((row) =>
                            row.Category == "Purchases" ? (
                              <TableRow key={row.id || Math.random() * 10}>
                                <TableCell>{row.Content}</TableCell>
                                <TableCell>{formatDate(row.Time)}</TableCell>

                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteMeeting(row.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ) : (
                              <></>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>{" "}
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Student Sign Ups</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableBody>
                          {data.map((row) =>
                            row.Category == "Sign Ups" ? (
                              <TableRow key={row.id || Math.random() * 10}>
                                <TableCell>{row.Content}</TableCell>
                                <TableCell>{formatDate(row.Time)}</TableCell>

                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteMeeting(row.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ) : (
                              <></>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>Un-registers</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableBody>
                          {data.map((row) =>
                            row.Category == "Un-registers" ? (
                              <TableRow key={row.id || Math.random() * 10}>
                                <TableCell>{row.Content}</TableCell>
                                <TableCell>{formatDate(row.Time)}</TableCell>

                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteMeeting(row.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ) : (
                              <></>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No Notifications found.
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </SidebarProvider>
    </div>
  );
}
