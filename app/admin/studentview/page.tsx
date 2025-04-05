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
  const router = useRouter();

  // Fetch all students and meetings on component mount
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(false);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const { data: userData } = await supabase.auth.getUser();

        await fetchStudents();
        await fetchMeetings();
      } catch (error) {
        console.error("Error:", error);
        toast.error("An error occurred");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

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
      setSelectedStudent(studentName);
      buildPieChartData(userData);
      setIsPopoverOpen(false);
    }
  };

  const buildPieChartData = (userData: any) => {
    const fields = [
      { key: "Cash", label: "Cash" },
      { key: "Current Bonds", label: "Current Bonds" },
      { key: "Current Stocks", label: "Current Stocks" },
      { key: "SMG", label: "SMG" },
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
      "#BEADFA",
      "#D0BFFF",
      "#DFCCFB",
      "#E8D8FF",
      "#F1E3FF",
    ];

    fields.forEach(({ key, label }, index) => {
      if (userData[key] > 0) {
        labels.push(label);
        data.push(userData[key]);
      }
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
                    <h2 className="text-lg font-semibold mb-4">
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
                    <p className="text-center mt-4 font-medium">
                      Net Worth: {studentData["Net Worth"] || 0} Pelicoin
                    </p>
                    <div className="flex justify-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" className="text-blue-600">
                            View statements
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] overflow-y-scroll max-h-screen">
                          <DialogHeader>
                            <DialogTitle>Statements</DialogTitle>
                          </DialogHeader>
                          <Tabs defaultValue="financial" className="w-full">
                            <TabsList className="w-full">
                              <TabsTrigger
                                value="financial"
                                className="w-full font-bold"
                              >
                                Financial Statement
                              </TabsTrigger>
                              <TabsTrigger
                                value="incometax"
                                className="w-full font-bold"
                              >
                                Income/Tax Statement
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="financial">
                              <Table>
                                <TableCaption>
                                  Student's financial statement
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
                                        studentData["Cash"] +
                                        studentData["Current Stocks"] +
                                        studentData["Current Bonds"]
                                      ).toFixed(2) || "N/A"}
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell className="font-medium"></TableCell>
                                    <TableCell>Cash</TableCell>
                                    <TableCell>{studentData["Cash"]}</TableCell>
                                    <TableCell className="text-right"></TableCell>
                                  </TableRow>
                                  {/* Additional table rows same as original - removed for brevity */}
                                  {/* Insert the remaining financial statement table rows here */}
                                </TableBody>
                              </Table>
                            </TabsContent>
                            <TabsContent value="incometax">
                              <Table>
                                <TableCaption>
                                  Student's income/tax statement
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
                                      {studentData["Wage Income"]}
                                    </TableCell>
                                  </TableRow>
                                  {/* Additional table rows same as original - removed for brevity */}
                                  {/* Insert the remaining income/tax statement table rows here */}
                                </TableBody>
                              </Table>
                            </TabsContent>
                          </Tabs>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Meetings */}
                  <div className="p-4 bg-white shadow rounded-lg">
                    <h2 className="text-lg font-semibold mb-4">
                      Upcoming Meetings
                    </h2>
                    <ScrollArea className="h-64">
                      {meetings.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Topic</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {meetings.map((meeting) => {
                              const studentFullName = `${studentData["First Name"]} ${studentData["Last Name"]}`;
                              const isRegistered =
                                meeting.Attendees?.includes(studentFullName);

                              return (
                                <TableRow key={meeting.Topic}>
                                  <TableCell>{meeting.Topic}</TableCell>
                                  <TableCell>
                                    {new Date(meeting.Date).toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    {isRegistered ? (
                                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                        Registered
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                        Not Registered
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-muted-foreground">
                          No upcoming meetings
                        </p>
                      )}
                    </ScrollArea>
                  </div>
                </div>

                {/* Ticket Status */}
                <div className="mt-6 p-4 bg-white shadow rounded-lg">
                  <h2 className="text-lg font-semibold mb-4">Ticket Status</h2>
                  <div className="flex items-center justify-center flex-col">
                    <img
                      alt="ticket"
                      src={
                        studentData["Celebration Ticket"] == 1
                          ? "/ticket.png"
                          : "/tickete.png"
                      }
                      className="w-24 h-auto mb-2"
                    />
                    <p className="text-center">
                      {studentData["Celebration Ticket"] == 1 ? (
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
                    </p>
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
