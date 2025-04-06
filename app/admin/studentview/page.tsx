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
import { ArrowLeft, ChevronDown, Search, User } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

ChartJS.register(ArcElement, Tooltip, Legend);

const AdminStudentView = () => {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<any>({});
  const [piechartData, setPiechartData] = useState<any>(null);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [shop, setShop] = useState<any[]>([]);
  const fetchShop = async () => {
    const { data, error } = await supabase.from("Shop").select();
    if (!error) setShop(data || []);
  };
  const router = useRouter();
  const [curUser, setCurUser] = useState<any>({});
  // Fetch all students and meetings on component mount
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
  // Filter students when search term changes
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
        // Sort students alphabetically
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

  const handleStudentSelect = (studentName: string) => {
    const student = students.find((s) => s.Student === studentName);
    if (student) {
      // Process student data similar to the home page
      const userData = { ...student };

      // Extract first and last name
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
      <div className="min-h-screen ">
        <Card className="w-[80vw] h-[90vh] mt-8 mx-auto border-none shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6 ">
              <h1 className="text-xl font-bold">Admin Student View</h1>

              {/* Student Selector Dropdown */}
              <div className="flex items-center gap-2">
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
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="p-2">
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map((student) => (
                            <Button
                              key={student.Student}
                              variant="ghost"
                              onClick={() =>
                                handleStudentSelect(student.Student)
                              }
                              className="w-full justify-start font-normal"
                            >
                              {student.Student}
                            </Button>
                          ))
                        ) : (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            No students found
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {selectedStudent ? (
              <div style={{ position: "relative", top: "5vh" }}>
                <header className="mb-6">
                  <h2 className="text-lg font-medium">
                    Viewing: {studentData["First Name"] || "Student"}'s Screen
                  </h2>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <div className="p-4 bg-white shadow rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">
                      Portfolio Breakdown
                    </h2>
                    {piechartData ? (
                      <Pie
                        options={{
                          plugins: {
                            legend: {
                              position: "right",
                            },
                          },
                        }}
                        style={{
                          width: "70%",
                          height: "70%",
                          marginLeft: "auto",
                          marginRight: "auto",
                        }}
                        data={piechartData}
                      />
                    ) : (
                      <p>No data available</p>
                    )}
                    <p className="text-center mt-4 font-medium mt-[-30px]">
                      Net Worth: {curUser["Net Worth"] || 0} Pelicoin
                    </p>
                    <div className="flex justify-center">
                      <div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="link"
                              className="mr-[auto] ml-[auto] text-blue-600"
                            >
                              View statements
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px] overflow-y-scroll max-h-screen">
                            <DialogHeader>
                              <DialogTitle>Statements</DialogTitle>
                            </DialogHeader>
                            <Tabs defaultValue="financial" className="w-[100%]">
                              <TabsList className="w-[100%]">
                                <TabsTrigger
                                  value="financial"
                                  className="w-[100%] font-bold"
                                >
                                  Financial Statement
                                </TabsTrigger>
                                <TabsTrigger
                                  value="incometax"
                                  className="w-[100%] font-bold"
                                >
                                  Income/Tax Statement
                                </TabsTrigger>
                              </TabsList>
                              <TabsContent value="financial">
                                <Table>
                                  <TableCaption>
                                    Your financial statment.
                                  </TableCaption>
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
                                    <TableRow>
                                      <TableCell className="font-bold">
                                        Assets
                                      </TableCell>
                                      <TableCell></TableCell>
                                      <TableCell></TableCell>
                                      <TableCell className="text-right"></TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        Current
                                      </TableCell>
                                      <TableCell></TableCell>
                                      <TableCell></TableCell>
                                      <TableCell className="text-right">
                                        {(
                                          curUser["Cash"] +
                                          curUser["Current Stocks"] +
                                          curUser["Current Bonds"]
                                        ).toFixed(2) || "N/A"}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium"></TableCell>
                                      <TableCell>Cash</TableCell>
                                      <TableCell>{curUser["Cash"]}</TableCell>
                                      <TableCell className="text-right"></TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium"></TableCell>
                                      <TableCell>Current Stocks</TableCell>
                                      <TableCell>
                                        {curUser["Current Stocks"]}
                                      </TableCell>
                                      <TableCell className="text-right"></TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium"></TableCell>
                                      <TableCell>Current Bonds</TableCell>
                                      <TableCell>
                                        {curUser["Current Bonds"]}
                                      </TableCell>
                                      <TableCell className="text-right"></TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium"></TableCell>
                                      <TableCell>SMG</TableCell>
                                      <TableCell>{curUser["SMG"]}</TableCell>
                                      <TableCell className="text-right"></TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        Year +1
                                      </TableCell>
                                      <TableCell></TableCell>
                                      <TableCell></TableCell>
                                      <TableCell className="text-right">
                                        {(
                                          curUser["Stocks +1"] +
                                          curUser["Bonds +1"]
                                        ).toFixed(2) || "N/A"}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium"></TableCell>
                                      <TableCell>Stocks +1</TableCell>
                                      <TableCell>
                                        {curUser["Stocks +1"]}
                                      </TableCell>
                                      <TableCell className="text-right"></TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium"></TableCell>
                                      <TableCell>Bonds +1</TableCell>
                                      <TableCell>
                                        {curUser["Bonds +1"]}
                                      </TableCell>
                                      <TableCell className="text-right"></TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        Year +2
                                      </TableCell>
                                      <TableCell></TableCell>
                                      <TableCell></TableCell>
                                      <TableCell className="text-right">
                                        {(
                                          curUser["Stocks +2"] +
                                          curUser["Bonds +2"]
                                        ).toFixed(2) || "N/A"}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium"></TableCell>
                                      <TableCell>Stocks +2</TableCell>
                                      <TableCell>
                                        {curUser["Stocks +2"]}
                                      </TableCell>
                                      <TableCell className="text-right"></TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium"></TableCell>
                                      <TableCell>Bonds +2</TableCell>
                                      <TableCell>
                                        {curUser["Bonds +2"]}
                                      </TableCell>
                                      <TableCell className="text-right"></TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        Year +3
                                      </TableCell>
                                      <TableCell></TableCell>
                                      <TableCell></TableCell>
                                      <TableCell className="text-right">
                                        {(
                                          curUser["Stocks +3"] +
                                          curUser["Bonds +3"]
                                        ).toFixed(2) || "N/A"}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium"></TableCell>
                                      <TableCell>Stocks +3</TableCell>
                                      <TableCell>
                                        {curUser["Stocks +3"]}
                                      </TableCell>
                                      <TableCell className="text-right"></TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium"></TableCell>
                                      <TableCell>Bonds +3</TableCell>
                                      <TableCell>
                                        {curUser["Bonds +3"]}
                                      </TableCell>
                                      <TableCell className="text-right"></TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-bold">
                                        -Liabilities
                                      </TableCell>
                                      <TableCell></TableCell>
                                      <TableCell></TableCell>
                                      <TableCell className="text-right">
                                        {curUser["Loans"]}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-bold"></TableCell>
                                      <TableCell>Loans payable</TableCell>
                                      <TableCell>{curUser["Loans"]}</TableCell>
                                      <TableCell className="text-right"></TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-bold">
                                        Net worth
                                      </TableCell>
                                      <TableCell></TableCell>
                                      <TableCell></TableCell>
                                      <TableCell className="text-right">
                                        {curUser["Net Worth"]}
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </TabsContent>
                              <TabsContent value="incometax">
                                <Table>
                                  <TableCaption>
                                    Your income/tax statment.
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
                                    <TableRow>
                                      <TableCell className="font-bold">
                                        Earnings
                                      </TableCell>
                                      <TableCell></TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        Wage Income
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {curUser["Wage Income"]}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        +/- Capital Gain/Loss on Current Stocks{" "}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {
                                          curUser[
                                            "Capital Gain/Loss on Current Stocks"
                                          ]
                                        }
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        +/- Capital Gain/Loss on SMG{" "}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {" "}
                                        {curUser["Capital Gain/Loss in SMG"]}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        + Interest Income on Current Bonds
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {
                                          curUser[
                                            "Interest Earned on Current Bonds"
                                          ]
                                        }
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        + Withdrawals from Tax Deferred Accounts
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {
                                          curUser[
                                            "Withdrawals from Tax Deferred Accounts"
                                          ]
                                        }
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        - Deposits to Tax Deferred Accounts
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {
                                          curUser[
                                            "Deposits to Tax Deferred Accounts"
                                          ]
                                        }
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-bold">
                                        Taxable Income
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {curUser["Taxable Income"]}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        - Tax
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {curUser["Taxes"]}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-bold">
                                        Net Income
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {curUser["Net Income"]}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-bold"></TableCell>
                                      <TableCell className="text-right"></TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-bold"></TableCell>
                                      <TableCell className="text-right"></TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-bold">
                                        Beginning Cash Balance
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {curUser["Beginning cash"]}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        + Wage Income
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {curUser["Wage Income"]}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        +/- Capital Gain/Loss in SMG
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {curUser["Capital Gain/Loss in SMG"]}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        + Grants Received
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {" "}
                                        {curUser["Grants Received"]}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        + Loans Received
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {" "}
                                        {curUser["Loans"]}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        + Total Stock Sales
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {" "}
                                        {curUser["Total Stock Sales"]}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        + Total Bond Sales
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {" "}
                                        {curUser["Total Bond Sales"]}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        - Taxes
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {curUser["Taxes"]}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        - Loan Payments
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {curUser["Loan Payments"]}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        - Spending
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {curUser["Spending"]}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        - Fees and Penalties
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {curUser["Fees and Penalties"]}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        - Total Stock Purchases
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {curUser["Total Stock Purchases"]}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        - Total Bond Purchases
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {curUser["Total Bond Purchases"]}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">
                                        - SMG
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {curUser["SMG"]}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-bold">
                                        Ending Cash
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {curUser["Cash"]}
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </TabsContent>
                            </Tabs>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                  <Tabs
                    defaultValue="meetings"
                    style={{
                      width: "100%",
                      display: "grid",
                      gridTemplateRows: "10% 90%",
                    }}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="meetings">Meetings</TabsTrigger>
                      <TabsTrigger value="shop">Shop</TabsTrigger>
                    </TabsList>
                    <TabsContent
                      value="meetings"
                      className="p-4 bg-white shadow rounded-lg"
                    >
                      <h2 className="text-xl font-semibold mb-4">
                        Upcoming Meetings
                      </h2>
                      {meetings.length > 0 ? (
                        <ul className="space-y-4">
                          {meetings.map((meeting) => {
                            const isRegistered = meeting.Attendees?.includes(
                              curUser["First Name"] + " " + curUser["Last Name"]
                            );

                            return (
                              <li
                                key={meeting.Topic}
                                className="flex justify-between items-center"
                              >
                                <div>
                                  <h3 className="font-bold">{meeting.Topic}</h3>
                                  <p className="text-sm text-gray-500">
                                    {formatDate(new Date(meeting.Date))}
                                  </p>
                                </div>
                                {isRegistered ? (
                                  <Button
                                    variant="outline"
                                    className="ml-4 bg-red-50 hover:bg-red-100 text-red-600 border-red-300"
                                    disabled={loading}
                                  >
                                    Unregister
                                  </Button>
                                ) : (
                                  <Button className="ml-4" disabled={loading}>
                                    Sign Up
                                  </Button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p>No upcoming meetings</p>
                      )}
                    </TabsContent>
                    <TabsContent
                      value="shop"
                      className="p-4 bg-white shadow rounded-lg"
                    >
                      <h2 className="text-xl font-semibold mb-4">Shop</h2>
                      {shop.length > 0 ? (
                        <ul className="space-y-4">
                          {shop.map((item) => {
                            return (
                              <li
                                key={item.Name}
                                className="flex justify-between items-center"
                              >
                                <div>
                                  <h3 className="font-bold">{item.Name}</h3>
                                </div>
                                {item.Price} Pelicoin
                                <Button className="ml-4" disabled={loading}>
                                  Purchase
                                </Button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p>No upcoming meetings</p>
                      )}
                    </TabsContent>
                  </Tabs>
                  {/* Meetings */}
                  {/* <div className="p-4 bg-white shadow rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Upcoming Meetings</h2>
            {meetings.length > 0 ? (
              <ul className="space-y-4">
                {meetings.map((meeting) => {
                  const isRegistered = meeting.Attendees?.includes(
                    curUser["First Name"] + " " + curUser["Last Name"]
                  );

                  return (
                    <li
                      key={meeting.Topic}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <h3 className="font-bold">{meeting.Topic}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(meeting.Date).toLocaleString()}
                        </p>
                      </div>
                      {isRegistered ? (
                        <Button
                          variant="outline"
                          className="ml-4 bg-red-50 hover:bg-red-100 text-red-600 border-red-300"
                          disabled={loading}
                          onClick={() =>
                            handleUnregister(
                              meeting.Topic,
                              meeting.Attendees || []
                            )
                          }
                        >
                          Unregister
                        </Button>
                      ) : (
                        <Button
                          className="ml-4"
                          disabled={loading}
                          onClick={() =>
                            handleSignUp(meeting.Topic, meeting.Attendees || [])
                          }
                        >
                          Sign Up
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>No upcoming meetings</p>
            )}
          </div> */}
                </div>

                {/* Ticket Status */}
                <div className="mt-6 p-4 bg-white shadow rounded-lg">
                  <h2 className="text-xl font-semibold">Ticket Status</h2>
                  <img
                    alt="ticket"
                    src={
                      curUser["Celebration Ticket"] == 1
                        ? "/ticket.png"
                        : "/tickete.png"
                    }
                    style={{
                      marginLeft: "auto",
                      marginRight: "auto",
                      width: "100px",
                    }}
                  />
                  <div style={{ padding: "10px", textAlign: "center" }}>
                    {curUser["Celebration Ticket"] == 1 ? (
                      <>
                        Hooray! You have a ticket for the End-of-Year
                        Celebration!{" "}
                      </>
                    ) : (
                      <>
                        Unfortunately, you do not have a ticket for the
                        End-of-Year celebration :&#x2768;. Please contact Dr.
                        Fisher to purchase.{" "}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                  <User className="h-16 w-16 mx-auto text-gray-300 mb-2" />
                  <h3 className="text-lg font-medium mb-1">
                    No Student Selected
                  </h3>
                  <p className="text-muted-foreground">
                    Select a student from the dropdown to view their dashboard
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarProvider>
  );
};

export default AdminStudentView;
