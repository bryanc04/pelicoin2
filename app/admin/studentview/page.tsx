"use client";

import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import supabase from "../../supabaseClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ChevronDown, Search, User } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Meeting {
  Topic: string;
  Date: string;
  Attendees?: string[];
}

interface ShopItem {
  Name: string;
  Price: number;
  requires_custom_input: boolean;
  custom_input_description?: string;
}

interface TransferRequest {
  source: string;
  destination: string;
  amount: number;
}

const AdminStudentView = () => {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<any>({});
  const [piechartData, setPiechartData] = useState<any>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [shop, setShop] = useState<ShopItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showCustomInputDialog, setShowCustomInputDialog] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [activeTab, setActiveTab] = useState("meetings");
  const [transferRequest, setTransferRequest] = useState<TransferRequest>({
    source: "Cash",
    destination: "Cash",
    amount: 0,
  });
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const router = useRouter();
  const [curUser, setCurUser] = useState<any>({});

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const chartOptions = {
    plugins: {
      legend: {
        position: (isMobile ? "bottom" : "right") as "bottom" | "right",
        labels: {
          boxWidth: 12,
          font: {
            size: isMobile ? 9 : 10,
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(false);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const { data: userData } = await supabase.auth.getUser();

        await fetchStudents();
        await fetchMeetings();
        await fetchShop();
      } catch (error) {
        console.error("Error:", error);
        toast.error("An error occurred");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const formatDate = (dateStr: any) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      timeZone: "America/New_York",
    });
  };

  useEffect(() => {
    if (searchTerm) {
      const filtered = students.filter((student) =>
        student.Student.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase.from("Pelicoin balances").select();

      if (error) throw error;

      if (data && data.length > 0) {
        const sortedData = data.sort((a, b) =>
          a.Student.localeCompare(b.Student)
        );
        setStudents(sortedData);
        setFilteredStudents(sortedData);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    }
  };

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase.from("Meetings").select();
      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast.error("Failed to load meetings");
    }
  };

  const fetchShop = async () => {
    try {
      const { data, error } = await supabase.from("Shop").select();
      if (error) throw error;
      setShop(data || []);
    } catch (error) {
      console.error("Error fetching shop items:", error);
      toast.error("Failed to load shop items");
    }
  };

  const handleStudentSelect = (studentName: string) => {
    const student = students.find((s) => s.Student === studentName);
    if (student) {
      const userData = { ...student };
      userData["First Name"] = userData["Student"].split(",")[1]?.trim() || "";
      userData["Last Name"] = userData["Student"].split(",")[0]?.trim() || "";

      setStudentData(userData);
      setCurUser(userData);
      setSelectedStudent(studentName);
      buildPieChartData(userData);
      setIsPopoverOpen(false);
    }
  };

  const buildPieChartData = (userData: any) => {
    const fields = [
      { key: "Cash", label: "Cash" },
      { key: "SMG", label: "SMG" },
      { key: "Current Bonds", label: "Current Bonds" },
      { key: "Current Stocks", label: "Current Stocks" },
      { key: "Bonds +1", label: "+1 Bonds" },
      { key: "Stocks +1", label: "+1 Stocks" },
      { key: "Bonds +2", label: "+2 Bonds" },
      { key: "Stocks +2", label: "+2 Stocks" },
      { key: "Bonds +3", label: "+3 Bonds" },
      { key: "Stocks +3", label: "+3 Stocks" },
    ];

    const labels: string[] = [];
    const data: number[] = [];
    const colors: string[] = [
      "#fff570",
      "#57d964",
      "#8cdb94",
      "#c6f5cb",
      "#59b4ff",
      "#badaf5",
      "#dd75ff",
      "#e6b2f7",
      "#808080",
      "#c9c9c9",
    ];

    fields.forEach(({ key, label }, index) => {
      labels.push(label);
      data.push(userData[key]);
    });

    setPiechartData({
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 1,
        },
      ],
    });
  };

  const handlePurchase = async (item: ShopItem) => {
    setSelectedItem(item);
    if (item.requires_custom_input) {
      setShowCustomInputDialog(true);
    } else {
      setShowPurchaseDialog(true);
    }
  };

  const handleCustomInputSubmit = () => {
    if (!customInput.trim()) {
      toast.error("Please provide the required input");
      return;
    }
    setShowCustomInputDialog(false);
    setShowPurchaseDialog(true);
  };

  const confirmPurchase = async () => {
    if (!selectedItem || !studentData) return;

    const newBalance = studentData.Cash - selectedItem.Price;
    if (newBalance < 0) {
      toast.error("Insufficient funds");
      return;
    }

    try {
      const { error } = await supabase
        .from("Pelicoin balances")
        .update({ Cash: newBalance })
        .eq("SIS Login ID", studentData["SIS Login ID"]);

      if (error) throw error;

      const notificationContent = `${studentData["First Name"]} ${
        studentData["Last Name"]
      } purchased ${selectedItem.Name} for ${selectedItem.Price} Pelicoin${
        selectedItem.requires_custom_input ? ` (${customInput})` : ""
      }`;

      await addNotification(
        "Purchases",
        notificationContent,
        new Date(),
        Math.floor(Math.random() * 1000000000000000),
        true
      );

      toast.success("Purchase successful!");
      setStudentData({ ...studentData, Cash: newBalance });
      buildPieChartData({ ...studentData, Cash: newBalance });
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("Failed to complete purchase");
    } finally {
      setShowPurchaseDialog(false);
      setSelectedItem(null);
      setCustomInput("");
    }
  };

  const addNotification = async (
    category: any,
    content: any,
    time: any,
    id: any,
    approved: any
  ) => {
    const notif = {
      Category: category,
      Content: content,
      Time: time,
      id: id,
      Approved: approved,
    };

    const { error } = await supabase.from("Notifications").insert([notif]);
    if (error) throw error;
  };

  const handleTransfer = async () => {
    if (!transferRequest.amount || transferRequest.amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (transferRequest.source === transferRequest.destination) {
      toast.error("Source and destination cannot be the same");
      return;
    }

    try {
      await addNotification(
        "Transfer Requests",
        `${studentData["First Name"]} ${studentData["Last Name"]} requested to transfer ${transferRequest.amount} Pelicoin from ${transferRequest.source} to ${transferRequest.destination}`,
        new Date(),
        Math.floor(Math.random() * 1000000000000000),
        false
      );

      toast.success("Transfer request submitted!");
      setShowTransferDialog(false);
      setTransferRequest({ source: "Cash", destination: "Cash", amount: 0 });
    } catch (error) {
      console.error("Transfer request error:", error);
      toast.error("Failed to submit transfer request");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger />
      <Toaster />
      <div
        className="min-h-screen bg-gray-50 py-8 px-4 w-[100%]"
        style={{ background: "white" }}
      >
        <Analytics />
        <div className="max-w-4xl mx-auto w-full">
          <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold">Student View</h1>
            </div>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[250px] justify-between",
                    !selectedStudent && "text-muted-foreground"
                  )}
                >
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {selectedStudent || "Select a student"}
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0">
                <div className="p-2">
                  <div className="flex items-center border rounded-md px-2">
                    <Search className="h-4 w-4 opacity-50 mr-2" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <ScrollArea className="h-[200px] mt-2">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.Student}
                        className="p-2 hover:bg-gray-100 cursor-pointer rounded-md"
                        onClick={() => handleStudentSelect(student.Student)}
                      >
                        {student.Student}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>
          </header>

          {selectedStudent ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:h-[40vh] mb-4 md:mb-0">
                {/* Pie Chart */}
                <div className="p-6 bg-white shadow rounded-lg flex flex-col min-h-[300px] md:h-full">
                  <h2 className="text-xl font-semibold mb-6">
                    Portfolio Breakdown
                  </h2>
                  {piechartData ? (
                    <div
                      className={`w-full aspect-square ${
                        isMobile ? "max-w-[250px]" : "max-w-xs"
                      } mx-auto flex-1 flex items-center ${
                        isMobile ? "h-[200px]" : "h-[40%]"
                      }`}
                    >
                      <Pie options={chartOptions} data={piechartData} />
                    </div>
                  ) : (
                    <p>No data available</p>
                  )}
                  <div className="mt-6">
                    <p className="text-center font-medium">
                      Net Worth: {studentData["Net Worth"] || 0} Pelicoin
                    </p>
                    <div className="flex justify-center mt-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" className="text-blue-600">
                            View statements
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[80vw] max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Statements</DialogTitle>
                          </DialogHeader>
                          <Tabs defaultValue="financial" className="w-full">
                            <TabsList className="w-full grid grid-cols-3">
                              <TabsTrigger value="financial">
                                Balance Sheet
                              </TabsTrigger>
                              <TabsTrigger value="incometax">
                                Income/Tax
                              </TabsTrigger>
                              <TabsTrigger value="cashflowstatement">
                                Cash Flow
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="financial">
                              <Table>
                                <TableCaption>Balance sheet.</TableCaption>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-[100px]">
                                      Overall
                                    </TableHead>
                                    <TableHead>Specifics</TableHead>
                                    <TableHead>Value</TableHead>
                                    <TableHead className="text-right">
                                      Total
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {/* Balance sheet content */}
                                </TableBody>
                              </Table>
                            </TabsContent>
                            <TabsContent value="incometax">
                              <Table>
                                <TableCaption>
                                  Income/tax statement.
                                </TableCaption>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-[200px]">
                                      Name
                                    </TableHead>
                                    <TableHead className="text-right">
                                      Value
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {/* Income/tax content */}
                                </TableBody>
                              </Table>
                            </TabsContent>
                            <TabsContent value="cashflowstatement">
                              <Table>
                                <TableCaption>
                                  Statement of cash flow.
                                </TableCaption>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-[200px]">
                                      Name
                                    </TableHead>
                                    <TableHead className="text-right">
                                      Value
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>{/* Cash flow content */}</TableBody>
                              </Table>
                            </TabsContent>
                          </Tabs>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>

                <div className="min-h-[30vh] md:h-full">
                  <Tabs
                    defaultValue="meetings"
                    className="w-full h-full flex flex-col"
                    onValueChange={(value) => setActiveTab(value)}
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="meetings">Meetings</TabsTrigger>
                      <TabsTrigger value="shop">Shop</TabsTrigger>
                      <TabsTrigger value="transfers">Transfers</TabsTrigger>
                    </TabsList>
                    <div className="relative flex-1">
                      <TabsContent
                        value="meetings"
                        className="absolute inset-0 p-6 bg-white shadow rounded-lg overflow-hidden flex flex-col"
                        style={{ zIndex: activeTab === "meetings" ? 1 : -1 }}
                      >
                        <h2 className="text-xl font-semibold mb-4">
                          Upcoming Meetings
                        </h2>
                        <div className="flex-1 overflow-y-auto min-h-0">
                          {meetings.length > 0 ? (
                            <ul className="space-y-4">
                              {meetings.map((meeting) => {
                                const isRegistered =
                                  meeting.Attendees?.includes(
                                    studentData["First Name"] +
                                      " " +
                                      studentData["Last Name"]
                                  );
                                const isFull =
                                  (meeting.Attendees?.length || 0) >= 15;

                                return (
                                  <li
                                    key={meeting.Topic}
                                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-gray-50 rounded-lg"
                                  >
                                    <div>
                                      <h3 className="font-bold text-sm sm:text-base">
                                        {meeting.Topic}
                                      </h3>
                                      <p className="text-xs sm:text-sm text-gray-500">
                                        {formatDate(new Date(meeting.Date))}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {meeting.Attendees?.length || 0}/15
                                        spots filled
                                      </p>
                                    </div>
                                    <Button
                                      variant="outline"
                                      className="w-full sm:w-auto"
                                      disabled={isFull}
                                    >
                                      {isRegistered
                                        ? "Registered"
                                        : isFull
                                        ? "Full"
                                        : "Register"}
                                    </Button>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p>No upcoming meetings</p>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent
                        value="shop"
                        className="absolute inset-0 p-6 bg-white shadow rounded-lg overflow-hidden flex flex-col"
                        style={{ zIndex: activeTab === "shop" ? 1 : -1 }}
                      >
                        <h2 className="text-xl font-semibold mb-4">Shop</h2>
                        <div className="flex-1 overflow-y-auto min-h-0">
                          {shop.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {shop.map((item) => (
                                <div
                                  key={item.Name}
                                  className="p-4 bg-gray-50 rounded-lg flex flex-col"
                                >
                                  <h3 className="font-bold text-lg mb-2">
                                    {item.Name}
                                  </h3>
                                  <p className="text-gray-600 mb-4">
                                    {item.Price} Pelicoin
                                  </p>
                                  {item.requires_custom_input && (
                                    <p className="text-sm text-gray-500 mb-4">
                                      Custom input required:{" "}
                                      {item.custom_input_description}
                                    </p>
                                  )}
                                  <Button
                                    onClick={() => handlePurchase(item)}
                                    className="mt-auto"
                                  >
                                    Purchase
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-center py-8">
                              No items available in the shop.
                            </p>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent
                        value="transfers"
                        className="absolute inset-0 p-6 bg-white shadow rounded-lg overflow-hidden flex flex-col"
                        style={{ zIndex: activeTab === "transfers" ? 1 : -1 }}
                      >
                        <h2 className="text-xl font-semibold mb-4">
                          Transfers
                        </h2>
                        <div className="flex-1 overflow-y-auto min-h-0">
                          <Button onClick={() => setShowTransferDialog(true)}>
                            New Transfer
                          </Button>
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              </div>

              {/* Ticket Status */}
              <div className="mt-8 md:mt-8 p-6 bg-white shadow rounded-lg min-h-[150px] md:h-[20vh]">
                <h2 className="text-xl font-semibold text-center">
                  Ticket Status
                </h2>
                <div className="flex items-center justify-center h-full gap-4">
                  <img
                    alt="ticket"
                    src={
                      studentData["Celebration Ticket"] == 1
                        ? "/ticket.png"
                        : "/tickete.png"
                    }
                    className="w-24 h-auto"
                  />
                  <p className="text-right text-sm sm:text-base max-w-[60%]">
                    {studentData["Celebration Ticket"] == 1 ? (
                      <>
                        Hooray! You have a ticket for the End-of-Year
                        Celebration!
                      </>
                    ) : (
                      <>
                        Unfortunately, you do not have a ticket for the
                        End-of-Year celebration :(. Please contact Dr. Fisher to
                        purchase.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Please select a student to view their dashboard.
              </p>
            </div>
          )}
        </div>

        {/* Custom Input Dialog */}
        <Dialog
          open={showCustomInputDialog}
          onOpenChange={setShowCustomInputDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Custom Input Required</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="mb-4">{selectedItem?.custom_input_description}</p>
              <Input
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Enter your input here"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCustomInputDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCustomInputSubmit}>Continue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Purchase Confirmation Dialog */}
        <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Purchase</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Item: {selectedItem?.Name}</p>
              <p>Price: {selectedItem?.Price} Pelicoin</p>
              {selectedItem?.requires_custom_input && (
                <p>Your input: {customInput}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPurchaseDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={confirmPurchase}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transfer Dialog */}
        <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Transfer Request</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={transferRequest.amount}
                  onChange={(e) =>
                    setTransferRequest({
                      ...transferRequest,
                      amount: parseFloat(e.target.value),
                    })
                  }
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label>Source</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={transferRequest.source}
                  onChange={(e) =>
                    setTransferRequest({
                      ...transferRequest,
                      source: e.target.value,
                    })
                  }
                >
                  <option value="Cash">Cash</option>
                  <option value="Stocks">Stocks</option>
                  <option value="Bonds">Bonds</option>
                </select>
              </div>
              <div>
                <Label>Destination</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={transferRequest.destination}
                  onChange={(e) =>
                    setTransferRequest({
                      ...transferRequest,
                      destination: e.target.value,
                    })
                  }
                >
                  <option value="Cash">Cash</option>
                  <option value="Stocks">Stocks</option>
                  <option value="Bonds">Bonds</option>
                  <option value="Stocks +1">Stocks +1</option>
                  <option value="Bonds +1">Bonds +1</option>
                  <option value="Stocks +2">Stocks +2</option>
                  <option value="Bonds +2">Bonds +2</option>
                  <option value="Stocks +3">Stocks +3</option>
                  <option value="Bonds +3">Bonds +3</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowTransferDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleTransfer}>Submit Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
};

export default AdminStudentView;
