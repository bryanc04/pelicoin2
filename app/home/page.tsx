"use client";

import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import supabase from "../supabaseClient"; // Ensure this points to your Supabase setup
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
import { toast, Toaster } from "react-hot-toast";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Meeting {
  Topic: string;
  Date: string;
  Attendees?: string[];
}

interface ShopItem {
  Name: string;
  Price: number;
}

const Home: React.FC = () => {
  const [curUser, setCurUser] = useState<any>(null);
  const [piechartData, setPiechartData] = useState<any>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [shop, setShop] = useState<ShopItem[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState<{
    title: string;
    message: string;
    image?: string;
  }>({ title: "", message: "" });

  // Add mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Update chart options based on mobile state
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

  const fetchMeetings = async () => {
    console.log("Fetching meetings...");
    const { data, error } = await supabase
      .from("Meetings")
      .select()
      .order("Date", { ascending: true });
    if (!error) {
      console.log("Fetched meetings:", data);
      setMeetings(data || []);
    } else {
      console.error("Error fetching meetings:", error);
    }
  };
  const fetchShop = async () => {
    const { data, error } = await supabase.from("Shop").select();
    if (!error) setShop(data || []);
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

  // Check auth status on mount and when page hydrates
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();

        if (!data.session) {
          // No active session, redirect to login
          router.replace("/");
          return;
        }

        setIsAuthenticated(true);
        await fetchUserData();
        await fetchMeetings();
        await fetchShop();
      } catch (error) {
        console.error("Auth check error:", error);
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          router.replace("/");
        } else if (event === "SIGNED_IN" && session) {
          setIsAuthenticated(true);
          fetchUserData();
          fetchMeetings();
        }
      }
    );

    checkAuth();

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  const fetchUserData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user?.user?.email) {
        return;
      }

      const { data, error } = await supabase.from("Pelicoin balances").select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        let userData = null;
        data.forEach((u) => {
          if (
            u["SIS Login ID"] &&
            user.user["user_metadata"]["preferred_username"]
          ) {
            if (
              u["SIS Login ID"].toLowerCase() ===
              user.user["user_metadata"]["preferred_username"].toLowerCase()
            ) {
              u["First Name"] = u["Student"].split(",")[1].trim();
              u["Last Name"] = u["Student"].split(",")[0].trim();
              userData = u;
            }
          }
        });

        if (userData) {
          setCurUser(userData);
          buildPieChartData(userData);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleSignUp = async (
    meetingTopic: string,
    attendees: string[],
    meetingdate: any
  ) => {
    setLoading(true);

    if (
      attendees.includes(curUser["First Name"] + " " + curUser["Last Name"])
    ) {
      alert("Already signed up!");
      setLoading(false);
      return;
    }

    const newAttendees = [
      ...attendees,
      `${curUser["First Name"]} ${curUser["Last Name"]}`,
    ];

    const { error } = await supabase
      .from("Meetings")
      .update({ Attendees: newAttendees })
      .eq("Topic", meetingTopic);

    if (!error) {
      fetchMeetings();

      toast.success("Sign Up Succesful!");
      addNotification(
        "Sign Ups",
        `${curUser["First Name"]} ${
          curUser["Last Name"]
        } signed up for ${meetingTopic} on ${formatDate(meetingdate)}`,
        new Date(),
        Math.floor(Math.random() * 1000000000000000)
      );
    } else {
      alert("Failed to sign up.");
    }
    setLoading(false);
  };

  // New function to handle unregistering from meetings
  const handleUnregister = async (
    meetingTopic: string,
    attendees: string[],
    meetingdate: string
  ) => {
    setLoading(true);

    const currentUserName = `${curUser["First Name"]} ${curUser["Last Name"]}`;

    if (!attendees.includes(currentUserName)) {
      alert("You are not registered for this meeting!");
      setLoading(false);
      return;
    }

    // Filter out the current user from the attendees list
    const updatedAttendees = attendees.filter(
      (name) => name !== currentUserName
    );

    const { error } = await supabase
      .from("Meetings")
      .update({ Attendees: updatedAttendees })
      .eq("Topic", meetingTopic);

    if (!error) {
      fetchMeetings();
      toast.success("Succesfully unregistered from " + meetingTopic);
      addNotification(
        "Un-registers",
        `${curUser["First Name"]} ${
          curUser["Last Name"]
        } unregistered up from ${meetingTopic} on ${formatDate(meetingdate)}`,
        new Date(),
        Math.floor(Math.random() * 1000000000000000)
      );
    } else {
      alert("Failed to unregister from meeting.");
    }

    setLoading(false);
  };

  const addNotification = async (
    category: any,
    content: any,
    time: any,
    id: any
  ) => {
    const notif = {
      Category: category,
      Content: content,
      Time: time,
      id: id,
    };

    const { error } = await supabase.from("Notifications").insert([notif]);
  };
  const handlePurchase = async (item: any) => {
    if (curUser["Cash"] > item.Price) {
      addNotification(
        "Purchases",
        curUser["First Name"] +
          " " +
          curUser["Last Name"] +
          " purchased " +
          item.Name,
        new Date(),
        Math.floor(Math.random() * 1000000000000000)
      );

      toast.success(
        "Thank you for buying " +
          item.Name +
          "! Please come find Dr. Fisher in Brush."
      );
    } else {
      toast.error(
        `You do not have enough cash (extra ${
          item.Price - curUser["Cash"]
        } Pelicoin required)`
      );
    }
  };

  // Handle sign out function
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Redirect to login page or home page after sign out
      router.replace("/");
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out. Please try again.");
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Let the router handle the redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center">
      <Toaster />
      <div className="max-w-4xl mx-auto w-full">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Hi, {curUser["First Name"] || "User"}!
          </h1>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="bg-red-50 hover:bg-red-100 text-red-600 border-red-300 w-full sm:w-auto"
          >
            Sign Out
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:h-[40vh] mb-4 md:mb-0">
          {/* Pie Chart */}
          <div className="p-6 bg-white shadow rounded-lg flex flex-col min-h-[300px] md:h-full">
            <h2 className="text-xl font-semibold mb-6">Portfolio Breakdown</h2>
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
                Net Worth: {curUser["Net Worth"] || 0} Pelicoin
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
                        <TabsTrigger
                          value="financial"
                          className="text-xs sm:text-sm"
                        >
                          Balance Sheet
                        </TabsTrigger>
                        <TabsTrigger
                          value="incometax"
                          className="text-xs sm:text-sm"
                        >
                          Income/Tax
                        </TabsTrigger>
                        <TabsTrigger
                          value="cashflowstatement"
                          className="text-xs sm:text-sm"
                        >
                          Cash Flow
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="financial">
                        <Table>
                          <TableCaption>Your balance sheet.</TableCaption>
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
                              <TableCell>{curUser["Current Stocks"]}</TableCell>
                              <TableCell className="text-right"></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium"></TableCell>
                              <TableCell>Current Bonds</TableCell>
                              <TableCell>{curUser["Current Bonds"]}</TableCell>
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
                                  curUser["Stocks +1"] + curUser["Bonds +1"]
                                ).toFixed(2) || "N/A"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium"></TableCell>
                              <TableCell>Stocks +1</TableCell>
                              <TableCell>{curUser["Stocks +1"]}</TableCell>
                              <TableCell className="text-right"></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium"></TableCell>
                              <TableCell>Bonds +1</TableCell>
                              <TableCell>{curUser["Bonds +1"]}</TableCell>
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
                                  curUser["Stocks +2"] + curUser["Bonds +2"]
                                ).toFixed(2) || "N/A"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium"></TableCell>
                              <TableCell>Stocks +2</TableCell>
                              <TableCell>{curUser["Stocks +2"]}</TableCell>
                              <TableCell className="text-right"></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium"></TableCell>
                              <TableCell>Bonds +2</TableCell>
                              <TableCell>{curUser["Bonds +2"]}</TableCell>
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
                                  curUser["Stocks +3"] + curUser["Bonds +3"]
                                ).toFixed(2) || "N/A"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium"></TableCell>
                              <TableCell>Stocks +3</TableCell>
                              <TableCell>{curUser["Stocks +3"]}</TableCell>
                              <TableCell className="text-right"></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium"></TableCell>
                              <TableCell>Bonds +3</TableCell>
                              <TableCell>{curUser["Bonds +3"]}</TableCell>
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
                          <TableCaption>Your income/tax statment.</TableCaption>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[200px]">Name</TableHead>
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
                                {curUser["Capital Gain/Loss on Current Stocks"]}
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
                                {curUser["Interest Earned on Current Bonds"]}
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
                                {curUser["Deposits to Tax Deferred Accounts"]}
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
                          </TableBody>
                        </Table>
                      </TabsContent>
                      <TabsContent value="cashflowstatement">
                        <Table>
                          <TableCaption>
                            Your Statement of Cash flow
                          </TableCaption>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[200px]">Name</TableHead>
                              <TableHead className="text-right">
                                Value
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
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

          <div className="min-h-[30vh] md:h-full">
            <Tabs
              defaultValue="meetings"
              className="w-full h-full flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="meetings">Meetings</TabsTrigger>
                <TabsTrigger value="shop">Shop</TabsTrigger>
              </TabsList>
              <div className="relative flex-1">
                <TabsContent
                  value="meetings"
                  className="absolute inset-0 p-6 bg-white shadow rounded-lg overflow-hidden flex flex-col"
                >
                  <h2
                    className="text-xl font-semibold mb-4"
                    style={{ zIndex: "1" }}
                  >
                    Upcoming Meetings
                  </h2>
                  <div
                    className="flex-1 overflow-y-auto min-h-0"
                    style={{ zIndex: "1" }}
                  >
                    {meetings.length > 0 ? (
                      <ul className="space-y-4">
                        {meetings.map((meeting) => {
                          const isRegistered = meeting.Attendees?.includes(
                            curUser["First Name"] + " " + curUser["Last Name"]
                          );

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
                              </div>
                              {isRegistered ? (
                                <Button
                                  variant="outline"
                                  className="w-full sm:w-auto bg-red-50 hover:bg-red-100 text-red-600 border-red-300"
                                  disabled={loading}
                                  onClick={() =>
                                    handleUnregister(
                                      meeting.Topic,
                                      meeting.Attendees || [],
                                      meeting.Date
                                    )
                                  }
                                >
                                  Unregister
                                </Button>
                              ) : (
                                <Button
                                  className="w-full sm:w-auto"
                                  disabled={loading}
                                  onClick={() =>
                                    handleSignUp(
                                      meeting.Topic,
                                      meeting.Attendees || [],
                                      meeting.Date
                                    )
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
                  </div>
                </TabsContent>
                <TabsContent
                  value="shop"
                  className="absolute inset-0 p-6 bg-white shadow rounded-lg overflow-hidden flex flex-col"
                >
                  <h2 className="text-xl font-semibold mb-4">Shop</h2>
                  <div className="flex-1 overflow-y-auto min-h-0">
                    {shop.length > 0 ? (
                      <ul className="space-y-4">
                        {shop.map((item) => (
                          <li
                            key={item.Name}
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <h3 className="font-bold text-sm sm:text-base">
                                {item.Name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {item.Price} Pelicoin
                              </p>
                            </div>
                            <Button
                              className="w-full sm:w-auto"
                              disabled={loading}
                              onClick={() => handlePurchase(item)}
                            >
                              Purchase
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No items available</p>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        {/* Ticket Status */}
        <div className="mt-8 md:mt-8 p-6 bg-white shadow rounded-lg min-h-[150px] md:h-[20vh]">
          <h2 className="text-xl font-semibold text-center">Ticket Status</h2>
          <div className="flex items-center justify-center h-full gap-4">
            <img
              alt="ticket"
              src={
                curUser["Celebration Ticket"] == 1
                  ? "/ticket.png"
                  : "/tickete.png"
              }
              className="w-24 h-auto"
            />
            <p className="text-right text-sm sm:text-base max-w-[60%]">
              {curUser["Celebration Ticket"] == 1 ? (
                <>Hooray! You have a ticket for the End-of-Year Celebration!</>
              ) : (
                <>
                  Unfortunately, you do not have a ticket for the End-of-Year
                  celebration :(. Please contact Dr. Fisher to purchase.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
