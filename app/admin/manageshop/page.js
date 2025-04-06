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

export default function UpcomingMeetings() {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [newItemName, setNewItemName] = React.useState("");
  const [newItemPrice, setNewItemPrice] = React.useState();

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: fetchedData, error } = await supabase.from("Shop").select();

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
    if (!newItemName || !newItemPrice) {
      toast.error("Please fill in the values");
      return;
    }

    const newItem = {
      Name: newItemName,
      Price: newItemPrice,
    };

    const { error } = await supabase.from("Shop").insert([newItem]);

    if (error) {
      console.error("Error adding meeting:", error);
      toast.error("Failed to add meeting");
    } else {
      toast.success("Meeting added succesfully");
      handleSubmit();
      setNewItemName("");
      setNewItemPrice(undefined);
      fetchData();
    }
  };

  const handleDeleteItem = async (item) => {
    const { error } = await supabase
      .from("Shop")
      .delete()
      .match({ Name: item.Name });

    if (error) {
      console.error("Error deleting meeting:", error);
      toast.error("Failed to delete meeting");
    } else {
      toast.success("Item deleted succesfully");
      fetchData();
    }
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
            <h1 className="text-xl font-bold mb-4">Student Shop</h1>
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
                      <TableHead>Price (Pelicoin)</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row) => (
                      <TableRow key={row.id || Math.random() * 10}>
                        <TableCell>{row.Name}</TableCell>
                        <TableCell>{row.Price}</TableCell>

                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteItem(row)}
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
                  No items found.
                </p>
              )}
            </ScrollArea>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input
                placeholder="Item Name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
              <Input
                placeholder="Item Price (pelicoin)"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
              />
            </div>
            <Button onClick={handleAddMeeting} className="mt-4">
              Add Item
            </Button>
          </CardContent>
        </Card>
      </SidebarProvider>
    </div>
  );
}
