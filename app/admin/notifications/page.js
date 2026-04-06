"use client";

import React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Check, X, Trash2, RotateCcw, Loader2, Undo } from "lucide-react";
import supabase from "../../supabaseClient";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { notification } from "antd";

export default function Home() {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showApproveAllDialog, setShowApproveAllDialog] = useState(false);
  const [showDeleteAllPurchasesDialog, setShowDeleteAllPurchasesDialog] = useState(false);
  const [showApproveAllPurchasesDialog, setShowApproveAllPurchasesDialog] = useState(false);

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

  const handleApproveAllClick = () => {
      setShowApproveAllDialog(true);
  };

  const handleApproveAllPurchasesClick = () => {
    setShowApproveAllPurchasesDialog(true);
  };

  const handleApproveAllPurchases = async () => {
    try {
        if (data.some(row => row.Category === "Purchases" && row.Approved !== "approved" && row.Approved !== "denied")) {
          const { data, error } = await supabase            
          .from("Notifications")
          .update({ Approved: "approved" })
          .eq("Category", "Purchases")
          .eq("Approved", !"approved" && !"denied")
          .select();

          if (error) throw error;
      
          if (!data.some(row => row.Category === "Purchases" && row.Approved !== "approved" && row.Approved !== "denied")) {
            toast.success("All Purchases Approved!");
          } else {
            toast.error("Failed to approve all pending purchases");
          }
          setShowApproveAllPurchasesDialog(false);
          fetchData();
        } else {
          toast.error("No pending purchases to approve");
          setShowApproveAllPurchasesDialog(false);
          fetchData();
          return;
        }
      
      
    } catch (error) {
      console.error("Error approving purchases:", error);
      toast.error("Failed to approve all purchases due to error");
      setShowApproveAllPurchasesDialog(false);
      fetchData();
    }
  };

  const handleApprovePurchase = async (notification) => {
    try {
      const { data, error } = await supabase
        .from("Notifications")
        .update({ Approved: "approved" })
        .eq("id", notification.id)
        .select();
    

      if (error) throw error;

      if (data[0].Approved === "approved") {
        toast.success("Purchase approved!");
        fetchData();
      } else {
        toast.error("Failed to approve purchase");
      }

    } catch (error) {
      console.error("Error approving purchase:", error);
      toast.error("Failed to approve purchase due to error");
    }
    
  };

  const handleDenyPurchase = async (notification) => {
    try {
      const { data, error } = await supabase
        .from("Notifications")
        .update({ Approved: "denied" })
        .eq("id", notification.id)
        .select();
  
      if (error) throw error;
  
      if (data[0].Approved === "denied") {
        toast.success("Request successfully denied!");
        fetchData();
      } else {
        toast.error("Failed to deny request");
      }

    } catch (error) {
      console.error("Error denying request:", error);
      toast.error("Failed to deny request due to error");
    }
  };

  const handleResetPurchase = async (notification) => {
    try {
      const { data, error } = await supabase
        .from("Notifications")
        .update({ Approved: "pending" })
        .eq("id", notification.id)
        .select();

      if (error) throw error;

      if (data[0].Approved === "pending") {
        toast.success("Purchase set to pending!");
        fetchData();
      } else {
        toast.error("Failed to set purchase to pending");
        fetchData();
      }

    } catch (error) {
      console.error("Error setting purchase to pending:", error);
      toast.error("Failed to set pending purchase due to error");
    }
  
  };
  
  const handleApproveAllTransfers = async () => {
    try {

        // check if there are any pending transfer requests, if not error out
        // if there are, approve all of them by setting Approved to true where Category is Transfer Requests and Approved is false
        if (data.some(row => row.Category === "Transfer Requests" && row.Approved === "false")) {
            const { data, error } = await supabase            
            .from("Notifications")
            .update({ Approved: "true" })
            .eq("Category", "Transfer Requests")
            .eq("Approved", "false")
            .select();
            // console.log(data);

            if (error) throw error;
      
            if (data.some(row => row.Category === "Transfer Requests" && row.Approved === "false")) {
              toast.error("Failed to approve all transfers");
              setShowApproveAllDialog(false);
              fetchData();
              return;
            }

            toast.success("All Transfers Approved!");
            setShowApproveAllDialog(false);
            fetchData();
        } else {
          toast.error("No pending transfer requests to approve");
          setShowApproveAllDialog(false);
          fetchData();
          return;
        }
    } catch (error) {
      console.error("Error approving transfers:", error);
      toast.error("Failed to approve all transfers");
      fetchData();
      setShowApproveAllDialog(false);
    }
  }

  const handleApproveTransfer = async (notification) => {
    try {
      const { data, error } = await supabase
        .from("Notifications")
        .update({ Approved: "true" })
        .eq("id", notification.id)
        .select();
      if (error) throw error;
      
      if (data[0].Approved === "true") {
        toast.success("Transfer approved!");
        fetchData();
      } else {
        toast.error("Failed to approve transfer");
      }
      
    } catch (error) {
      console.error("Error approving transfer:", error);
      toast.error("Failed to approve transfer");
    }
    
  };

  const handleUndoApproveTransfer = async (notification) => {
    try {
      const { error } = await supabase
        .from("Notifications")
        .update({ Approved: "false" })
        .eq("id", notification.id);
  
      if (error) throw error;
  
      toast.success("Transfer approval undone!");
      fetchData();
    } catch (error) {
      console.error("Error undoing transfer approval:", error);
      toast.error("Failed to undo transfer approval");
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
                <Accordion type="quadruple" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Student Purchases</AccordionTrigger>
                    <AccordionContent>
                      <Button
                        variant="outline"
                        onClick={handleApproveAllPurchasesClick}
                        className="mr-2"
                      >
                        Approve All
                      </Button>
                      <Table>
                        <TableBody>
                          {data
                            .filter((row) => row.Category == "Purchases" && row.Approved !== "approved")
                            .map((row) => (
                              <TableRow key={row.id ?? `${row.Category}-${row.Time}-${row.Content}`}>
                                <TableCell className="w-2/3">{row.Content}</TableCell>
                                <TableCell>{formatDate(row.Time)}</TableCell>

                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleApprovePurchase(row)}
                                    className="text-green-500 hover:text-green-700"
                                  >
                                    <Check className="h-5 w-5" />
                                  </Button>
                                   <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDenyPurchase(row)}
                                    className="text-black-500 hover:text-red-500"
                                  >
                                    <X className="h-5 w-5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteMeeting(row)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>{" "}
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Purchase History</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableBody>
                          {data
                            .filter((row) => row.Category == "Purchases")
                            .map((row) => (
                              <TableRow key={row.id ?? `${row.Category}-${row.Time}-${row.Content}`}>
                                <TableCell className="w-2/3">{row.Content}</TableCell>
                                <TableCell>{formatDate(row.Time)}</TableCell>
                                <TableCell>
                                  {row.Approved === "approved" ? (
                                    <span className="px-2 py-1 rounded bg-green-200 text-gray-700 text-sm">
                                      Approved
                                    </span>
                                  ) : (row.Approved ==="denied" ? (
                                    <span className="px-2 py-1 rounded bg-red-200 text-gray-700 text-sm">
                                      Denied
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-sm">
                                      Pending
                                    </span>
                                  ))}
                                </TableCell>
                                <TableCell>
                                  {row.Approved === "approved" || row.Approved === "denied" ? (
                                    <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleResetPurchase(row)}
                                    className="text-gray-500 hover:text-red-700"
                                  >
                                    <RotateCcw className="h-5 w-5" />
                                  </Button>
                                  ) : ( null )}
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
                            ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>{" "}
                  <AccordionItem value="item-3">
                    <AccordionTrigger>Student Sign Ups</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableBody>
                          {data
                            .filter((row) => row.Category == "Sign Ups")
                            .map((row) => (
                              <TableRow key={row.id ?? `${row.Category}-${row.Time}-${row.Content}`}>
                                <TableCell className="w-2/3">{row.Content}</TableCell>
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
                            ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>Un-registers</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableBody>
                          {data
                            .filter((row) => row.Category == "Un-registers")
                            .map((row) => (
                              <TableRow key={row.id ?? `${row.Category}-${row.Time}-${row.Content}`}>
                                <TableCell className="w-2/3">{row.Content}</TableCell>
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
                            ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-5">
                    <AccordionTrigger>Transfer Requests</AccordionTrigger>
                    <AccordionContent>
                      <Button
                        variant="outline"
                        onClick={handleApproveAllClick}
                        className="mr-2"
                      >
                        Approve All
                      </Button>
                      <Table>
                        <TableBody>
                          {data
                            .filter(
                              (row) => row.Category == "Transfer Requests" && row.Approved == "false"
                            )
                            .map((row) => (
                              <TableRow key={row.id ?? `${row.Category}-${row.Time}-${row.Content}`}>
                                <TableCell className="w-2/3">{row.Content}</TableCell>
                                <TableCell>{formatDate(row.Time)}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleApproveTransfer(row)}
                                    className="mr-2 text-green-500 hover:text-green-700"
                                  >
                                    <Check className="h-5 w-5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDenyPurchase(row)}
                                    className="mr-2 text-gray-500 hover:text-red-700"
                                  >
                                    <X className="h-5 w-5" />
                                  </Button>
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
                            ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-6">
                    <AccordionTrigger>Transfer History</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableBody>
                          {data
                            .filter((row) => row.Category === "Transfer Requests")
                            .map((row) => (
                              <TableRow key={row.id ?? `${row.Category}-${row.Time}-${row.Content}`}>
                                <TableCell className="w-2/3">{row.Content}</TableCell>
                                <TableCell>{formatDate(row.Time)}</TableCell>
                                <TableCell>
                                  {row.Approved === "true" ? (
                                    <span className="px-2 py-1 rounded bg-green-200 text-gray-700 text-sm">
                                      Approved
                                    </span>
                                  ) : (row.Approved === "denied" ? (
                                    <span className="px-2 py-1 rounded bg-red-200 text-red-800 text-sm">
                                      Denied
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-sm">
                                      Pending
                                    </span>
                                  ))}
                                </TableCell>
                                <TableCell>
                                  {row.Approved === "true" || row.Approved === "denied" ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleUndoApproveTransfer(row)}
                                      className="text-red-500 hover:text-red-700">
                                        <RotateCcw className="h-5 w-5" />
                                      </Button>
                                  ) : ( null )}
                                </TableCell>
                              </TableRow>
                            ))}
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
      {/* Approve All Transfers Confirmation Dialog */}
        <Dialog open={showApproveAllDialog} onOpenChange={setShowApproveAllDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Approve All</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Are you sure you want to approve all pending transfer requests?</p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowApproveAllDialog(false)}
              >
                Cancel
              </Button>
              <Button type="module" onClick={handleApproveAllTransfers}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
       {/* Approve All Purchases Confirmation Dialog */}
        <Dialog open={showApproveAllPurchasesDialog} onOpenChange={setShowApproveAllPurchasesDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Approve All Purchases</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Are you sure you want to approve all pending purchases?</p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowApproveAllPurchasesDialog(false)}
              >
                Cancel
              </Button>
              <Button type="module" onClick={handleApproveAllPurchases}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

    </div>


  );
}
