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
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Analytics } from "@vercel/analytics/react";
import { isAdminEmail } from '../../lib/utils/adminEmails';

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

interface TransferCardRow {
  id: string;
  amount: number | null;
  source: string;
  destination: string;
  created_at: string;
}

const Home: React.FC = () => {
  const [curUser, setCurUser] = useState<any>(null);
  const [piechartData, setPiechartData] = useState<any>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [shop, setShop] = useState<ShopItem[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showCustomInputDialog, setShowCustomInputDialog] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState<{
    title: string;
    message: string;
    image?: string;
  }>({ title: "", message: "" });

  const [transferRequest, setTransferRequest] = useState<TransferRequest>({
    source: "Cash",
    destination: "Cash",
    amount: 0,
  });
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  const [activeTab, setActiveTab] = useState("meetings");

  const [transfers, setTransfers] = useState<TransferCardRow[]>([]);
  const [transfersLoading, setTransfersLoading] = useState(false);

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

        if (isAdminEmail(data.session?.user.email)) {
          setIsAdmin(true);
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
          await fetchTransfers(userData);
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

    // Check if meeting is full
    if (attendees.length >= 15) {
      toast.error("This meeting is full!");
      setLoading(false);
      return;
    }

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
      toast.success("Sign Up Successful!");
      addNotification(
        "Sign Ups",
        `${curUser["First Name"]} ${
          curUser["Last Name"]
        } signed up for ${meetingTopic} on ${formatDate(meetingdate)}`,
        new Date(),
        Math.floor(Math.random() * 1000000000000000),
        true
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
        Math.floor(Math.random() * 1000000000000000),
        true
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
  };
  const handlePurchase = async (item: ShopItem) => {
    setSelectedItem(item);
    if (item.requires_custom_input) {
      setShowCustomInputDialog(true);
    } else {
      setShowPurchaseDialog(true);
    }
  };

  const fetchTransfers = async (userLike: any) => {
    if (!userLike) return;
    const fullName = `${userLike["First Name"]} ${userLike["Last Name"]}`.toLowerCase();
    setTransfersLoading(true);
    const { data, error } = await supabase
      .from("Notifications")
      .select()
      .eq("Category", "Transfer Requests")
      .order("Time", { ascending: false });
    if (error) {
      console.error("fetchTransfers error:", error);
      setTransfers([]);
      setTransfersLoading(false);
      return;
    }
    const mine = (data || []).filter(
      (n: any) => (n.Content || "").toLowerCase().startsWith(fullName)
    );
    const rows: TransferCardRow[] = mine.map((n: any) => {
      const content: string = n.Content || "";
      const m =
        /transfer\s+(\d+(?:\.\d+)?)\s+Pelicoin\s+from\s+(.+?)\s+to\s+(.+)$/i.exec(
          content
        );
      return {
        id: String(n.id),
        amount: m ? Number(m[1]) : null,
        source: m ? m[2] : "—",
        destination: m ? m[3] : "—",
        created_at: n.Time || new Date().toISOString(),
      };
    });
    setTransfers(rows);
    setTransfersLoading(false);
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
    if (!selectedItem || !curUser) return;

    const newBalance = curUser.Cash - selectedItem.Price;
    if (newBalance < 0) {
      toast.error("Insufficient funds");
      return;
    }

    try {
      const { error } = await supabase
        .from("Pelicoin balances")
        .update({ Cash: newBalance })
        .eq("SIS Login ID", curUser["SIS Login ID"]);

      if (error) throw error;

      // Add notification instead of purchase history
      const notificationContent = `${curUser["First Name"]} ${
        curUser["Last Name"]
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
      setCurUser({ ...curUser, Cash: newBalance });
      buildPieChartData({ ...curUser, Cash: newBalance });
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("Failed to complete purchase");
    } finally {
      setShowPurchaseDialog(false);
      setSelectedItem(null);
      setCustomInput("");
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
        `${curUser["First Name"]} ${curUser["Last Name"]} requested to transfer ${transferRequest.amount} Pelicoin from ${transferRequest.source} to ${transferRequest.destination}`,
        new Date(),
        Math.floor(Math.random() * 1000000000000000),
        false
      );

      toast.success("Transfer request submitted!");
      setShowTransferDialog(false);
      setTransferRequest({ source: "Cash", destination: "Cash", amount: 0 });
      await fetchTransfers(curUser);
      setActiveTab("transfers");
    } catch (error) {
      console.error("Transfer request error:", error);
      toast.error("Failed to submit transfer request");
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
      <Analytics />

      <div className="max-w-4xl mx-auto w-full">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Hi, {curUser["First Name"] || "User"}!
          </h1>
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-300 w-full sm:w-auto"
              onClick={() =>
                window.open(
                  "https://loomischaffeeschool-my.sharepoint.com/:w:/g/personal/lfisher_internal_loomis_org/ESp4JiuylpZGpv9HvBEYZOABceOGQnCSgcAfJj_K91jbtg?e=38froa",
                  "_blank"
                )
              }
            >
              Pelicoin Program Rules and Information
            </Button>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="bg-red-50 hover:bg-red-100 text-red-600 border-red-300 w-full sm:w-auto"
            >
              Sign Out
            </Button>
          </div>
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
                              <TableCell className="font-bold">
                                Deductions From Income
                              </TableCell>
                              <TableCell className="text-right">

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
                              <TableCell className="font-medium">
                                - Deductible Charitable Donations
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["Deductible Charitable Donations"]}
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
                                - Payroll Tax
                              </TableCell>
                              <TableCell className="text-right">
                              {curUser["Payroll Tax"]}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                - Base Income Tax
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["Base Income Tax"]}
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
                                {curUser["Beginning Cash"]}
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
                                - Payroll Tax
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["Payroll Tax"]}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                - Base Income Tax
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["Base Income Tax"]}
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
                                - Sales Tax
                              </TableCell>
                              <TableCell className="text-right">
                              {curUser["Sales Tax"]}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                - Charitable Donations
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["Charitable Donations"]}
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
                                + Total Stock Sales
                              </TableCell>
                              <TableCell className="text-right">
                                {" "}
                                {curUser["Total Stock Sales"]}
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
                                + Total Bond Sales
                              </TableCell>
                              <TableCell className="text-right">
                                {" "}
                                {curUser["Total Bond Sales"]}
                              </TableCell>
                            </TableRow>  
                            <TableRow>
                              <TableCell className="font-medium">
                                - SMG Funds
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["SMG"]}
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
                                - Loan Payments
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["Loan Payments"]}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                + Transfers In
                              </TableCell>
                              <TableCell className="text-right">
                                {" "}
                                {curUser["Transfers In"]}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">
                                - Transfers Out
                              </TableCell>
                              <TableCell className="text-right">
                                {curUser["Transfers Out"]}
                              </TableCell>
                            </TableRow>
                            {/* Additional taxes are admin internal info only */}
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
                  <h2
                    className="text-xl font-semibold mb-4"
                    style={{ zIndex: activeTab === "meetings" ? 1 : -1 }}
                  >
                    Upcoming Meetings
                  </h2>
                  <div
                    className="flex-1 overflow-y-auto min-h-0"
                    style={{ zIndex: activeTab === "meetings" ? 1 : -1 }}
                  >
                    {meetings.length > 0 ? (
                      <ul className="space-y-4">
                        {meetings.map((meeting) => {
                          const isRegistered = meeting.Attendees?.includes(
                            curUser["First Name"] + " " + curUser["Last Name"]
                          );
                          const isFull = (meeting.Attendees?.length || 0) >= 15;

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
                                  {meeting.Attendees?.length || 0}/15 spots
                                  filled
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
                                  disabled={loading || isFull}
                                  onClick={() =>
                                    handleSignUp(
                                      meeting.Topic,
                                      meeting.Attendees || [],
                                      meeting.Date
                                    )
                                  }
                                >
                                  {isFull ? "Full" : "Sign Up"}
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
                  <h2 className="text-xl font-semibold mb-4">Transfers</h2>
                  <div className="mb-4">
                    <Button onClick={() => setShowTransferDialog(true)}>New Transfer</Button>
                  </div>
                  <div className="flex-1 overflow-y-auto min-h-0">
                    {transfersLoading ? (
                      <p className="text-sm text-gray-500">Loading transfers…</p>
                    ) : transfers.length ? (
                      <ul className="space-y-4">
                        {transfers.map((t) => (
                          <li
                            key={t.id}
                            className="p-4 bg-gray-50 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                          >
                            <div>
                              <h3 className="font-bold text-sm sm:text-base">
                                {t.source} → {t.destination}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-500">
                                {formatDate(t.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm sm:text-base font-semibold">
                                {t.amount !== null ? `${t.amount.toFixed(2)} Pelicoin` : "—"}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No transfer requests yet.</p>
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
                  Unfortunately, you don't have a ticket for the End-of-Year
                  celebration :( Purchase above in shop.
                </>
              )}
            </p>
          </div>
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
    </div>
  );
};

export default Home;
